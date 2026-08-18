# SPEC 07 — Tabla `users` y sus enumeraciones en Supabase

> **Status:** Implementado
> **Depends on:** SPEC 06
> **Date:** 2026-08-17
> **Objective:** Crear la tabla `users` con los enums `user_role`/`user_status`, el trigger `AFTER INSERT` en `auth.users` que la puebla desde `raw_user_meta_data`, RLS de fila propia, y dos usuarios de prueba con login (admin y staff), usando migraciones versionadas con la CLI de Supabase.

## Scope

**In:**

- Migración local versionada generada con `supabase migration new create_users_table` y empujada al proyecto remoto `jmjcqadnhjdiuliaiqpy` con `supabase db push`.
- Enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`).
- Tabla `public.users` conforme al esquema de referencia: `id` uuid PK FK → `auth.users(id)` ON DELETE CASCADE, `daycare_id` FK → `daycares` NOT NULL, `role`, `status` (default `active`), `full_name`, `avatar_url` nullable, `notify_on_post` y `daily_summary_enabled` (default `true`), `created_at`/`updated_at`.
- Índice `users_daycare_id_idx` sobre `daycare_id`.
- Trigger `on_auth_user_created` (función `public.handle_new_user()`, SECURITY DEFINER) que inserta la fila en `users` al crear una fila en `auth.users`.
- RLS habilitado + políticas de fila propia: `users_select_own` y `users_update_own` (`auth.uid() = id`).
- Revocación de `EXECUTE` sobre `handle_new_user` a `anon`/`authenticated` y a `PUBLIC` (dos migraciones de seguimiento) — elimina los WARN de advisors por invocar la función vía RPC sin afectar al trigger.
- Seeds de prueba en `auth.users` con email confirmado y contraseña bcrypt para login real: `admin@opendaycare.com` (rol `admin`) y `staff@opendaycare.com` (rol `staff`), ambos vinculados a "Guardería Sala Soles".
- Verificación post-migración (enums, tabla, políticas, trigger, seeds, advisors).

**Out of scope (for future specs):**

- Conexión de la app a Supabase (`@supabase/ssr`, env vars, cliente) — spec de integración futuro.
- Resto de tablas (`rooms`, `children`, `parent_children`, `invitations`, `posts`, …) — próximos specs.
- Signup/flujo de invitación de padres por la app (el trigger se ejecuta, pero el flujo de onboarding es spec aparte).
- Trigger de actualización automática de `updated_at`.
- Políticas de lectura para staff/feed (leer usuarios del mismo daycare) — dependen de specs de rol/feed.
- Seed de un usuario `parent` — solo se piden admin y staff; el padre de prueba llega con el spec de vínculo.
- Tipos TypeScript de Supabase (`database.types.ts`).

## Data model

```sql
create extension if not exists pgcrypto with schema extensions;

create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  daycare_id uuid not null references public.daycares (id),
  role public.user_role not null default 'parent',
  status public.user_status not null default 'active',
  full_name text not null,
  avatar_url text,
  notify_on_post boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;

create policy "users_select_own" on public.users
  for select to authenticated
  using (auth.uid() = id);

create policy "users_update_own" on public.users
  for update to authenticated
  using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, daycare_id, role, full_name)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'daycare_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'parent'),
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Migraciones de seguimiento (aplicadas aparte): impiden invocar la función por RPC.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.handle_new_user() from public;

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
(
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@opendaycare.com',
  extensions.crypt('Staff2026!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'role', 'admin',
    'full_name', 'Nadia García',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(),
  now()
),
(
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'staff@opendaycare.com',
  extensions.crypt('Staff2026!', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object(
    'role', 'staff',
    'full_name', 'Luis Pérez',
    'daycare_id', (select id from public.daycares where name = 'Guardería Sala Soles')
  ),
  now(),
  now()
);
```

Convenciones (según `07-DB-Schema`): PK `id` uuid; `created_at`/`updated_at` timestamptz; datos persistidos en inglés, etiquetas traducidas en UI. `users` comparte UUID con `auth.users`; no se duplican `email` ni `password_hash`.

## Implementation plan

1. **Generar la migración local.** `supabase migration new create_users_table` → crea `supabase/migrations/<timestamp>_create_users_table.sql`. _Test:_ archivo creado con el patrón de timestamp.
2. **Editar la migración.** Pegar el SQL del data model (enums → tabla → índice → RLS → trigger → seeds). _Test:_ revisión del SQL.
3. **Asegurar acceso al remoto.** `supabase login` (token) y `supabase link --project-ref jmjcqadnhjdiuliaiqpy` (crea `supabase/config.toml` si no existe). _Test:_ `supabase projects list` muestra el proyecto remoto.
4. **Revisar divergencias de historial.** `supabase migration list` compara local vs remoto (el archivo de `daycares` ya está espejado en local). _Test:_ solo aparece la migración nueva como pendiente.
5. **Empujar al remoto.** `supabase db push` aplica `create_users_table`. _Test:_ `db push` termina sin errores.
6. **Revocar EXECUTE de `handle_new_user`.** Crear `supabase migration new revoke_execute_handle_new_user` con `revoke execute ... from anon, authenticated` y, al comprobar que `PUBLIC` seguía con permiso, una segunda migración con `revoke execute ... from public`. Empujar ambas con `db push`. _Test:_ `get_advisors` deja de reportar `handle_new_user`.
7. **Verificar.** MCP: `list_migrations` incluye las nuevas; `list_tables` muestra `users`; `execute_sql` confirma enums, políticas, trigger y las 2 filas con roles `admin`/`staff`; `get_advisors` (security) sin avisos nuevos.

## Acceptance criteria

- [x] `supabase/migrations/20260818004501_create_users_table.sql` existe y está versionado.
- [x] `list_migrations` (MCP) incluye la migración `create_users_table`.
- [x] Los enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`) existen.
- [x] `public.users` existe con las columnas del data model (id uuid PK FK auth.users, daycare_id FK daycares NOT NULL, role default parent, status default active, full_name, avatar_url nullable, notify_on_post y daily_summary_enabled default true, created_at/updated_at).
- [x] Existe el índice `users_daycare_id_idx`.
- [x] RLS habilitado en `users` con políticas `users_select_own` y `users_update_own` (`auth.uid() = id`).
- [x] Existen la función `public.handle_new_user()` (SECURITY DEFINER) y el trigger `on_auth_user_created`.
- [x] El ACL de `handle_new_user` no expone `EXECUTE` a `anon`/`authenticated`/`PUBLIC` (solo owner y `service_role`).
- [x] `auth.users` tiene 2 filas con `email_confirmed_at` set: `admin@opendaycare.com` y `staff@opendaycare.com`, con contraseña encriptada bcrypt.
- [x] `public.users` tiene exactamente 2 filas: una con rol `admin` (Nadia García) y una con rol `staff` (Luis Pérez), ambas vinculadas a "Guardería Sala Soles".
- [x] `get_advisors` (security) no reporta problemas nuevos en `users`.
- [x] No cambia ningún archivo de código de la app.

## Decisions

- **Sí:** Trigger `AFTER INSERT` en `auth.users` con función SECURITY DEFINER — cumple la nota del esquema y puebla `users` desde `raw_user_meta_data` en cualquier signup.
- **No:** Seeds directos en `public.users` sin trigger — el trigger es el mecanismo documentado y evita que futuros signups queden sin perfil.
- **Sí:** Enums como tipos PostgreSQL `user_role` y `user_status` — conforme al esquema de referencia.
- **Sí:** `daycare_id` NOT NULL — el esquema no lo marca nullable y la relación del requerimiento es "un usuario está en un daycare".
- **No:** `daycare_id` nullable — rompería la relación declarada.
- **Sí:** RLS de fila propia (SELECT/UPDATE donde `auth.uid() = id`) — datos personales; mínimo y privado.
- **No:** `select` para todos los `authenticated` (como `daycares`) — expone datos personales de todos los usuarios.
- **No:** Lectura staff/admin del mismo daycare — se ampliará en specs de rol/feed.
- **Sí:** Seeds admin/staff insertados en `auth.users` con `email_confirmed_at` y contraseña `Staff2026!` encriptada con bcrypt — permiten login real para probar.
- **No:** Seed de un usuario `parent` — el usuario solo pidió admin y staff.
- **Sí:** CLI de Supabase (2.114.0) con `supabase migration new` + `db push` — flujo local obligatorio de AGENTS.md; CLI instalada a petición del usuario.
- **No:** MCP `apply_migration` como mecanismo de esta migración — SPEC 06 lo usó por no haber CLI; ahora se prefiere la CLI.
- **Sí:** Índice `users_daycare_id_idx` sobre `daycare_id` — consultas por daycare (muchos usuarios por guardería) se indexan desde el inicio.
- **Sí:** Revocar `EXECUTE` de `handle_new_user` a `anon`/`authenticated`/`PUBLIC` (decisiones del usuario durante la implementación) — los advisors reportaban la función invocable vía RPC; el trigger sigue funcionando porque se dispara internamente y `service_role` conserva el permiso.
- **Sí:** `updated_at` con default `now()` — el esquema la define para `users`.
- **No:** Trigger de auto-actualización de `updated_at` — fuera de scope; se decide en un spec de persistencia.

## Risks

| Riesgo                                                                                                   | Mitigación                                                                                                                           |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| El trigger falla si `raw_user_meta_data` no incluye `daycare_id` (columna NOT NULL) y bloquea el signup. | Los seeds lo incluyen; documentar que todo signup debe pasar `daycare_id`; si se quiere tolerancia, un spec futuro lo hace nullable. |
| `db push` detecta divergencias entre el historial local y el remoto.                                     | `supabase migration list` antes de empujar; el archivo de `daycares` ya está espejado en `supabase/migrations/`.                     |
| Contraseñas de prueba (`Staff2026!`) conocidas y versionadas en el SQL de la migración.                  | Solo para pruebas; encriptadas con bcrypt; rotar antes de producción.                                                                |
| Insertar en `auth.users` requiere privilegios sobre el esquema `auth`.                                   | `db push` se ejecuta con rol con privilegios (service role / postgres), mismo nivel que `apply_migration` de SPEC 06.                |
| El trigger es SECURITY DEFINER y escribe en `users`: riesgo de escritura no deseada.                     | Solo inserta desde el evento AFTER INSERT de `auth.users`; los valores `role`/`full_name` se revalidan en specs de RLS futuros.      |
| `extensions.crypt`/`gen_salt` dependen de pgcrypto.                                                      | Migración idempotente `create extension if not exists pgcrypto with schema extensions`.                                              |

## What is **not** in this spec

- Conexión de la app a Supabase.
- Resto de tablas ni enums (rooms, children, parent_children, invitations, posts…).
- Signup/flujo de invitación de padres por la app.
- Trigger de actualización de `updated_at`.
- Políticas de lectura para staff/feed.
- Seed de usuario `parent`.
- Tipos TypeScript.
