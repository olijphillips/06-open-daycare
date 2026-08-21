## Context

La app es hoy un único panel de staff: `app/page.tsx` renderiza el feed, el sidebar (`sidebar-content.tsx`) está hardcodeado a la variante "Maestra", y no existe ninguna ruta de familia. El `SessionUser` (`lib/auth/profile.ts`) guarda solo la etiqueta traducida del rol ("Admin · Soles"), no el rol crudo. El proxy (`proxy.ts`) valida únicamente sesión, y la RLS actual usa `using (true)` en `children`, `parent_children`, `invitations`, `rooms` y `daycares` (ver proposal.md — Why).

Restricciones relevantes: los usuarios staff existentes se crearon vía trigger desde Supabase Auth y pueden no tener `role` en `raw_user_meta_data` (los claims del JWT no son fuente fiable de rol). La activación de cuenta crea el parent con `role: "parent"` en `user_metadata`. El staff ya lee `users`, `parent_children` e `invitations` para el perfil del niño (`fetchLinkedParents` en `lib/data/invitations.ts`), y la activación usa RPC `SECURITY DEFINER` que eluden RLS.

## Goals / Non-Goals

**Goals:**

- Dos árboles de rutas reales (`/staff`, `/familia`) con gates por rol en los layouts.
- Sidebar y branding role-aware a partir del rol crudo en `SessionUser`.
- Redirect por rol centralizado para `/`, `/login` y la activación.
- RLS estricta sin romper los flujos staff existentes (listado de padres, invitaciones) ni la activación.
- Todas las migraciones RLS versionadas localmente y aplicadas con el flujo local → remoto.

**Non-Goals:**

- Construir las features reales de familia (chips de hijos, resumen del día, detalle/foto con contenido, "Mamá de X").
- Crear las tablas `posts`/`daily_summaries` ni su RLS (spec 12 posterior).
- Hacer el gate por rol en el proxy vía claims del JWT.
- Cambiar el modelo de datos ni los enums.

## Decisions

### D1. Dos árboles de rutas con segmento real, no route groups ni un único árbol

Se mueve el panel staff a `/staff` y se crea `/familia` para la familia. Cada panel tiene su `layout.tsx` propio (gate + shell) y sus páginas. La raíz `/` queda solo como redirect por rol.

- Alternativa descartada: un único árbol con el mismo URL y contenido distinto por rol (route groups `(staff)`/`(familia)`). Genera colisiones de URL (ambos quieren `/feed`), confunde el shell y contradice los diseños, que definen pantallas `familia-*` separadas.
- Alternativa descartada: mantener staff en `/`. Se descarta porque el usuario pidió explícitamente mudar el panel a `/staff`, y así ambos paneles quedan simétricos y el redirect por rol es trivial.

### D2. Gate por rol en los layouts de panel (query a `users`), no en el proxy

Cada layout de panel (`/staff`, `/familia`) es un Server Component que consulta `users.role` del usuario autenticado y redirige al home del otro panel si el rol no corresponde. El proxy sigue controlando solo la sesión (sin sesión → `/login`).

- Racional: los usuarios staff existentes pueden no tener `role` en los claims; la DB es la fuente de verdad y siempre está fresca. Leer una fila en un layout es barato y se cachea por render.
- Alternativa descartada: gate en el proxy con `supabase.auth.getClaims()`. Rápido pero poco fiable para usuarios existentes sin metadatos, y duplicaría la lógica de rol en dos sitios.

### D3. Rol crudo en `SessionUser`

`SessionUser` pasa a exponer `role: UserRole` (crudo, en inglés) y `roleLabel` (etiqueta visible derivada). `buildProfile` y el layout raíz se ajustan; el sidebar y los gates consumen `role`.

### D4. Sidebar role-aware con dos configuraciones

`sidebar-content.tsx` define dos configuraciones de navegación — staff (Feed, Niños, Avisos, Mi cuenta + CTA "Nueva publicación" + branding "Sala Soles") y familia (Feed, Resumen del día, Mi cuenta + sin CTA + branding "Familia") — y las elige según `user.role`. `MobileNav` reutiliza el mismo contenido sin cambios.

### D5. Redirect por rol centralizado

Helper server `lib/auth/role-gate.ts` con `getRole()`, `homePathFor(role)` y `requirePanel(roles, fallback)`. Lo usan `/`, `/login` (server) y la activación. El login cliente (`components/auth/login.tsx`) sigue haciendo `router.push("/")`; `/` resuelve el rol y redirige.

### D6. Placeholders como rutas reales

`/staff/avisos`, `/staff/mi-cuenta`, `/familia/resumen-dia`, `/familia/mi-cuenta`, `/posts/[id]` y `/posts/[id]/foto` son páginas mínimas (shell del panel + aviso "En construcción"), para que la navegación nunca apunte a un enlace muerto. Su contenido real queda para specs posteriores.

### D7. RLS con función helper `is_staff()` y matriz de políticas

Se crea en la migración una función SQL `public.is_staff()` que comprueba `exists (select 1 from users where id = auth.uid() and role in ('admin','staff'))`, evitando repetir el subquery. Matriz de políticas:

| Tabla | Operación | Política |
|---|---|---|
| `children` | SELECT | `is_staff()` OR `exists (select 1 from parent_children where child_id = children.id and parent_id = auth.uid())` |
| `parent_children` | SELECT | `is_staff()` OR `parent_id = auth.uid()` |
| `invitations` | SELECT | `is_staff()` (solo staff) |
| `users` | SELECT | `auth.uid() = id` OR `is_staff()` (mantener update own) |
| `daycares` | SELECT | `exists (select 1 from users where id = auth.uid() and daycare_id = daycares.id)` |
| `rooms` | SELECT | `exists (select 1 from users where id = auth.uid() and daycare_id = rooms.daycare_id)` |

Las políticas de escritura existentes (staff) se conservan tal cual. Las RPC de activación (`validate_invitation`, `accept_invitation`) son `SECURITY DEFINER` y no se ven afectadas por RLS.

## Risks / Trade-offs

- [Rutas staff existentes se rompen] → Actualizar todos los enlaces internos y `revalidatePath`/`redirect` en una pasada de barrido (proxy, sidebar, composer-trigger, kid-profile, server actions) y verificar con `npm run build`.
- [Gate en layout agrega una query por render de panel] → Query de una fila (`select role`) cacheable; costo despreciable frente a la claridad de un único punto de autorización por panel.
- [RLS más estricta rompe flujos staff existentes] → `fetchLinkedParents` lee `users`, `parent_children` e `invitations`; las nuevas políticas staff cubren las tres. Verificar manualmente el perfil de niño tras aplicar la migración.
- [Política de `users` para staff expone datos personales a todo el staff] → Aceptado: es un requisito funcional del perfil del niño (listar padres); el alcance se limita al staff autenticado.
- [Las tablas de posts aún no existen; su RLS llegará con spec 12] → Fuera de alcance, documentado en el proposal.

## Migration Plan

1. Aplicar la migración local (`supabase migration up`) con el stack local levantado (`supabase start`).
2. Empujar a remoto con `supabase db push` tras confirmación del usuario.
3. Verificar con consultas SQL: un parent ve solo sus hijos; el staff ve todo; `invitations` vacío para parents; `daycares`/`rooms` acotados.
4. Rollback: revertir la migración con `supabase migration repair`/rebase de rama de desarrollo si hiciera falta antes de llegar a remoto; tras push, una migración inversa nueva.

## Open Questions

Ninguna bloqueante. El subtítulo "Mamá de X" del user card de familia y el contenido real de detalle/foto quedan fuera de alcance y se resolverán en specs posteriores.
