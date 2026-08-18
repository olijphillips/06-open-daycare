-- Corrección al seed de SPEC 07: crea las identidades de auth (provider 'email')
-- para los usuarios de prueba. GoTrue exige la fila en auth.identities para
-- permitir el login email+contraseña; sin ella, signInWithPassword devuelve
-- invalid_credentials aunque el hash bcrypt sea correcto.
insert into auth.identities (
  id,
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  u.email,
  u.id,
  jsonb_build_object(
    'sub', u.id::text,
    'email', u.email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  now(),
  now(),
  now()
from auth.users u
where u.email in ('admin@opendaycare.com', 'staff@opendaycare.com')
on conflict (provider, provider_id) do nothing;
