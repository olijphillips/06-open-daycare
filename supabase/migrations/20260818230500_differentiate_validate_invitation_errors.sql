-- SPEC 11 — Validación de invitación con errores diferenciados.
-- Reemplaza public.validate_invitation para distinguir:
--   INVALID_INVITATION  → código inexistente o ya usado (status != 'pending')
--   EXPIRED_INVITATION  → código pendiente pero vencido (expires_at <= now())
--   EMAIL_MISMATCH      → p_email viene y no coincide con invitations.email
-- La ACL y el resto de SPEC 11 no cambian (firma (text, text) conservada).

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
declare
  v_exists boolean;
  v_active boolean;
begin
  -- El código debe existir y estar pendiente (no aceptado, expirado ni cancelado).
  select exists (
    select 1 from public.invitations i
    where i.code = p_code
      and i.status = 'pending'
  ) into v_exists;

  if not v_exists then
    raise exception 'INVALID_INVITATION';
  end if;

  -- Pendiente pero fuera de vigencia → vencida.
  select exists (
    select 1 from public.invitations i
    where i.code = p_code
      and i.status = 'pending'
      and i.expires_at > now()
  ) into v_active;

  if not v_active then
    raise exception 'EXPIRED_INVITATION';
  end if;

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
    raise exception 'EMAIL_MISMATCH';
  end if;
end;
$$;
