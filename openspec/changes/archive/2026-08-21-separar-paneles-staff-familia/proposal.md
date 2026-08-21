## Why

La app hoy es solo el panel de staff: un único shell, un único sidebar y un feed sin distinción de rol. Los padres no tienen rutas propias ni una experiencia diferenciada (los diseños de referencia definen pantallas `familia-*` con su propio shell), y la RLS permite que cualquier usuario autenticado lea niños, invitaciones y vínculos de otros. Necesitamos separar estructuralmente el panel de staff del de la familia y garantizar que cada padre solo vea datos de sus propios hijos.

## What Changes

- Mover el panel de staff a `/staff`: feed, niños, perfil y crear publicación. **BREAKING**: `/`, `/kids`, `/kids/[id]`, `/crear-publicacion` dejan de existir como rutas staff.
- Crear el panel de familia en `/familia` con shell propio (sidebar "Familia", sin CTA de publicar, header "TU FAMILIA") y un feed inicial alimentado con los posts mock existentes.
- Páginas placeholder mínimas para los destinos de navegación sin pantalla real: `/staff/avisos`, `/staff/mi-cuenta`, `/familia/resumen-dia`, `/familia/mi-cuenta`.
- Rutas compartidas placeholder para ambas paneles: `/posts/[id]` (detalle de publicación) y `/posts/[id]/foto` (foto a pantalla completa).
- `/` y `/login` redirigen por rol: staff/admin → `/staff`, parent → `/familia`. El rol admin entra al panel de staff.
- `SessionUser` expone el rol crudo (`UserRole`) además de la etiqueta visible; el sidebar pasa a ser role-aware (configuración de navegación distinta por panel).
- Gates de acceso por rol en los layouts de panel: un parent no puede abrir rutas staff y viceversa.
- RLS estricta: acotar el `SELECT` de `children`, `parent_children`, `invitations`, `users`, `rooms` y `daycares` según el rol y el daycare del usuario. **BREAKING**: se eliminan las políticas `using (true)` que exponían datos entre tenants.

## Capabilities

### New Capabilities

- `panels`: separación estructural de la app en dos paneles por rol — rutas `/staff` y `/familia`, shells y sidebars role-aware, gates de acceso, redirect por rol y rutas compartidas.
- `database/data-isolation`: políticas RLS que limitan la lectura de datos según rol y daycare, de modo que un padre solo vea los datos de sus propios hijos.

### Modified Capabilities

_(ninguna — `openspec/specs/` aún no tiene capacidades existentes)_

## Impact

- **App**: `app/page.tsx` pasa a redirect por rol; se mueven `app/kids`, `app/kids/[id]`, `app/crear-publicacion` a `app/staff/`; se crean `app/staff/layout.tsx`, `app/familia/layout.tsx` y el feed de familia.
- **Componentes**: `components/layout/sidebar/sidebar-content.tsx` (nav role-aware), `components/feed/composer-trigger.tsx` y `components/kids/kid-profile.tsx` (rutas internas).
- **Librerías**: `lib/auth/profile.ts` (rol crudo en `SessionUser`), `lib/auth/role-gate.ts` (nuevo), `lib/mock/feed.ts` (reutilizado por el feed familia).
- **Server Actions**: `lib/actions/children.ts`, `lib/actions/invitations.ts`, `lib/actions/activation.ts` — `revalidatePath`/`redirect` a las rutas `/staff`.
- **Proxy**: `proxy.ts` — lista de rutas protegidas ampliada a `/staff*`, `/familia*`, `/posts*`; solo controla sesión (no rol).
- **Base de datos**: migración nueva en `supabase/migrations/` para las políticas RLS; se corren `@db-security-auditor` y `@db-migrator`.
- **Fuera de alcance** (specs posteriores): chips de hijos, resumen del día, contenido real de detalle/foto, subtítulo "Mamá de X", toggles de mi-cuenta, tablas `posts`/`daily_summaries` y su RLS.
