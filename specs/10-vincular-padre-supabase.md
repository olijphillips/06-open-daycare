# SPEC 10 — Vincular padre con envío real de invitación (Supabase + Resend)

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 08, SPEC 09
> **Date:** 2026-08-18
> **Objective:** Activar la pantalla de vincular padre con datos reales: crear las tablas `invitations` y `parent_children` con RLS, enviar el correo de invitación con Resend mediante una Server Action y mostrar los padres (pendientes y activos) en el perfil del niño desde la BD.

## Scope

**In:**

- Migración local `create_invitations_tables` (`supabase/migrations/`): enums `relationship_type` y `invitation_status`, tablas `invitations` y `parent_children` conforme al esquema de referencia, índices (incl. UNIQUE en `code`), RLS y sin seeds (tablas vacías).
- RLS: `SELECT` para cualquier `authenticated` (patrón existente); `INSERT`/`UPDATE` solo `admin`/`staff` (verificado contra `public.users`, patrón de `children`).
- Dependencia `resend` en `package.json` y variable `RESEND_API_KEY` en `.env.local` (documentada en `.env.template`). Sin la key, la Server Action registra el correo en consola y no falla (modo dev).
- Server Action `sendInvitation` (`lib/actions/invitations.ts`): valida nombre no vacío y email con formato, genera un código aleatorio de 5 caracteres (alfabeto sin ambiguos, reintento ante colisión UNIQUE), inserta en `invitations` (status `pending`, `expires_at` +7 días, `invited_by` = usuario autenticado), envía el correo con Resend y, si el envío falla, elimina la fila y devuelve error.
- Email de invitación (`lib/emails/invitation.ts`): asunto + HTML con el nombre del padre, el nombre del niño, el código, el vencimiento y el enlace a `/activar-cuenta?code=…`. Remitente `OpenDayCare <onboarding@resend.dev>`.
- Modal `LinkParentModal`: pasa `childId` y el email al submit, valida en cliente, muestra estado de carga en el CTA y, tras el éxito, muestra el recuadro "CÓDIGO DE INVITACIÓN" con el código real generado y "Vence en 7 días".
- `LinkedParentsCard`: reactivada en el perfil del niño, recibe los datos iniciales desde el server (invitaciones pendientes + padres activos de `parent_children`) y, tras un envío exitoso, hace `router.refresh()` para que la lista se actualice desde la BD.
- Capa de datos nueva `lib/data/invitations.ts` con `ParentView`, `relationshipLabels` (father→Papá, mother→Mamá) y `fetchLinkedParents(childId)`.
- Perfil `/kids/[id]` y `KidProfile`: vuelven a mostrar la sección "PADRES VINCULADOS".

**Out of scope (for future specs):**

- Activación real del padre (`/activar-cuenta` con el código, creación del `users` role `parent` y de la fila en `parent_children`) — SPEC 03 sigue con mock.
- Gating del feed por rol ni pantalla `familia-feed`.
- Rol "Tutor/a" (`guardian`) — decisión del usuario: solo Mamá/Papá.
- Reenvío, cancelación ni expiración automática de invitaciones (los estados `expired`/`cancelled` existen en el enum pero no se gestionan).
- Edición o desvinculación de padres.
- React-Email ni plantillas rich — HTML inline.
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.

## Data model

```sql
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id),
  invited_by uuid not null references public.users (id),
  full_name text not null,
  email text not null,
  relationship public.relationship_type not null,
  code text not null unique,
  status public.invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_email_idx on public.invitations (email);
alter table public.invitations enable row level security;
create policy "invitations_select_authenticated" on public.invitations
  for select to authenticated using (true);
create policy "invitations_insert_staff" on public.invitations
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "invitations_update_staff" on public.invitations
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));

create table public.parent_children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.users (id),
  child_id uuid not null references public.children (id),
  relationship public.relationship_type not null,
  created_at timestamptz not null default now(),
  unique (parent_id, child_id)
);
create index parent_children_child_id_idx on public.parent_children (child_id);
alter table public.parent_children enable row level security;
create policy "parent_children_select_authenticated" on public.parent_children
  for select to authenticated using (true);
create policy "parent_children_insert_staff" on public.parent_children
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "parent_children_update_staff" on public.parent_children
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
```

Capa de datos (app):

```ts
// lib/data/invitations.ts
export type Relationship = "father" | "mother" | "guardian";

// Fila de UI de la lista de padres vinculados de un niño.
export interface ParentView {
  id: string; // invitation id (pending) o parent_children id (active) — key de React
  name: string; // full_name del padre
  relationship: Relationship;
  status: "pending" | "active";
  initial: string; // primera letra del nombre
  avatarBg: string; // Mamá → #C9B6E8, Papá → #A9C7E8 (paleta del mock)
  email?: string; // solo pendientes (invitations.email)
  expiresInDays?: number; // 7 — solo pendientes
}

// Traducción UI del parentesco (valores BD en inglés, etiquetas en español).
export const relationshipLabels: Record<Relationship, string> = {
  father: "Papá",
  mother: "Mamá",
  guardian: "Tutor/a",
};

// Invitaciones pendientes (status pending) + padres activos (parent_children
// join users) de un niño. Pendientes primero, cada grupo por created_at.
export async function fetchLinkedParents(
  childId: string,
): Promise<ParentView[]>;
```

Email (construcción del correo):

```ts
// lib/emails/invitation.ts
export interface InvitationEmail {
  subject: string; // "Te invitaron a seguir el día de Mateo"
  html: string;
}
export function buildInvitationEmail(input: {
  parentName: string; // "Diego Fernández"
  childFirstName: string; // "Mateo"
  code: string; // "7K4P9"
  expiresInDays: number; // 7
}): InvitationEmail;
```

Server Action:

```ts
// lib/actions/invitations.ts
export interface SendInvitationInput {
  childId: string; // uuid del niño en BD
  name: string;
  email: string;
  relationship: "father" | "mother"; // solo estos dos (decisión del usuario)
}
export interface SendInvitationResult {
  ok: boolean;
  error?: string;
  code?: string; // solo si ok — se muestra en el modal
  expiresAt?: string; // ISO — para "Vence en 7 días"
}
export async function sendInvitation(
  input: SendInvitationInput,
): Promise<SendInvitationResult>;
```

Convenciones:

- Código: 5 caracteres del alfabeto sin ambiguos (`ABCDEFGHJKMNPQRSTUVWXYZ23456789`) vía `crypto.randomInt`; reintento (acotado, p. ej. 3) si el UNIQUE de `code` devuelve 23505.
- `expires_at = now() + interval '7 days'` (el mockup dice "Vence en 7 días").
- Sin `RESEND_API_KEY`: la acción inserta la fila, loguea el correo en consola con `console.log` y devuelve `ok`. Con key: `resend.emails.send` con `from: "OpenDayCare <onboarding@resend.dev>"`; si el envío devuelve `error`, se borra la fila recién insertada y se devuelve error.
- Enlace del correo: `NEXT_PUBLIC_APP_URL` (`.env.template`, fallback `http://localhost:3000`) + `/activar-cuenta?code={code}`.
- El `Parent`/`buildNewParent` del mock deja de usarse (la lista viene de BD); `lib/mock/children.ts` se conserva solo para el compositor de posts.

## Implementation plan

1. **Migración BD.** `supabase migration new create_invitations_tables` → SQL completo (enums, tablas, índices, RLS, sin seeds) → `supabase db push`. _Test:_ `list_tables` muestra `invitations` y `parent_children`; `get_advisors` (security) sin avisos nuevos.
2. **Dependencia y env.** `npm install resend`; añadir `RESEND_API_KEY=your_resend_api_key` y `NEXT_PUBLIC_APP_URL=http://localhost:3000` a `.env.template` y `.env.local`. _Test:_ `npm run build` sin errores.
3. **`lib/emails/invitation.ts`.** `buildInvitationEmail` (asunto + HTML con nombre, código, vencimiento y enlace). _Test:_ `npm run build` sin errores de tipos.
4. **`lib/data/invitations.ts`.** Tipos `ParentView`/`Relationship`, `relationshipLabels`, `fetchLinkedParents` (invitaciones pending + parent*children join users). \_Test:* build; consulta manual sobre la BD devuelve `[]` hoy.
5. **Server Action `sendInvitation`** (`lib/actions/invitations.ts`, `'use server'`). Valida (nombre no vacío, email con regex simple), genera código con reintento, inserta, envía el correo (o loguea sin key), rollback si el envío falla, `revalidatePath` del perfil. _Test:_ build; sin key el correo aparece en consola y la fila persiste; email inválido devuelve error sin insertar.
6. **Modal `LinkParentModal`.** Nuevas props (`childId`, `onSuccess`) y submit con email; validación en cliente; estado `submitting` en el CTA; error inline; tras `ok`, muestra el recuadro "CÓDIGO DE INVITACIÓN" con el `code` devuelto y "Vence en 7 días", y el CTA pasa a "Listo". _Test:_ render aislado; flujo de error y de éxito.
7. **`LinkedParentsCard` + perfil.** La tarjeta recibe `childId` y `parents: ParentView[]` iniciales desde el server (el mock de `buildNewParent` se elimina); tras `onSuccess` hace `router.refresh()`; `KidProfile` y `/kids/[id]` reactivan la sección "PADRES VINCULADOS" pasándoles `fetchLinkedParents(child.id)`. _Test:_ `/kids/{uuid}` muestra los padres pendientes de la BD con badge PENDIENTE.
8. **Limpieza.** Eliminar `buildNewParent` de `lib/mock/children.ts` si queda sin uso y sus imports. _Test:_ `npm run build` sin imports colgando.
9. **Verificación.** `npm run lint` + `npm run build`; flujos manuales: enviar invitación (valida, muestra código, padre pendiente en la lista y persiste al recargar), RLS (INSERT de invitación denegado a un `parent`), correo logueado sin key.

## Acceptance criteria

- [x] `public.invitations` y `public.parent_children` existen con los enums `relationship_type` e `invitation_status` y las políticas RLS (SELECT `authenticated`, INSERT/UPDATE `admin`/`staff`).
- [x] `invitations.code` es UNIQUE y `expires_at` queda a 7 días de `created_at`.
- [x] Enviar la invitación desde el perfil de Mateo con nombre vacío o email inválido muestra un error inline y no inserta nada.
- [x] Con `RESEND_API_KEY` ausente, enviar una invitación válida registra el correo en consola (con el código y el enlace `/activar-cuenta?code=…`) y devuelve éxito.
- [x] Con `RESEND_API_KEY` presente, el correo se envía desde `OpenDayCare <onboarding@resend.dev>` al email del padre con el código y el vencimiento (verificado por código; el envío real requiere key válida).
- [x] Tras el éxito, el modal muestra el recuadro "CÓDIGO DE INVITACIÓN" con el código real generado y "Vence en 7 días".
- [x] Cada envío genera un código distinto.
- [x] La fila queda en `invitations` con `status = 'pending'`, `invited_by` = usuario autenticado y el parentesco correcto (`father`/`mother`).
- [x] La sección "PADRES VINCULADOS" del perfil muestra al padre nuevo con badge PENDIENTE y meta "invitación enviada", y persiste al recargar la página (viene de BD).
- [x] Un usuario con rol `parent` no puede crear invitaciones (RLS lo deniega).
- [x] No queda ningún uso del mock `buildNewParent` en la app.
- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` pasa (typecheck).

## Decisions

- **Sí:** Resend como proveedor de correo (decisión del usuario), con `RESEND_API_KEY` en `.env.local`.
- **Sí:** Remitente `OpenDayCare <onboarding@resend.dev>` — remitente test de Resend que no requiere dominio verificado (decisión del usuario); cambiará cuando haya dominio.
- **No:** Requerir dominio verificado para este spec — bloquea el desarrollo.
- **Sí:** Fallback a log en consola sin `RESEND_API_KEY` — el flujo de UI se puede probar sin configurar Resend.
- **No:** Falla dura sin key — rompe el desarrollo local.
- **Sí:** Envío desde una Server Action — validación y autorización en el servidor (patrón de SPEC 08/09).
- **No:** Route Handler `/api/…` — la Server Action cubre el caso sin exponer un endpoint.
- **Sí:** Código aleatorio de 5 caracteres generado en el servidor, UNIQUE, con reintento acotado ante colisión, y `expires_at` a 7 días (mockup).
- **No:** Código fijo `7K4P9` — solo era válido en el mock.
- **Sí:** El recuadro del mockup muestra el código real tras el éxito de la acción (decisión del usuario).
- **Sí:** Validación mínima (nombre no vacío + formato de email) en cliente y servidor.
- **No:** Enviar sin validación como el mock — ahora se manda un correo real.
- **Sí:** Solo Mamá/Papá (`father`/`mother`) — se mantiene la decisión de SPEC 05.
- **No:** "Tutor/a" (`guardian`) aunque el enum lo soporte y el mockup lo muestre.
- **Sí:** Reactivar la sección "PADRES VINCULADOS" leyendo de BD: invitaciones `pending` + padres activos de `parent_children` (decisión del usuario).
- **No:** Mantener la sección oculta (SPEC 09) — la pantalla vincular-padre queda real y completa.
- **Sí:** Crear `parent_children` en esta migración aunque hoy quede vacía — la consulta del perfil la necesita y el spec de activación la poblará.
- **No:** Crear `parent_children` vía el spec de activación — dejaría la consulta del perfil rota.
- **Sí:** Rollback de la fila si el envío de Resend falla — la BD refleja lo que realmente se envió.
- **No:** Mantener la invitación `pending` si el correo no salió — deja invitaciones huérfanas.
- **No:** React-Email — HTML inline es suficiente para este spec.
- **No:** Reenvío/cancelación/expiración automática, edición o desvinculación, tipos generados ni trigger `updated_at`.

## Risks

| Riesgo                                                            | Mitigación                                                                                                                 |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Sin `RESEND_API_KEY` el correo no sale (solo log).                | Aceptado como modo dev y documentado; en producción la key es obligatoria.                                                 |
| `onboarding@resend.dev` solo entrega a tu propio email verificado | Aceptado en dev; el envío real requiere un dominio verificado (fuera de scope).                                            |
| Fallo/rate-limit de Resend en el envío.                           | La acción elimina la fila insertada y devuelve error inline; se puede reintentar.                                          |
| Colisión del código UNIQUE.                                       | Reintento acotado con `crypto.randomInt`.                                                                                  |
| El mock `buildNewParent` queda huérfano.                          | Paso 8 lo elimina junto con sus imports; `lib/mock/children.ts` se conserva para el compositor.                            |
| RLS de `parent_children` solo para staff → la activación futura.  | Documentado: el spec de activación podrá añadir una política de INSERT para el propio `parent` (`parent_id = auth.uid()`). |

## What is **not** in this spec

- Activación real del padre (`/activar-cuenta`, `users` role `parent`, poblar `parent_children`).
- Gating del feed por rol ni `familia-feed`.
- Rol "Tutor/a".
- Reenvío, cancelación ni expiración automática de invitaciones.
- Edición o desvinculación de padres.
- React-Email / plantillas rich.
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.
