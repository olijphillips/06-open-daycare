# SPEC 06 — Tabla `daycares` en Supabase

> **Status:** Aprobado
> **Depends on:** ninguno
> **Date:** 2026-08-17
> **Objective:** Crear la tabla raíz `daycares` en el proyecto Supabase aplicando el patrón de migraciones vía MCP `apply_migration`, con RLS activado y una guardería demo sembrada.

## Scope

**In:**

- Migración versionada aplicada al proyecto remoto `jmjcqadnhjdiuliaiqpy` vía MCP `apply_migration`.
- Tabla `public.daycares` con `id uuid PK default gen_random_uuid()`, `name text not null`, `created_at timestamptz not null default now()`.
- RLS habilitado + política `daycares_select_authenticated` (SELECT para rol `authenticated`, todas las filas).
- Seed: una fila "Guardería Sala Soles" dentro de la misma migración.
- Verificación post-migración (tabla, política, seed, advisors).

**Out of scope (for future specs):**

- Conexión de la app a Supabase (`@supabase/ssr`, env vars, cliente) — spec de integración futuro.
- Resto de tablas (`users`, `rooms`, `children`, `posts`, …) — próximos specs.
- Trigger `AFTER INSERT` en `auth.users` (pertenece a la tabla `users`).
- Tipos TypeScript de Supabase (`database.types.ts`).
- Políticas de escritura ni modelo multi-tenant por `daycare_id`.
- Columna `updated_at` (el esquema de referencia solo define `created_at` para `daycares`).

## Data model

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;

create policy "daycares_select_authenticated" on public.daycares
  for select to authenticated
  using (true);

insert into public.daycares (name) values ('Guardería Sala Soles');
```

Convenciones (según `07-DB-Schema`): PK `id` uuid con `gen_random_uuid()`; `created_at`/`updated_at` timestamptz; datos persistidos en inglés, etiquetas traducidas en UI.

## Implementation plan

1. **Verificar estado.** `list_tables` confirma que el proyecto está vacío (sin tablas ni migraciones). _Test:_ output vacío.
2. **Aplicar la migración.** `apply_migration` con nombre `create_daycares_table` y el SQL de arriba. _Test:_ retorna ok.
3. **Verificar.** `list_migrations` incluye `create_daycares_table`; `list_tables` muestra `daycares`; `execute_sql` `select name from public.daycares` devuelve la fila demo; `get_advisors` (security) sin avisos de RLS/permisos.

## Acceptance criteria

- [ ] `list_migrations` incluye la migración `create_daycares_table`.
- [ ] `public.daycares` existe con columnas `id` (uuid PK), `name` (text not null) y `created_at` (timestamptz not null default now()).
- [ ] RLS está habilitado en `daycares`.
- [ ] Existe la política `daycares_select_authenticated` (SELECT, rol `authenticated`, `using (true)`).
- [ ] Existe exactamente una fila con `name = 'Guardería Sala Soles'`.
- [ ] `get_advisors` (security) no reporta problemas en `daycares`.
- [ ] No cambia ningún archivo de la app (spec solo de base de datos).

## Decisions

- **Sí:** MCP `apply_migration` como patrón de migraciones — el proyecto remoto ya está conectado vía MCP y versiona la migración sin instalar CLI.
- **No:** Supabase CLI con carpeta `supabase/migrations/` — la CLI no está instalada y el MCP cubre el versionado.
- **Sí:** Tabla mínima `id`/`name`/`created_at` conforme al esquema de referencia.
- **No:** `updated_at` — no está en el esquema para esta tabla.
- **Sí:** RLS activado con SELECT para `authenticated` — patrón base de lectura de la guardería; escritura solo por `service_role`.
- **No:** Políticas de escritura/multi-tenant — dependen de `users`/roles que aún no existen.
- **Sí:** Seed "Guardería Sala Soles" en la misma migración con UUID generado.
- **No:** UUID fijo — ninguna tabla lo referencia todavía.
- **Sí:** PK `uuid gen_random_uuid()` — respeta la convención del proyecto.
- **No:** UUIDv7 — reduce fragmentación pero rompe la convención del esquema y la app es pequeña.
- **No:** Tipos TypeScript ni conexión de la app — se difieren a un spec de integración.

## Risks

| Riesgo                                                                    | Mitigación                                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| RLS sin política de escritura: la Data API no permite insertar            | Esperado; el seed corre en la migración vía rol con bypass RLS. La escritura llega con el modelo de acceso futuro. |
| SELECT `using (true)` expone todas las daycares a cualquier authenticated | Aceptado: lectura base sin datos sensibles; el filtrado por tenant llega en specs de RLS.                          |

## What is **not** in this spec

- Conexión de la app a Supabase.
- Resto de tablas ni triggers.
- Tipos TypeScript.
- Políticas de escritura o multi-tenant.
