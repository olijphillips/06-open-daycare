-- separate_panels_rls
-- Separación de paneles staff/familia: aislamiento multi-tenant de la lectura.
-- Reemplaza las políticas SELECT `using (true)` por políticas scoped por rol y
-- daycare, y corrige las escaladas críticas detectadas por @db-security-auditor:
--   - users_update_own sin WITH CHECK → auto-asignación de role/daycare_id.
--   - ACL de validate_invitation/accept_invitation reseteadas por CREATE OR REPLACE.
-- Quedan para un cambio aparte: scope de daycare en escrituras staff (#6),
-- handle_new_user desde raw_user_meta_data (#5) y enumeración de códigos (#7).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Helpers SECURITY DEFINER (bypasean RLS) para romper recursión en políticas.
--    Los subselects internos corren con privilegios del dueño (postgres).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = (select auth.uid());
$$;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

create or replace function public.current_user_daycare()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select daycare_id from public.users where id = (select auth.uid());
$$;

revoke execute on function public.current_user_daycare() from public, anon;
grant execute on function public.current_user_daycare() to authenticated;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where users.id = (select auth.uid())
      and users.role in ('admin', 'staff')
  );
$$;

revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. daycares: solo el daycare del usuario.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy "daycares_select_authenticated" on public.daycares;

create policy "daycares_select_own" on public.daycares
  for select to authenticated
  using ((select public.current_user_daycare()) = daycares.id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. rooms: solo las salas del daycare del usuario.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy "rooms_select_authenticated" on public.rooms;

create policy "rooms_select_own" on public.rooms
  for select to authenticated
  using ((select public.current_user_daycare()) = rooms.daycare_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. children: staff del daycare o padre con vínculo en parent_children.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy "children_select_authenticated" on public.children;

create policy "children_select_staff" on public.children
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = (
      select daycare_id from public.rooms where rooms.id = children.room_id
    )
  );

create policy "children_select_parent" on public.children
  for select to authenticated
  using (
    exists (
      select 1 from public.parent_children
      where parent_children.child_id = children.id
        and parent_children.parent_id = (select auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. parent_children: filas propias o del daycare del staff.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy "parent_children_select_authenticated" on public.parent_children;

create policy "parent_children_select_own" on public.parent_children
  for select to authenticated
  using (parent_id = (select auth.uid()));

create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = (
      select r.daycare_id
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = parent_children.child_id
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. invitations: solo staff del daycare del niño. El padre consume la
--    invitación exclusivamente vía las RPC validate_invitation/accept_invitation.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy "invitations_select_authenticated" on public.invitations;

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = (
      select r.daycare_id
      from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
    )
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. users: propia fila o staff del mismo daycare (el perfil del niño lista
--    padres vinculados). Corrige la escalada: el UPDATE propio no puede
--    cambiar role ni daycare_id (WITH CHECK contra la fila vigente).
-- ─────────────────────────────────────────────────────────────────────────────
create policy "users_select_staff" on public.users
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = users.daycare_id
  );

drop policy "users_update_own" on public.users;

create policy "users_update_own_profile" on public.users
  for update to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select public.current_user_role())
    and daycare_id = (select public.current_user_daycare())
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. ACL de las RPC de activación: las migraciones posteriores con
--    CREATE OR REPLACE resetean los REVOKE. Re-aplicar.
--    validate_invitation sigue ejecutable por anon (se llama pre-signup);
--    accept_invitation solo por authenticated (post-signup).
-- ─────────────────────────────────────────────────────────────────────────────
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;

revoke execute on function public.validate_invitation(text, text) from public;
grant execute on function public.validate_invitation(text, text) to anon, authenticated;
