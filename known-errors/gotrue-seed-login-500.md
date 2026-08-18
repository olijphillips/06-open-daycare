# GoTrue devuelve 500 `Database error querying schema` al loguear usuarios sembrados por SQL

> **Fecha:** 2026-08-18
> **Estado:** Resuelto (workaround aplicado)
> **Spec relacionado:** [SPEC 08 — Login real con Supabase Auth](../specs/08-login-supabase.md)
> **Proyecto:** `06-open-daycare` · Supabase Auth (GoTrue v2.195)

## Síntoma

Los usuarios creados por INSERT SQL directo en `auth.users` (seed de SPEC 07) no podían iniciar sesión. Cualquier intento de login con ellos devolvía un `500` de GoTrue con el mensaje:

```text
Database error querying schema
```

Ocurre tanto con `signInWithPassword` desde la app como con el endpoint `/auth/v1/token?grant_type=password` por curl. Se dispara **solo** con los usuarios insertados por SQL; los creados vía el signup de la Auth API sí loguean.

## Causa raíz

GoTrue v2.195 hace `Scan` de varias columnas de `auth.users` al autenticar. Fallaba al convertir a string columnas que estaban en `NULL`, provocando el 500 (`sql: Scan error converting NULL to string`). Las 4 columnas implicadas deben estar a `''` (string vacío) y **nunca** en `NULL`:

| Columna | Valor requerido |
| --- | --- |
| `confirmation_token` | `''` |
| `email_change` | `''` |
| `email_change_token_new` | `''` |
| `recovery_token` | `''` |

Además, GoTrue exige que el usuario cumpla con su convención de registro:

- `instance_id = '00000000-0000-0000-0000-000000000000'`
- Una fila en `auth.identities` (provider `email`; en la versión actual el `provider_id` = el email del usuario, en otras versiones era el `id`).

El seed de SPEC 07 insertaba esas columnas en `NULL` y sin identidad, por lo que ningún usuario sembrado era logueable.

Issue upstream: [supabase/auth#1940](https://github.com/supabase/auth/issues/1940)

## Fix aplicado

Los usuarios demo se recrearon con los valores que GoTrue exige:

- **`admin@opendaycare.com`** → se recreó vía el signup de la Auth API y se confirmó su email (GoTrue genera todos los campos correctamente, incluidas las identidades).
- **`staff@opendaycare.com`** → se creó por SQL con las 4 columnas a `''`, `instance_id` de GoTrue, identidad `email` y metadata `role`/`full_name`/`daycare_id` (que dispara el trigger `on_auth_user_created` para crear la fila en `public.users`).

Ambos loguean con la clave demo `Staff2026!`. No se modificó ninguna migración ya aplicada (solo se corrigieron los datos del entorno remoto).

## SQL de referencia (crear usuario logueable)

```sql
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, email_change, email_change_token_new, recovery_token,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  'staff@opendaycare.com',
  extensions.crypt('Staff2026!', extensions.gen_salt('bf', 10)),
  now(), '', '', '', '',
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('sub', gen_random_uuid()::text, 'email', 'staff@opendaycare.com',
    'email_verified', false, 'phone_verified', false, 'role', 'staff',
    'full_name', 'Luis Pérez', 'daycare_id', '<daycare-uuid>'),
  now(), now()
);

-- La identidad la crea GoTrue/el signup; si se inserta por SQL, hay que añadirla:
insert into auth.identities (
  id, user_id, identity_data, provider, last_sign_in_at,
  created_at, updated_at, provider_id
) values (
  gen_random_uuid(),
  (select id from auth.users where email = 'staff@opendaycare.com'),
  jsonb_build_object('sub', '<user-uuid>', 'email', 'staff@opendaycare.com',
    'email_verified', false, 'phone_verified', false),
  'email', now(), now(), now(),
  '<user-uuid>'
);
```

Nota: si la metadata trae `daycare_id`, el trigger `on_auth_user_created` crea la fila en `public.users` automáticamente.

## Workarounds

1. **Preferir la Auth API al signup** (`supabase.auth.signUp`) y confirmar el email — GoTrue genera todos los campos e identidades correctamente. Es el camino recomendado (limita emails por hora en el plan free).
2. **Crear desde el dashboard de Supabase** (Authentication → Users → "Add user") — equivale al signup y no envía email.
3. **Si se inserta por SQL**, copiar el patrón de arriba: 4 columnas a `''`, `instance_id` de GoTrue e identidad `email`.

## Reproducción

1. `supabase db reset` (o aplicar el seed de SPEC 07 tal cual).
2. `curl -X POST "<SUPABASE_URL>/auth/v1/token?grant_type=password" -H "apikey: <KEY>" -d '{"email":"admin@opendaycare.com","password":"Staff2026!"}'`
3. Resultado: `{"code":500,"message":"Database error querying schema"}`.

## Prevención

- Para entornos nuevos: corregir la migración `create_users_table` de SPEC 07 con este patrón (columnas `''`, `instance_id`, identidad) antes de aplicar el seed. Queda pendiente en un spec de BD.
- Al escribir seeds que inserten en `auth.*`, replicar exactamente la convención de GoTrue (no insertar `NULL` en columnas que GoTrue escanea).
- Auditoría rápida si un login devuelve 500 `Database error querying schema`:

```sql
select email, instance_id,
  confirmation_token is null, email_change is null,
  email_change_token_new is null, recovery_token is null
from auth.users
where email in ('admin@opendaycare.com', 'staff@opendaycare.com');
```

Cualquier `true` indica un usuario que no podrá loguear.
