-- SPEC 11 — Funciones de activación de cuenta de padre (invitaciones).

-- Valida la invitación (código + email opcional) y expone los datos
-- necesarios para el signup (el trigger handle_new_user los requiere).
create or replace function public.validate_invitation(
  p_code text,
  p_email text default null
) returns table (
  child_id uuid,
  child_name text,
  room_name text,
  daycare_id uuid,
  full_name text,
  relationship public.relationship_type,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    c.id,
    c.full_name,
    r.name,
    r.daycare_id,
    i.full_name,
    i.relationship,
    i.expires_at
  from public.invitations i
  join public.children c on c.id = i.child_id
  join public.rooms r on r.id = c.room_id
  where i.code = p_code
    and i.status = 'pending'
    and i.expires_at > now()
    and (p_email is null or i.email = p_email);

  if not found then
    raise exception 'INVALID_INVITATION';
  end if;
end;
$$;

-- Acepta la invitación: crea el vínculo padre-niño y marca accepted.
-- Solo el usuario autenticado cuyo email coincide con invitations.email.
create or replace function public.accept_invitation(
  p_code text
) returns table (
  child_id uuid,
  child_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invitation record;
begin
  select i.* into v_invitation
  from public.invitations i
  where i.code = p_code
    and i.status = 'pending'
    and i.expires_at > now()
  for update;

  if not found then
    raise exception 'INVALID_INVITATION';
  end if;

  if v_invitation.email is distinct from auth.jwt() ->> 'email' then
    raise exception 'EMAIL_MISMATCH';
  end if;

  insert into public.parent_children (parent_id, child_id, relationship)
  values (auth.uid(), v_invitation.child_id, v_invitation.relationship)
  on conflict (parent_id, child_id) do nothing;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_invitation.id;

  return query
  select c.id, c.full_name
  from public.children c
  where c.id = v_invitation.child_id;
end;
$$;

-- ACL: sin ejecución pública; solo a través de RPC con los roles indicados.
-- Nota: `validate_invitation` se crea con la firma (text, text) — el segundo
-- parámetro tiene default; no existe una firma (text) separada en pg_proc.
revoke execute on function public.validate_invitation(text, text) from public;
grant execute on function public.validate_invitation(text, text) to anon, authenticated;

revoke execute on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;
