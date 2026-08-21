-- fix_rls_recursion
-- Rompe la recursión RLS introducida por separate_panels_rls:
--   children_select_parent → parent_children → parent_children_select_staff → children → …
-- La solución es leer parent_children / children / rooms con helpers SECURITY
-- DEFINER (bypasean RLS) para que las políticas no se re-evalúen en cadena.
-- Regla: las políticas SOLO referencian helpers SECURITY DEFINER, nunca tablas
-- directamente, salvo columnas de la propia fila (no subqueries sobre otras).

-- 1. Helpers SECURITY DEFINER nuevos.
create or replace function public.child_daycare_id(p_child_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select r.daycare_id
  from public.rooms r
  join public.children c on c.room_id = r.id
  where c.id = p_child_id;
$$;

revoke execute on function public.child_daycare_id(uuid) from public, anon;
grant execute on function public.child_daycare_id(uuid) to authenticated;

create or replace function public.is_parent_of(p_child_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.parent_children
    where parent_children.child_id = p_child_id
      and parent_children.parent_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_parent_of(uuid) from public, anon;
grant execute on function public.is_parent_of(uuid) to authenticated;

-- 2. children: usar is_parent_of / child_daycare_id (sin subqueries a tablas).
drop policy "children_select_staff" on public.children;

create policy "children_select_staff" on public.children
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = (select public.child_daycare_id(children.id))
  );

drop policy "children_select_parent" on public.children;

create policy "children_select_parent" on public.children
  for select to authenticated
  using ((select public.is_parent_of(children.id)));

-- 3. parent_children: el scope staff por daycare vía child_daycare_id.
drop policy "parent_children_select_staff" on public.parent_children;

create policy "parent_children_select_staff" on public.parent_children
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = (select public.child_daycare_id(parent_children.child_id))
  );

-- 4. invitations: mismo patrón.
drop policy "invitations_select_staff" on public.invitations;

create policy "invitations_select_staff" on public.invitations
  for select to authenticated
  using (
    (select public.is_staff())
    and (select public.current_user_daycare()) = (select public.child_daycare_id(invitations.child_id))
  );
