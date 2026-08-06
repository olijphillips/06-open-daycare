# SPEC 02 — Pantallas Niños `/kids` y Perfil de niño `/kids/[slug]`

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-08-06
> **Objective:** Habilitar las pantallas `/kids` (listado de niños) y `/kids/[slug]` (perfil de niño) replicando los mockups `ninos.dc.html` y `perfil-nino.dc.html` con mock data en `lib/mock/children.ts`, navegación funcional entre ellas y reutilización del shell/sidebar de SPEC 01 refactorizando `SidebarContent` con una prop `activeItem`.

## Scope

**In:**

- Ruta `/kids` que reproduce `ninos.dc.html`: header "GESTIÓN / Niños" + CTA "Agregar niño"→`#`, buscador "Buscar niño…" (solo visual), separador "SALA SOLES · 8 niños", grid responsive de 8 tarjetas, cada una con avatar coloreado + inicial, nombre (Fredoka), "X años · N padres vinculados", y un tag (MANÍ/LACTOSA/VINCULAR) o un chevron si no tiene tag; cada tarjeta enlaza a `/kids/[slug]`.
- Ruta `/kids/[slug]` que reproduce `perfil-nino.dc.html`: enlace "Volver a Niños"→`/kids`, cabecera (avatar 84px + nombre + "3 años · Sala Soles" + "Editar"→`#`), caja de alergias/notas, tarjeta de datos (Fecha de nacimiento / Sala / Ingreso), columna derecha con botón "Resumen del día"→`#` y tarjeta "PADRES VINCULADOS" (lista de padres con estado ACTIVA/PENDIENTE + "Vincular otro padre"→`#`).
- Mock data en `lib/mock/children.ts`: tipos (`Child`, `Parent`, `ChildTag`) y array `children` con 8 niños (datos de lista + perfil extendido).
- Refactor de `SidebarContent` (`components/layout/sidebar/sidebar-content.tsx`): prop `activeItem?: NavLabel = "Feed"` que marca el ítem activo; `href` del nav actualizados: Feed→`/`, Niños→`/kids`, Avisos→`#`, Mi cuenta→`#`.
- Forwarding de `activeItem` en `Sidebar` (`sidebar.tsx`) y `MobileNav` (`mobile-nav.tsx`).
- Componentes feature en `components/kids/`: `kid-card.tsx` y `kid-profile.tsx` (+ auxiliares si conviene).
- `generateStaticParams` + `notFound()` en `/kids/[slug]`.

**Out of scope (for future specs):**

- Base de datos y persistencia (mock en memoria).
- Autenticación / login.
- Pantallas Agregar niño, Editar, Resumen del día, Vincular otro padre, Avisos, Mi cuenta, Crear publicación (van a `#`).
- Variante Familia del Sidebar (props `variant`) — se introduce con familia-feed.
- Route groups `(maestra)`/`(familia)`.
- Funcionalidad real del buscador (filtrado) y de Editar/Agregar/Vincular/Resumen.
- Diseño mobile dedicado (bottom-nav, FAB) más allá del drawer existente.
- Modo oscuro.

## Data model

```ts
// lib/mock/children.ts
export type ParentStatus = "active" | "pending";
export type ParentRole = "Mamá" | "Papá";

export interface Parent {
  name: string; // "Lucía Fernández"
  role: ParentRole; // "Mamá"
  status: ParentStatus; // "active"
  initial: string; // "L"
  avatarBg: string; // "#C9B6E8"
}

// Tag de alergia/vinculación en la tarjeta de lista.
// Ausente → la tarjeta muestra un chevron ">" en su lugar.
export interface ChildTag {
  label: string; // "MANÍ" | "LACTOSA" | "VINCULAR"
  bg: string; // "#FBD8CC"
  text: string; // "#D9684A"
}

export interface Child {
  slug: string; // "mateo-fernandez" — kebab del nombre completo
  name: string; // "Mateo Fernández"
  age: number; // 3
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  initial: string; // "M"
  parentsCount: number; // 2
  tag?: ChildTag; // ausente → chevron
  birthDate: string; // "12 mar 2022"
  classroom: string; // "Soles"
  enrollmentDate: string; // "feb 2025"
  allergyNotes?: string; // "Alergia al maní. Evitar frutos secos..."
  parents: Parent[]; // []
}

export const children: Child[] = [
  // 8 niños del mockup: Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia
];
```

Convenciones (mismas que SPEC 01): `slug` en español reflejando contenido (`mateo-fernandez`); identificadores internos (tipos, variables, claves) en inglés; colores como strings hex con `bg-[...]`/`text-[...]`.

## Implementation plan

1. **Mock data en `lib/mock/children.ts`.** Crear tipos y array `children` con los 8 niños del mockup (colores de avatar, edades, `parentsCount`, tags donde aplique). Para Mateo, completar `allergyNotes` y `parents` (Lucía ACTIVA, Diego PENDIENTE) según `perfil-nino.dc.html`. El resto con `birthDate`/`enrollmentDate`/`parents` coherentes con su `parentsCount`. _Test:_ importa sin errores de tipos.
2. **Refactor del sidebar.** En `sidebar-content.tsx`: tipar `NavLabel`, añadir prop `activeItem?: NavLabel = "Feed"`, marcar activo el item igual a `activeItem`, actualizar `href` (Feed→`/`, Niños→`/kids`, Avisos/Mi cuenta→`#`). En `sidebar.tsx` y `mobile-nav.tsx`: añadir prop `activeItem?` y reenviarla a `SidebarContent`. _Test:_ la home `/` sigue mostrando "Feed" activo sin cambios.
3. **`KidCard` en `components/kids/kid-card.tsx`.** Tarjeta `<a href="/kids/{slug}">` con `Card` + `Avatar` (48px) + nombre (Fredoka) + meta "X años · N padres vinculados / sin padres vinculados" + (tag pill si `child.tag`, si no chevron ">"). Hover: borde `#F2A78E` + `translateY(-2px)`. _Test:_ render aislado con y sin tag.
4. **Página `/kids` en `app/kids/page.tsx`.** `AppShell` con `<Sidebar activeItem="Niños" />` + `<MobileNav activeItem="Niños" />`. Main: header (eyebrow "GESTIÓN", título "Niños", `PrimaryButton` "Agregar niño"→`#`), buscador "Buscar niño…" (input no controlado, solo visual), separador "SALA SOLES · {n} niños", grid `grid-cols-1 sm:grid-cols-2 gap-[14px]` mapeando `children`→`KidCard`. _Test:_ `/kids` se ve como `ninos.dc.html`.
5. **Perfil en `components/kids/kid-profile.tsx`** (+ `parent-list.tsx` si conviene). Recibe `child` y renderiza: "Volver a Niños"→`/kids`, 2 columnas. Izquierda: avatar 84px + nombre (Fredoka 28px) + "X años · Sala {classroom}" + "Editar"→`#`, caja alergias (#FBDAD6, solo si `allergyNotes`), tarjeta datos (birthDate/classroom/enrollmentDate). Derecha (300px): botón dark "Resumen del día"→`#`, tarjeta "PADRES VINCULADOS" con `parents.map(...)` (avatar + nombre + rol · estado + pill ACTIVA/PENDIENTE) + "Vincular otro padre"→`#`. _Test:_ render aislado con Mateo.
6. **Página `/kids/[slug]` en `app/kids/[slug]/page.tsx`.** Server component con `generateStaticParams()`→`children.map(c => ({ slug: c.slug }))`, `getChildBySlug(slug)`, `notFound()` si no existe. `AppShell` con `activeItem="Niños"` + `<KidProfile child={child} />`. _Test:_ `/kids/mateo-fernandez` renderiza el perfil; slug inexistente→404.
7. **Verificación.** `npm run lint` y `npm run build` (typecheck) sin errores; comparación visual de `/kids` contra `references/screenshots/ninos.png` y de `/kids/mateo-fernandez` contra `references/pantallas/perfil-nino.dc.html` en desktop; navegación tarjeta→perfil→"Volver"→listado, sidebar "Niños"→`/kids`, "Feed"→`/`; drawer mobile con "Niños" activo.

## Acceptance criteria

- [ ] `npm run dev` muestra `/kids` y `/kids/[slug]` sin errores en consola.
- [ ] Existe `lib/mock/children.ts` con tipos (`Child`, `Parent`, `ChildTag`) y array `children` de 8 niños.
- [ ] `/kids` reproduce `ninos.dc.html`: header "GESTIÓN / Niños", CTA "Agregar niño", buscador "Buscar niño…", separador "SALA SOLES · 8 niños", grid de 8 tarjetas.
- [ ] Cada tarjeta muestra avatar (inicial + color), nombre en Fredoka, "X años · N padres vinculados" (o "sin padres vinculados"), y un tag (MANÍ/LACTOSA/VINCULAR) o un chevron si no tiene tag.
- [ ] Cada tarjeta enlaza a `/kids/{slug}` y al pulsarla se navega al perfil correcto.
- [ ] El grid es `grid-cols-1` en mobile (< sm) y `grid-cols-2` en ≥ sm.
- [ ] `/kids/[slug]` reproduce `perfil-nino.dc.html` para Mateo: avatar 84px, nombre, "3 años · Sala Soles", "Editar", caja de alergias, tarjeta de datos, botón "Resumen del día", "PADRES VINCULADOS" (Lucía ACTIVA, Diego PENDIENTE), "Vincular otro padre".
- [ ] "Volver a Niños" navega a `/kids`.
- [ ] Los enlaces fuera de scope (Agregar niño, Editar, Resumen del día, Vincular otro padre, Avisos, Mi cuenta) apuntan a `#` y no producen 404.
- [ ] El sidebar muestra "Niños" activo (`#FBE3D8`/`#D9583C`) en `/kids` y `/kids/[slug]`, y "Feed" activo en `/`.
- [ ] Los enlaces del sidebar navegan: "Feed"→`/`, "Niños"→`/kids`.
- [ ] Un slug inexistente (`/kids/no-existe`) devuelve 404 vía `notFound()`.
- [ ] El drawer mobile funciona en `/kids` y `/kids/[slug]` (abre/cierra, "Niños" activo).
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa (typecheck) con las rutas `/`, `/kids`, `/kids/[slug]` prerenderizadas.
- [ ] La comparación visual con `references/screenshots/ninos.png` (listado) y `references/pantallas/perfil-nino.dc.html` (perfil) en desktop no muestra diferencias significativas.

## Decisions

- **Sí:** Refactor de `SidebarContent` con `activeItem` (default "Feed") + hrefs reales (Feed→`/`, Niños→`/kids`). Cumple "que los enlaces funcionen", deja el sidebar reutilizable y la home no se rompe (default "Feed", sin cambios en `app/page.tsx`).
- **No:** Duplicar el sidebar para /kids — violación DRY.
- **Sí:** Mock data en `lib/mock/children.ts` separado — fácil de reemplazar cuando haya DB (mismo patrón que `feed.ts`).
- **No:** Mezclar los niños en `feed.ts` — mezcla dominios.
- **Sí:** Slug = nombre completo kebab (`mateo-fernandez`). Coincide con la convención de SPEC 01 (slugs en español, legibles en la URL).
- **No:** Ids numéricos — menos legibles, rompen convención.
- **Sí:** Buscador solo visual (input no controlado). Mantiene el scope ajustado y `/kids` como server component.
- **No:** Filtro client-side ahora — amplía el scope y fuerza `'use client'`.
- **Sí:** Enlaces a pantallas fuera de scope a `#`. Consistente con SPEC 01; esas pantallas se harán en specs propias.
- **No:** Rutas stub — amplía el scope.
- **Sí:** Grid `grid-cols-1 sm:grid-cols-2`. Tarjetas cómodas en mobile, fiel al mockup en desktop.
- **No:** `grid-cols-2` fijo — tarjetas estrechas en mobile.
- **Sí:** `generateStaticParams` + `notFound()`. Prerenderiza los perfiles y maneja slugs inválidos.
- **Sí:** Reutilizar `AppShell`, `Sidebar`, `MobileNav`, `Avatar`, `Card`, `PrimaryButton` de SPEC 01. Evita duplicar.
- **No:** Recrear el shell — duplicación.
- **Sí:** Feature components en `components/kids/`. Sigue la estructura `components/<feature>/` de SPEC 01.
- **No:** Colocarlos en `app/kids/` — mezcla rutas y componentes.
- **Sí:** Estado `Status: Borrador` (luego `Aprobado`) en español, consistente con SPEC 01 ("Implementado").

## Risks

| Riesgo                                                           | Mitigación                                                                                                                           |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| El refactor del sidebar toca código de SPEC 01 ya implementado   | `activeItem` es opcional con default "Feed"; la home no pasa el prop y sigue funcionando. Verificar `/` tras el cambio.              |
| `generateStaticParams` requiere Next.js 16 — la API pudo cambiar | Verificar usage en `node_modules/next/dist/docs/` antes del paso 6.                                                                  |
| Los 8 niños necesitan datos de perfil coherentes (no solo Mateo) | Completar `birthDate`/`enrollmentDate`/`parents` para todos, coherentes con `parentsCount` de la lista.                              |
| No hay screenshot de `perfil-nino`                               | Comparar el perfil contra el mockup `references/pantallas/perfil-nino.dc.html` directamente (sí existe `ninos.png` para el listado). |
| Tag vs chevron es condicional en la tarjeta                      | Modelar como `tag?: ChildTag`; ausente → chevron. Cubre los 4 casos del mockup.                                                      |

## What is not in this spec

- Base de datos ni persistencia.
- Autenticación / login.
- Pantallas Agregar niño, Editar, Resumen del día, Vincular otro padre, Avisos, Mi cuenta, Crear publicación.
- Variante Familia del Sidebar (props `variant`).
- Route groups `(maestra)`/`(familia)`.
- Funcionalidad real del buscador y de Editar/Agregar/Vincular/Resumen.
- Diseño mobile dedicado (bottom-nav, FAB) más allá del drawer.
- Modo oscuro.
