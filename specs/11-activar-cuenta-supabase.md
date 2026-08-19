# SPEC 11 — Activación real de la cuenta del padre (código de invitación)

> **Status:** Aprobado
> **Depends on:** SPEC 03, SPEC 07, SPEC 08, SPEC 10
> **Date:** 2026-08-18
> **Objective:** Conectar `/activar-cuenta` con la BD: validar el código de `invitations` contra la invitación `pending`, crear el usuario `parent` en Supabase Auth (con `role`/`full_name`/`daycare_id` en `raw_user_meta_data` para el trigger de `users`), poblar `parent_children` y marcar la invitación como `accepted`, redirigiendo al padre logueado al feed.

## Scope

**In:**

- Migración local `create_activation_functions` (`supabase/migrations/`): dos funciones RPC `SECURITY DEFINER` (`validate_invitation` y `accept_invitation`) con `set search_path = public`, grants explícitos (`anon`/`authenticated`) y revoke de `PUBLIC`. No se tocan las tablas ni políticas de SPEC 10 (se reutilizan).
- RPC `validate_invitation(p_code, p_email default null)`: valida que el código exista en `invitations` con `status = 'pending'` y `expires_at > now()`; si `p_email` viene, también exige que coincida con `invitations.email`. Devuelve `child_id`, `child_name`, `room_name`, `daycare_id`, `full_name`, `relationship`, `expires_at` (join `children` + `rooms`).
- RPC `accept_invitation(p_code)`: solo para el usuario autenticado cuyo email coincide con `invitations.email`. Marca la invitación `accepted` (`accepted_at = now()`), inserta en `parent_children` (`parent_id = auth.uid()`, `child_id` y `relationship` de la invitación, con `on conflict (parent_id, child_id) do nothing`) y devuelve `child_id` + `child_name`.
- Server Action `activateAccount` (`lib/actions/activation.ts`, `'use server'`): valida formato (código no vacío, email con regex simple, contraseña ≥ 6), llama a `validate_invitation`, hace `supabase.auth.signUp` con `options.data = { role: 'parent', full_name, daycare_id }` (lo que el trigger de SPEC 07 necesita), llama a `accept_invitation` y redirige a `/`.
- Mapeo de errores de la Server Action: código inexistente, invitación vencida, email no coincide con la invitación, email ya registrado (`user_already_exists` → "Ya existe una cuenta con este email. Iniciá sesión.") y contraseña corta — cada uno con mensaje inline y el de email ya registrado con enlace a `/login`.
- Componente `ActivateAccount` (pasa a `'use client'`): recibe `code` desde `searchParams`, precarga la card de invitación (niño + sala) con `validate_invitation` al montar si hay código, valida en cliente, muestra estado de carga en el CTA y, tras el éxito, redirige a `/`.
- `app/activar-cuenta/page.tsx`: server component que lee `searchParams.code` (Promise en Next 16) y lo pasa al componente.
- Config manual de Supabase: **desactivar "Confirm email"** en Auth → Providers → Email (dashboard, no es código) para que el signup deje sesión activa al instante.
- Limpieza del mock: `lib/mock/invitation.ts` queda solo con `authDefaults.loginPasswordPlaceholder` (lo usa el login); se eliminan `invitation` y `authDefaults.invitationCode`/`accountEmail`.

**Out of scope (for future specs):**

- Reenvío, cancelación ni expiración automática de invitaciones (`expired`/`cancelled` no se gestionan; la RPC solo rechaza las vencidas).
- Gating del feed por rol ni `familia-feed` (el padre recién activado ve `/` igual que hoy).
- Guard del proxy para rol `parent`.
- Persistir el consentimiento de fotos del checkbox (queda visual; el consentimiento real es `children.photo_consent`, gestionado por staff).
- Flujo de "olvidé la contraseña" del padre recién activado (ya existe el reset en `/login`).
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.

## Data model

```sql
-- Migración: supabase/migrations/<timestamp>_create_activation_functions.sql
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
revoke execute on function public.validate_invitation(text, text) from public;
revoke execute on function public.validate_invitation(text) from public;
grant execute on function public.validate_invitation(text, text) to anon, authenticated;
grant execute on function public.validate_invitation(text) to anon, authenticated;

revoke execute on function public.accept_invitation(text) from public;
grant execute on function public.accept_invitation(text) to authenticated;
```

Capa de datos (app):

```ts
// lib/actions/activation.ts  ('use server')
export interface ActivateAccountInput {
  code: string;
  email: string;
  password: string;
}
export interface ActivateAccountResult {
  ok: boolean;
  error?: string; // mensaje inline (español)
  errorCode?:
    | "invalid_code" // código inexistente / ya usado
    | "expired" // invitación vencida
    | "email_mismatch" // el email no coincide con la invitación
    | "email_exists" // ya hay una cuenta con ese email
    | "password_too_short"; // < 6 caracteres
}
export async function activateAccount(
  input: ActivateAccountInput,
): Promise<ActivateAccountResult>;
```

Convenciones:

- `validate_invitation` se invoca desde la Server Action (validación previa) y desde el cliente (browser `supabase.rpc`) para precargar la card de invitación al montar con `?code=…`. Al ser `SECURITY DEFINER` con `set search_path = public` y grants explícitos, no requiere sesión para validar y no hereda la RLS de `invitations`.
- `accept_invitation` solo es alcanzable con sesión (`authenticated`); valida que el email del JWT coincida con el de la invitación para impedir activar con un código ajeno.
- El signup pasa `options.data = { role: 'parent', full_name, daycare_id }`; el trigger `handle_new_user` de SPEC 07 inserta la fila en `users` (requiere `daycare_id` NOT NULL — lo aporta `validate_invitation`).
- Orden en la Server Action: validar formato → `validate_invitation` → `signUp` → `accept_invitation` → `revalidatePath("/")` + redirigir a `/`. Si `signUp` falla por `user_already_exists`, no se llama a `accept_invitation`.
- Con "Confirm email" desactivado (dashboard), `signUp` devuelve sesión activa y el proxy deja pasar a `/`.

## Implementation plan

1. **Config manual Supabase.** En el dashboard (Auth → Providers → Email) desactivar "Confirm email". _Test:_ un `signUp` de prueba deja sesión sin confirmar.
2. **Migración BD.** `supabase migration new create_activation_functions` → SQL del data model → `supabase db push`. _Test:_ `list_migrations` la incluye; `execute_sql` sobre `pg_proc` muestra las dos funciones; `get_advisors` (security) sin avisos nuevos por ACL.
3. **`lib/actions/activation.ts`.** Server Action `activateAccount` con `createClient(await cookies())` y los pasos del data model (validación, `signUp`, `accept_invitation`, `revalidatePath`). _Test:_ `npm run build` sin errores de tipos.
4. **`app/activar-cuenta/page.tsx`.** Leer `searchParams` (Promise) y pasar `code` al componente. _Test:_ `/activar-cuenta?code=3W4KA` renderiza sin errores.
5. **`components/auth/activate-account.tsx`.** Pasa a `'use client'`: precarga la card con `supabase.rpc('validate_invitation')` si hay código; formulario con código/email/contraseña; validación en cliente (incluida contraseña ≥ 6); estado `submitting`; error inline; tras `ok` → `router.push("/")` + `router.refresh()`. _Test:_ render aislado y con `?code=`.
6. **Limpieza del mock.** En `lib/mock/invitation.ts` eliminar `invitation` y `authDefaults.invitationCode`/`accountEmail`; conservar `authDefaults.loginPasswordPlaceholder` y actualizar imports en el componente real. _Test:_ `npm run build` sin imports colgando.
7. **Verificación.** `npm run lint` + `npm run build`; flujo end-to-end con la invitación `3W4KA`/`ojaraph@gmail.com`: activar crea el usuario `parent` en `auth.users`/`users`, inserta en `parent_children` (Pepito), marca la invitación `accepted` con `accepted_at`, deja sesión activa y redirige a `/`; con código erróneo o email distinto falla sin insertar nada.

## Acceptance criteria

- [ ] Las funciones `public.validate_invitation` y `public.accept_invitation` existen, son `SECURITY DEFINER` con `set search_path = public`, y su ACL no expone `EXECUTE` a `PUBLIC` (solo `anon`/`authenticated` según corresponda).
- [ ] Con la invitación `3W4KA` (`ojaraph@gmail.com`, Pepito) la activación crea el usuario en `auth.users` y la fila en `public.users` con `role = 'parent'`, `full_name` de la invitación y el `daycare_id` de la sala de Pepito (vía trigger de SPEC 07).
- [ ] Tras la activación, `public.parent_children` tiene la fila (`parent_id` = nuevo usuario, `child_id` = Pepito, `relationship` = `father`) y la invitación queda `status = 'accepted'` con `accepted_at` seteado.
- [ ] El padre recién activado queda con sesión y `/activar-cuenta` lo redirige a `/` (el proxy deja pasar al usuario autenticado).
- [ ] Ingresar un código inexistente o ya `accepted` muestra error inline "Código inválido" sin insertar nada.
- [ ] Ingresar una invitación vencida (`expires_at < now()`) muestra error inline de vencimiento y no crea la cuenta.
- [ ] Ingresar un email que no coincide con el de la invitación muestra error inline y no crea la cuenta ni el vínculo.
- [ ] Un email ya registrado en `auth.users` devuelve "Ya existe una cuenta con este email. Iniciá sesión." con enlace a `/login`.
- [ ] Una contraseña de menos de 6 caracteres se rechaza en cliente y servidor.
- [ ] Al abrir `/activar-cuenta?code=3W4KA`, la card de invitación muestra "Pepito · Sala Sol" (datos reales de BD vía `validate_invitation`).
- [ ] El checkbox "Autorizo a la guardería…" queda visual sin persistir nada.
- [ ] No queda ningún uso del mock `invitation` ni de `authDefaults.invitationCode`/`accountEmail` en la app.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa (typecheck).

## Decisions

- **Sí:** Confirmación de email desactivada en el dashboard de Supabase — permite activar la cuenta al instante y probar el flujo completo (decisión del usuario).
- **No:** Mantener confirmación de email activa — obligaría a configurar SMTP y rompería la demo local.
- **Sí:** RPC `SECURITY DEFINER` para validar y aceptar la invitación — el padre aún no tiene sesión al validar y la RLS de `invitations`/`parent_children` no permite INSERT/UPDATE a un `parent` (SPEC 10); la función corre con privilegios del owner sin exponer `SERVICE_ROLE_KEY`.
- **No:** Server Action con `SERVICE_ROLE_KEY` — requiere añadir un secreto al env y repite el flujo de autorización en TS.
- **No:** Políticas RLS nuevas que dejen insertar a `parent` — ampliaría la superficie de `invitations`; las funciones acotan la operación a código + email.
- **Sí:** Dos RPC separadas (`validate_invitation` para precargar/validar y `accept_invitation` para el vínculo) — la primera corre sin sesión, la segunda exige `authenticated` y revalida el email del JWT.
- **No:** Una sola RPC que cree el `auth.users` — la creación de usuarios es competencia de Supabase Auth (`signUp`); la RPC solo resuelve el vínculo de dominio.
- **Sí:** `validate_invitation` devuelve `daycare_id` para pasarlo en `raw_user_meta_data` — el trigger `handle_new_user` de SPEC 07 lo exige (columna NOT NULL).
- **Sí:** `signUp` → `accept_invitation` en ese orden — el trigger de `users` necesita el `auth.uid()` de la sesión recién creada para `parent_id`.
- **No:** Insertar `parent_children` antes del signup — no habría `parent_id` válido.
- **Sí:** Mapeo de errores con `errorCode` + mensaje en español — el cliente muestra el mensaje correcto y enlaza a `/login` en el caso de email existente.
- **No:** Dejar el error crudo de Supabase — mensajes incomprensibles para el padre.
- **Sí:** Card de invitación precargada desde BD (`validate_invitation`) cuando hay `?code=` — datos reales (Pepito · Sala Sol) en vez del mock.
- **No:** Mantener los datos fijos de `lib/mock/invitation.ts` — el flujo ya es real.
- **Sí:** Checkbox de autorización de fotos solo visual — el esquema prevé `children.photo_consent` gestionado por staff; no hay columna por padre.
- **No:** Persistir el consentimiento del padre en una columna nueva — fuera del esquema de referencia y del alcance de la pantalla.
- **Sí:** Tras activar, iniciar sesión y redirigir a `/` (decisión del usuario) — flujo natural del mockup; el gating por rol llega en un spec futuro.
- **No:** Redirigir a `/login` pidiendo credenciales de nuevo — con "Confirm email" off la sesión ya está activa.

## Risks

| Riesgo                                                                          | Mitigación                                                                                                                        |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `validate_invitation` sin email expone datos de la invitación a `anon`.         | Devuelve datos no sensibles (nombre, sala, daycare_id); requiere un código `pending` no vencido; sin código no hay datos.         |
| Un padre activa con el código de otra persona (otro email).                     | `accept_invitation` exige que el email del JWT coincida con `invitations.email`; caso `EMAIL_MISMATCH`.                           |
| El signup con `user_already_exists` interrumpe el flujo.                        | Error mapeado a "Ya existe una cuenta…" con enlace a `/login`; no se llama a `accept_invitation`.                                 |
| La RPC se marca como mutable por advisors si falta `set search_path`.           | `set search_path = public` explícito en ambas funciones y ACL revocado de `PUBLIC` (patrón de SPEC 07).                           |
| `searchParams` en Next 16 es Promise y el tipo del componente cambia.           | Leer con `await` en el server component; el componente recibe `code: string` plano.                                               |
| La invitación `3W4KA` ya quedó `accepted` durante pruebas y no se puede reusar. | En verificación se genera una invitación nueva desde el perfil de Pepito o se resetea el status con una migración de datos local. |
| Confirmación de email re-habilitada en algún momento en el dashboard.           | Documentado en el plan: sin ella el signup no deja sesión y la redirección a `/` fallaría con redirect al login.                  |

## What is **not** in this spec

- Reenvío, cancelación ni expiración automática de invitaciones.
- Gating del feed por rol ni `familia-feed`.
- Guard del proxy para rol `parent`.
- Persistir el consentimiento de fotos del checkbox.
- Flujo de "olvidé la contraseña" específico para padres.
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.
