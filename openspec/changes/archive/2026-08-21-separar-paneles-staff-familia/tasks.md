## 1. Fundación — rol crudo y helpers

- [x] 1.1 Refactor de `SessionUser` en `lib/auth/profile.ts`: exponer `role: UserRole` (crudo) y `roleLabel` (etiqueta visible), ajustar `buildProfile` y el layout raíz; verificar con `npm run build`
- [x] 1.2 Crear `lib/auth/role-gate.ts` (server) con `getRole()`, `homePathFor(role)` y `requirePanel(roles, fallback)`; verificar que compila con `npm run build`

## 2. Estructura de rutas y shells

- [x] 2.1 Mover el panel staff a `app/staff/`: `page.tsx` (feed), `kids/page.tsx`, `kids/[id]/page.tsx`, `crear-publicacion/page.tsx`, con `app/staff/layout.tsx` que aplica `requirePanel(["staff","admin"], "/familia")` y monta el `AppShell` con sidebar; verificar que `/staff` muestra el feed y que un parent es redirigido
- [x] 2.2 Reemplazar `app/page.tsx` por un server component que redirige por rol (`homePathFor`); sin sesión el proxy manda a `/login`; verificar que `/` redirige a `/staff` para staff/admin y a `/familia` para parent
- [x] 2.3 Crear el panel familia: `app/familia/layout.tsx` con `requirePanel(["parent"], "/staff")` + `AppShell` con sidebar de familia, y `app/familia/page.tsx` con el header "TU FAMILIA / Hola, <nombre>" y lista de posts mock reutilizando `PostCard`; verificar que `/familia` renderiza y que un staff es redirigido
- [x] 2.4 Crear páginas placeholder "En construcción" dentro del shell de cada panel: `/staff/avisos`, `/staff/mi-cuenta`, `/familia/resumen-dia`, `/familia/mi-cuenta`; verificar que cada ítem del sidebar navega a una URL real sin error
- [x] 2.5 Crear rutas compartidas placeholder `/posts/[id]/page.tsx` y `/posts/[id]/foto/page.tsx` con el shell del panel según el rol; verificar que staff y parent pueden abrirlas y que el acceso cruzado sigue redirigiendo
- [x] 2.6 Hacer el sidebar role-aware en `components/layout/sidebar/sidebar-content.tsx`: dos configuraciones (staff: Feed/Niños/Avisos/Mi cuenta + CTA + "Sala Soles"; familia: Feed/Resumen del día/Mi cuenta + sin CTA + "Familia") elegidas por `user.role`, y ajustar la detección de ítem activo por prefijo de ruta; verificar que `MobileNav` usa el mismo contenido

## 3. Barrido de paths internos

- [x] 3.1 Actualizar `proxy.ts`: lista protegida con `/`, `/staff*`, `/familia*`, `/posts*`; solo controla sesión; verificar que sin sesión las rutas de ambos paneles van a `/login`
- [x] 3.2 Actualizar enlaces y revalidaciones: `composer-trigger.tsx` y sidebar (`/staff/crear-publicacion`), `kid-profile.tsx` (volver a `/staff/kids`), `lib/actions/children.ts`, `lib/actions/invitations.ts` y `lib/actions/activation.ts` (`revalidatePath`/`redirect` a `/staff*`); verificar que publicar y crear/vincular niño revalidan las rutas nuevas
- [x] 3.3 Ajustar `app/login/page.tsx` para redirigir por rol cuando ya hay sesión; verificar que un usuario logueado no vuelve a ver el login

## 4. RLS y migración

- [x] 4.1 Ejecutar `@db-security-auditor` para confirmar el inventario de fugas (children, parent_children, invitations, rooms, daycares con `using (true)`) antes de tocar políticas
- [x] 4.2 Cargar la skill `supabase-postgres-best-practices` y crear la migración en `supabase/migrations/` con la función `is_staff()` y la matriz de políticas de D7 del design (children/parent_children/invitations/users/daycares/rooms); revisar con `db-migrator`
- [x] 4.3 Aplicar la migración y sus correcciones (recursión RLS). Nota: Docker no está disponible, así que se aplicó directo a remoto vía MCP (`separate_panels_rls` + `fix_rls_recursion`), con archivos locales renombrados para que coincidan con las versiones remotas; cuando vuelva Docker, `supabase db push` no re-aplicará nada
- [x] 4.4 Verificar RLS con consultas SQL: un parent ve solo sus hijos y sus vínculos, no ve `invitations`, solo su fila en `users`, y daycares/rooms acotados a su daycare; el staff ve el perfil de un niño con sus padres vinculados sin error

## 5. Verificación final

- [x] 5.1 Pasar `npm run lint` y `npm run build` sin errores; resolver cualquier warning de tipos
- [x] 5.2 Prueba manual end-to-end: login staff → `/staff`; login parent → `/familia`; acceso cruzado redirige; detalle de post accesible desde ambos paneles; feed de familia muestra "TU FAMILIA" con posts mock; navegación placeholder sin enlaces muertos
