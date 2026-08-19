-- SPEC 11 — Fix de ambigüedad de columna en accept_invitation.
-- El RETURNS TABLE (child_id uuid, ...) crea una variable PL/pgSQL child_id
-- que colisiona con la columna destino del INSERT en parent_children
-- (SQLSTATE 42702 "column reference child_id is ambiguous"). La directiva
-- #variable_conflict use_column resuelve la referencia a la columna de tabla
-- conservando los nombres de salida (child_id, child_name).

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
#variable_conflict use_column
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
