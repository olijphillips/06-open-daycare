# SPEC 09 — Agregar niños con persistencia real en Supabase

> **Status:** Implementado
> **Depends on:** SPEC 06 (daycares), SPEC 07 (users), SPEC 08 (login real)
> **Date:** 2026-08-18
> **Objective:** Migrar la funcionalidad de niños a Supabase: crear las tablas `rooms` y `children` con RLS y seeds, conectar el listado `/kids` y el perfil `/kids/[id]` a la BD, y persistir el niño nuevo del modal mediante una Server Action. Vincular padre queda excluido.

## Scope

**In:**

- Migración local `create_rooms_children_tables` (`supabase/migrations/`): enum `child_status`, tablas `rooms` y `children` conforme al esquema de referencia, índices, RLS y seeds (3 salas + 8 niños del mock).
- Seed de salas: **Sol, Tierra y Luna** vinculadas a "Guardería Sala Soles".
- Seed de los 8 niños del mock (Mateo, Sofía, …) en la sala Sol, con fechas convertidas a ISO y alergias como `allergy_tags` en inglés.
- RLS: `SELECT` para cualquier `authenticated` (patrón de `daycares`); `INSERT`/`UPDATE` solo si el usuario es `admin`/`staff` (verificado contra `public.users`).
- `/kids` pasa a server component: lee `rooms` y `children` de la BD y agrupa por sala con contadores.
- `AddChildModal` recibe las salas por prop (ya no importa `classrooms` del mock) y guarda con la Server Action `createChild`.
- Server Action `createChild` (`'use server'`): valida, traduce alergias, inserta en `children` y devuelve el resultado; el modal cierra y hace `router.refresh()`.
- Perfil `/kids/[id]` (cambia de `[slug]` a `[id]`): lee el niño por `id` de la BD; la sección "Padres vinculados" se oculta.
- `KidCard` enlaza a `/kids/{id}`; el tag de la tarjeta se deriva solo de alergias (se oculta VINCULAR).
- Capa de datos nueva `lib/data/children.ts` con tipos `RoomView`/`ChildView` y funciones de mapeo BD → UI.

**Out of scope (for future specs):**

- Vincular padre (`parent_children`, `invitations`) — SPEC 05 sigue con mock en memoria.
- Migración del feed, el compositor de posts ni la home (contador "12 niños").
- Gating del listado por rol (un `parent` autenticado también vería el listado).
- Edición o eliminación de niños.
- `avatar_url` / fotos.
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.
- Validación semántica de fechas.

## Data model

```sql
create type public.child_status as enum ('active', 'archived');

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares (id),
  name text not null,
  created_at timestamptz not null default now()
);
create index rooms_daycare_id_idx on public.rooms (daycare_id);
alter table public.rooms enable row level security;
create policy "rooms_select_authenticated" on public.rooms
  for select to authenticated using (true);
create policy "rooms_insert_staff" on public.rooms
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "rooms_update_staff" on public.rooms
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));

create table public.children (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms (id),
  full_name text not null,
  birth_date date not null,
  enrolled_at date not null default current_date,
  medical_notes text,
  allergy_tags text[] not null default '{}',
  photo_consent boolean not null default true,
  status public.child_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index children_room_id_idx on public.children (room_id);
alter table public.children enable row level security;
create policy "children_select_authenticated" on public.children
  for select to authenticated using (true);
create policy "children_insert_staff" on public.children
  for insert to authenticated
  with check (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));
create policy "children_update_staff" on public.children
  for update to authenticated
  using (exists (select 1 from public.users
    where users.id = auth.uid() and users.role in ('admin', 'staff')));

-- Seed salas: Sol, Tierra y Luna para la guardería demo.
insert into public.rooms (daycare_id, name)
select id, name
from public.daycares d,
  unnest(array['Sol', 'Tierra', 'Luna']) as name
where d.name = 'Guardería Sala Soles';

-- Seed niños: los 8 del mock (SPEC 02/04), todos en la sala Sol.
-- Fechas convertidas del formato corto del mock a ISO.
insert into public.children (room_id, full_name, birth_date, enrolled_at, allergy_tags, medical_notes)
select
  (select r.id from public.rooms r where r.name = 'Sol'),
  x.full_name, x.birth_date, x.enrolled_at, x.allergy_tags, x.medical_notes
from (values
  ('Mateo Fernández', '2022-03-12', '2025-02-01', array['peanut'],
   'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.'),
  ('Sofía Méndez',   '2023-07-05', '2025-01-01', array[]::text[], null),
  ('Benjamín Ruiz',  '2022-11-22', '2025-03-01', array[]::text[], null),
  ('Valentina Soto', '2023-02-18', '2025-04-01', array[]::text[], null),
  ('Tomás Díaz',     '2022-09-09', '2025-02-01', array['lactose'], null),
  ('Emma Castro',    '2023-04-14', '2025-03-01', array[]::text[], null),
  ('Lucas Romero',   '2022-05-30', '2025-01-01', array[]::text[], null),
  ('Olivia Vega',    '2023-10-02', '2025-04-01', array[]::text[], null)
) as x(full_name, birth_date, enrolled_at, allergy_tags, medical_notes);
```

Capa de datos (app):

```ts
// lib/data/children.ts
export interface RoomView {
  id: string; // uuid de BD
  name: string; // "Sol"
}

export interface ChildView {
  id: string; // uuid de BD — clave del perfil
  name: string; // "Mateo Fernández"
  age: number; // 3
  avatarBg: string; // derivado por hash del nombre
  avatarColor: string;
  initial: string; // "M"
  parentsCount: number; // 0 (no hay parent_children aún)
  tag?: ChildTag; // solo alergias (MANÍ, LACTOSA…)
  birthDate: string; // "12 mar 2022"
  classroom: string; // "Sol"
  enrollmentDate: string; // "feb 2025"
  allergyNotes?: string; // medical_notes
}

// Traducción de alergias. Valores persistidos en inglés (convención DB),
// etiquetas visibles en español.
export const allergyTagMap: Record<string, string> = {
  maní: "peanut",
  cacahuate: "peanut",
  lactosa: "lactose",
  leche: "dairy",
  gluten: "gluten",
  huevo: "egg",
  pescado: "fish",
  mariscos: "shellfish",
  soja: "soy",
  "frutos secos": "nuts",
};
export const allergyLabelMap: Record<string, string> = {
  peanut: "MANÍ",
  lactose: "LACTOSA",
  dairy: "LECHE",
  gluten: "GLUTEN",
  egg: "HUEVO",
  fish: "PESCADO",
  shellfish: "MARISCOS",
  soy: "SOJA",
  nuts: "FRUTOS SECOS",
};

// "Maní, Lactosa" → ["peanut", "lactose"]. Lo no reconocido se descarta del
// array y se deja constancia en medical_notes (texto libre).
export function translateAllergiesToTags(input: string): string[];
```

Convenciones:

- `ChildView` reemplaza al `Child` del mock en el listado y el perfil. El mock de `children` se conserva **solo** para `components/feed/create-post.tsx` (compositor de posts) y las tarjetas de parents (`linked-parents-card`, `link-parent-modal`).
- Avatar: `initial` = primera letra; `avatarBg`/`avatarColor` derivados por hash del nombre (misma paleta que `lib/auth/profile.ts`).
- `age` calculado desde `birth_date`; `birthDate`/`enrollmentDate` se formatean en español corto (reutilizando el formato del mock).
- Tag de la tarjeta: solo si `allergy_tags` tiene etiquetas (traducidas a español). Sin `parent_children`, `parentsCount = 0` y el tag VINCULAR se oculta.

## Implementation plan

1. **Migración BD.** `supabase migration new create_rooms_children_tables` → SQL completo (enum, tablas, índices, RLS, seeds) → `supabase db push`. _Test:_ `list_tables` muestra `rooms` y `children`; 3 salas y 8 niños sembrados; `get_advisors` (security) sin avisos nuevos.
2. **`lib/data/children.ts`.** Tipos `RoomView`/`ChildView`, mapas de alergias, `translateAllergiesToTags`, `buildChildView(row)` (edad, inicial, avatar por hash, tag de alergia, fechas en español). _Test:_ `npm run build` sin errores de tipos.
3. **Server Action `createChild`** en `lib/actions/children.ts` (`'use server'`). Valida nombre/fecha (misma lógica del modal), traduce alergias (reconocidas → `allergy_tags`, resto → `medical_notes`), inserta con el server client. _Test:_ build; un `parent` no puede insertar (RLS) y un `admin`/`staff` sí.
4. **`/kids` a server component.** Lee `rooms` + `children` con el server client, agrupa por sala con contadores y pasa `rooms` al modal. Se elimina el `useState` del mock. _Test:_ el listado muestra los 8 niños desde la BD agrupados.
5. **Modal `AddChildModal`.** Recibe `rooms: RoomView[]` por prop; al Guardar llama `createChild`, cierra y hace `router.refresh()`. _Test:_ agregar un niño → aparece en su sala y persiste al recargar.
6. **Perfil `/kids/[id]`.** Ruta nueva con `params: { id }`; `fetchChildById` con `notFound()` si no existe. `KidProfile` recibe `ChildView`; se oculta `LinkedParentsCard`. _Test:_ `/kids/{uuid}` muestra los datos reales; uuid inexistente → 404.
7. **`KidCard`.** Link a `/kids/${child.id}`. _Test:_ la tarjeta navega al perfil por id.
8. **Limpieza.** Quitar imports del mock de `children` en `/kids`, `/kids/[id]` y `kid-profile`; el mock se conserva solo para `create-post.tsx` y las tarjetas de parents. _Test:_ `npm run build` sin imports colgando.
9. **Verificación.** `npm run lint` + `npm run build`; flujos manuales: listar, agregar (persiste al recargar), perfil por id, alergias en inglés en BD y traducidas en UI, RLS (INSERT denegado a parent).

## Acceptance criteria

- [x] `public.rooms` existe con 3 filas (Sol, Tierra, Luna) vinculadas a la guardería demo.
- [x] `public.children` existe con las 8 filas del mock (todas en Sol) y las alergias de Mateo/Tomás en `allergy_tags` (inglés).
- [x] RLS en `rooms` y `children`: SELECT para `authenticated`, INSERT/UPDATE solo `admin`/`staff`.
- [x] `/kids` lista los niños desde la BD agrupados por sala con contadores.
- [x] El modal lista las salas desde la BD.
- [x] Guardar un niño lo inserta en `children` y persiste al recargar la página.
- [x] "Maní, Lactosa" → `allergy_tags {peanut,lactose}`; las notas van a `medical_notes`.
- [x] `/kids/[id]` muestra el perfil desde la BD y no muestra la sección "Padres vinculados".
- [x] Las tarjetas enlazan a `/kids/[id]` y no muestran el tag VINCULAR.
- [x] No queda ningún import del mock de children en `/kids` ni en el perfil.
- [x] `npm run lint` y `npm run build` pasan sin errores.

## Decisions

- **Sí:** Un solo spec que incluye BD + integración — decisión del usuario (la BD sola no entrega la funcionalidad pedida).
- **Sí:** Salas Sol/Tierra/Luna como seed — consistencia con la UI de SPEC 04.
- **Sí:** Seed de los 8 niños del mock — el listado no queda vacío al migrar y la demo sigue funcionando.
- **Sí:** Ruta `/kids/[id]` (uuid de BD) — sin riesgo de colisión por nombres iguales; el `slug` del mock no existe en BD.
- **Sí:** Todo real: `parentsCount = 0`, sección "Padres vinculados" oculta, sin tag VINCULAR — no hay `parent_children` ni sentido de mostrar mock mezclado.
- **Sí:** Mapa fijo es→en para alergias; las no reconocidas van a `medical_notes` como texto libre.
- **Sí:** RLS SELECT para `authenticated` (patrón de `daycares`) + INSERT/UPDATE solo `admin`/`staff`.
- **Sí:** Server Action `createChild` + `router.refresh()` — mantiene la autorización/validación en el servidor (patrón de SPEC 08).
- **Sí:** `/kids` y el perfil pasan a leer de la BD; el mock de `children` se conserva para el compositor de posts y los parents.
- **No:** Vincular padre — spec futuro.
- **No:** Migrar feed, compositor de posts ni home — siguen con mock.
- **No:** Gating del listado por rol — llega con el spec de roles.
- **No:** Edición/eliminación, `avatar_url`, tipos generados, trigger de `updated_at`, validación semántica de fechas.

## Risks

| Riesgo                                                                                                  | Mitigación                                                                                                |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| El mock `children` sigue vivo para `create-post.tsx` y parents → conviven `Child` (mock) y `ChildView`. | Capa de datos con tipos propios; el mock queda documentado como exclusivo del feed/compositor.            |
| Links antiguos `/kids/[slug]` quedan obsoletos.                                                         | Aceptado; el `id` es la fuente de verdad y el feed no enlaza a perfiles.                                  |
| Un `parent` autenticado vería el listado (RLS SELECT amplio).                                           | Aceptado y documentado; el gating por rol llega en un spec futuro.                                        |
| `updated_at` no se auto-actualiza.                                                                      | Mismo criterio que `users` (SPEC 07); el trigger queda fuera de scope.                                    |
| La Server Action duplica la validación del modal.                                                       | Necesaria: la autorización y la validación de datos deben vivir en el servidor, nunca solo en el cliente. |
| Convertir fechas del formato corto del mock a ISO introduce errores de día/mes.                         | Revisión manual del seed contra los datos del mock en la verificación.                                    |

## What is **not** in this spec

- Vincular padre (`parent_children`, `invitations`).
- Migración del feed, del compositor de posts ni de la home.
- Gating por rol del listado.
- Edición o eliminación de niños.
- `avatar_url` / fotos.
- Tipos TypeScript generados (`database.types.ts`).
- Trigger de `updated_at`.
- Validación semántica de fechas.
