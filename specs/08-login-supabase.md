# SPEC 08 — Login real con Supabase Auth

> **Status:** Implementado
> **Depends on:** SPEC 03, SPEC 07
> **Date:** 2026-08-17
> **Implemented:** 2026-08-18
> **Objective:** Conectar el login a Supabase Auth (email+contraseña), proteger las rutas del feed y reemplazar la sesión mock por el perfil real del usuario desde la tabla `users`.

## Scope

**In:**

- `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reales (obtenidas del proyecto remoto vía MCP; `.env.template` ya las documenta).
- Guard de rutas protegidas en `proxy.ts`: sin sesión válida, `/`, `/kids`, `/kids/[slug]` y `/crear-publicacion` redirigen a `/login` (usando `getUser`/`getClaims`).
- `utils/supabase/middleware.ts` devuelve además del `response` el cliente, para poder validar la sesión en el proxy.
- `SessionProvider` (cliente) en el root layout, con el usuario inicial resuelto desde el server (`createClient(cookies)` + `users` + `daycares`), y sincronizado con `onAuthStateChange` (evento `SIGNED_OUT` → `/login`).
- Hook `useSessionUser()` real que reemplaza al de `lib/mock/use-session.ts`; los consumidores actuales (`app/page.tsx`, `composer-trigger.tsx`, `sidebar-content.tsx`) pasan a usarlo.
- Login real en `components/auth/login.tsx`: `supabase.auth.signInWithPassword`, sin email precargado, estado de carga en el botón, error inline ("Email o contraseña incorrectos") y navegación a `/` en éxito.
- `/login` redirige a `/` si ya hay sesión activa.
- "¿Olvidaste tu contraseña?": `supabase.auth.resetPasswordForEmail` con flujo inline (pedir email → mensaje "Revisá tu correo").
- Perfil del sidebar/home desde la BD: `full_name`, `role` (enum traducido a etiqueta en español) + ` · Soles` (usando `classroom.name`), avatar por inicial con color derivado del nombre.
- Signout real: `supabase.auth.signOut()` en `sidebar-content.tsx`.
- Limpieza de mocks de sesión: `lib/mock/auth.ts` se reduce a datos de invitación (renombrado a `lib/mock/invitation.ts`), se elimina `lib/mock/use-session.ts` y `currentUser` de `lib/mock/feed.ts` si queda sin uso.
- `/kids/[slug]` deja de usar `generateStaticParams` (pasa a dinámica por lectura de cookies).
- Corrección de datos de los seeds de SPEC 07: `admin@` y `staff@` se recrearon con los valores que GoTrue v2.195 exige para poder loguear (ver "Nota sobre el seed de SPEC 07" al final).

**Out of scope (for future specs):**

- Conexión real de `/activar-cuenta` — la tabla `invitations` no existe; la página se queda visual con mock de invitación.
- Seed de `caro@opendaycare.com` — solo se usan las cuentas de SPEC 07 (`admin@` y `staff@`, clave `Staff2026!`).
- Rol `parent` ni pantalla `familia-feed` — solo admin/staff por ahora; un parent logueado vería la misma UI de staff (aceptado).
- Gating por rol (redirigir según `users.role`).
- `avatar_url` / Supabase Storage (fotos reales).
- Migrar feed y niños (`feed`, `children`) a la BD — siguen con mock.
- Tipos TypeScript generados (`database.types.ts`) — se usa un tipo local mínimo.
- Validación de formato de email en el reset (mínima) ni página propia de recuperación.
- Trigger de `updated_at`.

## Data model

No se crean tablas ni enums nuevos. Se introduce un módulo de perfil y se conservan los datos de invitación del mock:

```ts
// lib/auth/profile.ts
// Forma final del usuario que consumen los componentes (misma que la del mock).
export interface SessionUser {
  name: string; // "Nadia García"
  role: string; // "Admin · Soles" (etiqueta traducida + sala)
  initial: string; // "N"
  avatarBg: string; // color derivado de la paleta del mock
}

// Traducción UI de los enums de BD (los valores persistidos siguen en inglés).
export const roleLabels: Record<"admin" | "staff" | "parent", string> = {
  admin: "Admin",
  staff: "Maestro",
  parent: "Familia",
};

// Deriva el color de avatar de la paleta existente (determinista por nombre).
export function avatarColorFor(name: string): string;

// Construye el SessionUser a partir de una fila de users + el nombre del daycare.
export function buildProfile(input: {
  fullName: string;
  role: "admin" | "staff" | "parent";
  daycareName: string | null; // "Guardería Sala Soles"
}): SessionUser;
```

Convenciones:

- `role` visible = `roleLabels[role] + " · " + sala`, donde sala = `daycareName` sin el prefijo "Guardería " (o `classroom.name` del mock como fallback).
- Avatar: `initial` = primera letra de `full_name`; `avatarBg` por hash del nombre sobre la paleta de colores ya usada en el mock (`#C9B6E8`, `#A9C7E8`, `#F2937A`, `#A9D9E8`, …).
- El consulta del perfil es `users` (select por `id` del usuario autenticado, RLS `users_select_own`) con join a `daycares` (RLS `daycares_select_authenticated`).

```ts
// lib/mock/invitation.ts (renombrado desde lib/mock/auth.ts)
export interface Invitation {
  childName;
  classroom;
  initial;
  avatarBg;
  avatarColor;
}
export const authDefaults = {
  loginPasswordPlaceholder,
  invitationCode,
  accountEmail,
};
export const invitation: Invitation;
```

Se elimina de `authDefaults` el `loginEmail` (el login ya no precarga email).

## Implementation plan

1. **`.env.local` con credenciales reales.** Obtener URL y publishable key del proyecto remoto (MCP `get_project_url` / `get_publishable_keys`) y escribir `.env.local` (gitignored) siguiendo `.env.template`. _Test:_ `npm run build` no se queja de env faltantes.
2. **`lib/auth/profile.ts`.** Tipo `SessionUser`, `roleLabels`, `avatarColorFor` y `buildProfile`. _Test:_ `npm run build` sin errores de tipos.
3. **`components/auth/session-provider.tsx` + `lib/auth/use-session.ts`.** Provider cliente con contexto; recibe `initialUser`, se suscribe a `onAuthStateChange` con el browser client y, en `SIGNED_OUT`, hace `router.replace("/login")`. `useSessionUser()` devuelve `SessionUser | null` desde el contexto. _Test:_ render aislado con y sin usuario.
4. **Root layout con el perfil inicial.** En `app/layout.tsx` (server): `createClient(cookies)` → `getUser()` → `buildProfile` desde `users`+`daycares`; envolver `{children}` en `<SessionProvider initialUser={...}>`. _Test:_ `/login` y `/activar-cuenta` siguen renderizando; la home muestra el nombre real del usuario logueado.
5. **Proxy con guard de rutas.** `utils/supabase/middleware.ts` pasa a devolver `{ supabase, response }`; `proxy.ts` refresca la sesión, valida con `getUser()` y redirige a `/login` las rutas protegidas (`/`, `/kids`, `/kids/*`, `/crear-publicacion`) cuando no hay sesión. _Test:_ sin sesión, `/` y `/kids` redirigen a `/login`; `/login` y `/activar-cuenta` quedan accesibles.
6. **Login real.** `components/auth/login.tsx`: reemplazar `signIn` del mock por `signInWithPassword` (email sin precargar, contraseña controlada), botón con estado `submitting`, error inline al fallar, `router.push("/")` en éxito. Incluir el flujo inline de "¿Olvidaste tu contraseña?" (`resetPasswordForEmail` + mensaje de confirmación). _Test:_ `admin@opendaycare.com` + `Staff2026!` entra; clave mala muestra el error sin navegar.
7. **`/login` redirige si hay sesión.** En `app/login/page.tsx` (server), si `getUser()` devuelve sesión → `redirect("/")`. _Test:_ con sesión activa, visitar `/login` termina en `/`.
8. **Signout real.** `sidebar-content.tsx`: sustituir `signOut` del mock por `supabase.auth.signOut()` (el provider redirige vía `SIGNED_OUT`). _Test:_ "Cerrar sesión" vuelve a `/login` y las rutas protegidas quedan bloqueadas.
9. **Limpieza de mocks de sesión.** Renombrar `lib/mock/auth.ts` → `lib/mock/invitation.ts` (solo `Invitation`, `authDefaults` sin `loginEmail`, `invitation`) y actualizar imports de `activate-account.tsx` y `login.tsx`; eliminar `lib/mock/use-session.ts`; actualizar los 3 consumidores al nuevo `useSessionUser` (`lib/auth/use-session`) con guard de `null`; quitar `currentUser` de `lib/mock/feed.ts` si quedó sin uso. _Test:_ `npm run build` sin imports colgando.
10. **Verificación.** `npm run lint` y `npm run build` sin errores; `/kids/[slug]` ya no se prerenderiza estática; flujos manuales: login ok/error, logout, reset, guard de rutas y `/activar-cuenta` intacto.
11. **Corrección del seed de SPEC 07 (bloqueo encontrado en la verificación).** Los usuarios sembrados por SQL directo no podían loguear (500 `Database error querying schema` de GoTrue). Recrear `admin@` (vía signup + confirmación) y `staff@` (vía SQL corregido) con los valores que GoTrue exige. _Test:_ ambos loguean con `Staff2026!`.

## Acceptance criteria

- [x] `.env.local` existe con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reales.
- [x] Sin sesión, `/`, `/kids`, `/kids/[slug]` y `/crear-publicacion` redirigen a `/login`.
- [x] Con sesión activa, visitar `/login` redirige a `/`.
- [x] Login con `admin@opendaycare.com` / `Staff2026!` inicia sesión y llega al feed.
- [x] Login con `staff@opendaycare.com` / `Staff2026!` inicia sesión y llega al feed (usuario recreado por la corrección del seed).
- [x] Login con contraseña incorrecta muestra el error inline y no navega.
- [x] El campo email ya no viene precargado.
- [x] El sidebar, la home y el compositor muestran el perfil real (nombre + rol traducido + ` · Soles`) del usuario logueado.
- [x] "Cerrar sesión" vuelve a `/login` y las rutas protegidas quedan bloqueadas tras recargar.
- [x] "¿Olvidaste tu contraseña?" pide el email y muestra el mensaje de confirmación tras enviar el correo de reset (path de éxito verificado por código; el envío real quedó bloqueado por el rate limit de email de Supabase durante la prueba, y el error inline sí se verificó en vivo).
- [x] `/activar-cuenta` sigue renderizando con su mock de invitación sin errores.
- [x] No queda ningún import de `lib/mock/auth` ni `lib/mock/use-session` en la app.
- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` pasa (typecheck) sin prerenderizado estático de `/kids/[slug]`.

## Nota sobre el seed de SPEC 07

> 📎 Documento completo del error (síntoma, causa raíz, SQL y workarounds): [`known-errors/gotrue-seed-login-500.md`](../known-errors/gotrue-seed-login-500.md).

Durante la verificación, el login con los usuarios sembrados por SPEC 07 devolvía `500 Database error querying schema` en GoTrue v2.195. Causa raíz (documentada en [supabase/auth#1940](https://github.com/supabase/auth/issues/1940)): GoTrue hace `Scan` de `auth.users` y **falla si estas 4 columnas son NULL**: `confirmation_token`, `email_change`, `email_change_token_new` y `recovery_token` (deben ser `''`). Además, GoTrue exige `instance_id = 00000000-0000-0000-0000-000000000000` y la fila en `auth.identities` (convención actual: `provider_id` = el email o el id del usuario).

Corrección aplicada a la BD remota (no en las migraciones ya aplicadas):

- `admin@opendaycare.com` se recreó vía el signup de GoTrue (Auth API) y se confirmó su email.
- `staff@opendaycare.com` se creó por SQL con las 4 columnas a `''`, `instance_id` de GoTrue, identidad `email` y metadata `role`/`full_name`/`daycare_id`.

SQL de referencia para crear un usuario logueable por SQL editor:

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
-- + insert en auth.identities (provider 'email') y la fila en public.users
-- (el trigger on_auth_user_created la crea si la metadata trae daycare_id).
```

Para entornos nuevos (`supabase db reset`), el seed de SPEC 07 reproduciría el bug: corregir la migración `create_users_table` o aplicar este patrón de creación.

## Decisions

- **Sí:** Login con Supabase Auth email+contraseña — es el mecanismo que ya proveen los seeds de SPEC 07.
- **No:** OAuth/proveedores sociales — no pedidos.
- **Sí:** Proteger rutas en el proxy (redirección central con `getUser`) — cubre páginas server y cliente sin duplicar guard por página; patrón recomendado por Supabase.
- **No:** Proteger únicamente en cada página — deja agujeros en las páginas cliente y duplica lógica.
- **Sí:** `SessionProvider` en el root layout con usuario inicial desde server — evita flash de carga y centraliza el estado de sesión para los componentes cliente.
- **No:** Hook que consulta `getSession()` por su cuenta en cada cliente — parpadeo y desincronización con el SSR.
- **Sí:** Sin email precargado y cuentas demo `admin@`/`staff@` (decisión del usuario).
- **No:** Sembrar `caro@` con una migración nueva — decisión del usuario; no se toca la BD.
- **Sí:** Rol traducido (`roleLabels`) + sufijo ` · Soles` — respeta el mockup y las convenciones (etiquetas en español, enums en inglés).
- **No:** Usar `avatar_url` — no hay Storage ni fotos reales; el avatar por inicial conserva el aspecto actual.
- **Sí:** `resetPasswordForEmail` con flujo inline (decisión del usuario).
- **No:** Página propia de recuperación ni validación fuerte — mínimo viable.
- **Sí:** Perfil desde `users` (`full_name`, `role`) + `daycares.name` — fuente de verdad de SPEC 07.
- **No:** Tipos generados `database.types.ts` — se define un tipo local mínimo en `lib/auth/profile.ts` (SPEC 07 ya lo difirió).
- **Sí:** `/activar-cuenta` se queda visual con mock — la tabla `invitations` no existe y el flujo real es spec aparte.
- **No:** Conexión real de activación — requeriría `invitations` + envío de correo.
- **Sí:** Renombrar el mock de invitación a `lib/mock/invitation.ts` — separa el mock de datos visuales del mock de sesión que se elimina.
- **No:** Mantener `lib/mock/use-session.ts` — objetivo explícito de este spec es dejar el mock.
- **Sí:** `/kids/[slug]` pasa a dinámica — leer cookies la hace dependiente del request; se quita `generateStaticParams`.
- **No:** Mantenerla estática — imposible con la sesión por cookies.
- **Sí:** El root layout leyendo cookies vuelve dinámica toda la app — aceptado: una app con auth no se beneficia del prerenderizado estático de sus páginas protegidas.
- **Sí:** Recrear `admin@`/`staff@` con los valores que GoTrue exige (columnas `''`, `instance_id`, identidad) — sin esto el login era imposible; el seed SQL de SPEC 07 no genera usuarios logueables en GoTrue v2.195.
- **No:** Mantener los usuarios del seed de SPEC 07 tal cual — todo login devolvía 500 `Database error querying schema`.
- **Sí:** Documentar la corrección como nota del spec y referencia al issue de GoTrue — la corrección es de datos, no de esquema; no se editan las migraciones ya aplicadas.

## Risks

| Riesgo                                                                                     | Mitigación                                                                                                             |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Falta `.env.local` (no existe hoy) → el login falla en runtime.                            | Paso 1 del plan: crearlo con credenciales reales del proyecto (MCP) antes de tocar código.                             |
| Contraseñas demo (`Staff2026!`) conocidas y versionadas en la migración de SPEC 07.        | Aceptado: solo para pruebas; rotar antes de producción (ya documentado en SPEC 07).                                    |
| El guard del proxy depende de que `middleware.ts` devuelva el cliente.                     | Paso 5 toca ambos archivos juntos; el paso deja el proxy funcional antes de seguir.                                    |
| Un `parent` logueado vería la UI de staff (no existe familia-feed).                        | Aceptado: solo admin/staff son alcanzables hoy; el gating por rol queda fuera de scope.                                |
| `buildProfile` falla si el join a `daycares` no devuelve nombre.                           | `daycareName` nullable con fallback a `classroom.name` del mock.                                                       |
| `useSessionUser()` pasa a devolver `null` y los 3 consumidores podrían romperse.           | Paso 9 actualiza los consumidores con guard de `null`; en páginas protegidas nunca debería darse (el proxy lo impide). |
| El layout raíz dinámico cambia el output del build (adios prerenderizado estático global). | Decisión documentada; el único caso estático relevante era `/kids/[slug]`, que pasa a dinámica igual.                  |
| Los seeds de SPEC 07 no producen usuarios logueables (500 de GoTrue).                      | Recreados con los valores que GoTrue exige; documentado en "Nota sobre el seed de SPEC 07" (issue #1940).              |
| Rate limit de email de Supabase bloquea el signup/reset en ventanas de 1 hora.             | Crear usuarios por SQL corregido o por el dashboard (admin API, no envía email); el error del reset se muestra inline. |

## What is **not** in this spec

- Conexión real de `/activar-cuenta` (requiere la tabla `invitations`).
- Seed de `caro@opendaycare.com`.
- Corrección del archivo de migración de SPEC 07 (`create_users_table.sql`, ya aplicada) — se documenta la corrección de datos en "Nota sobre el seed de SPEC 07"; arreglar la migración para entornos nuevos queda como pendiente para un spec de BD.
- Rol `parent` / `familia-feed` / gating por rol.
- `avatar_url` ni Supabase Storage.
- Migración de `feed` y `children` a la BD (siguen con mock).
- Tipos TypeScript generados (`database.types.ts`).
- Página propia de recuperación de contraseña ni validación de email en el reset.
- Trigger de `updated_at`.
