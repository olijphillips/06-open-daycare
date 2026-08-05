# SPEC 01 — Feed de la guardería como home `/`

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-08-05
> **Implemented:** 2026-08-05
> **Objective:** Replicar el mockup `references/pantallas/feed.dc.html` como página home `/` con estilado pixel-perfect, sin autenticación ni base de datos, usando mock data y una estructura de componentes preparada para reutilización.

## Scope

**In:**

- Página `/` que reproduce fielmente `feed.dc.html`: sidebar izquierdo + feed central con 3 publicaciones (logro, actividad con foto, anuncio).
- Estructura de componentes en `components/ui/` (primitivas transversales), `components/layout/` (shell, header, sidebar) y `components/feed/` (feature publicaciones), preparada para reutilizar `PostCard` y `Sidebar` en futuras specs (familia-feed, detalle-publicacion).
- Intercambio de fuentes: Fredoka (titulares) + Nunito (cuerpo) vía `next/font/google`.
- Sistema de tokens en `app/globals.css` con `@theme inline` (paleta crema/marrón + tipografías).
- Mock data en `lib/mock/feed.ts` con tipos, `badgeConfig`, usuario (Caro), classroom (Soles) y los 3 posts.
- Componentes: `Avatar`, `Button`, `Card`, `SectionLabel` (ui); `AppShell`, `PageHeader`, `Sidebar`+`SidebarContent`+`MobileNav` (layout); `PostCard`, `PostBadge`, `PhotoPlaceholder`, `PostActions`, `ComposerTrigger` (feed).
- Sidebar hardcodeado a variante Maestra (la de `/`).
- Navegación mobile responsive: en viewport < `md` el sidebar se oculta y aparece un botón hamburguesa que abre un drawer con el mismo contenido del sidebar.
- Todos los enlaces apuntan a `#` (sin navegación real).

**Out of scope (for future specs):**

- Autenticación / login.
- Base de datos y persistencia.
- Páginas Niños, Avisos, Mi cuenta, Crear publicación, detalle de publicación, foto, familia-feed.
- Variante Familia del Sidebar (refactorizar a props `variant` cuando llegue familia-feed).
- Route groups `(maestra)`/`(familia)` (se introducen cuando exista una segunda ruta).
- Funcionalidad real de likes, comentarios, editar y crear publicación.
- Diseño mobile dedicado (bottom-nav, FAB) más allá del drawer.
- Modo oscuro.

## Data model

```ts
// lib/mock/feed.ts
export type PostType = "achievement" | "activity" | "announcement";

export interface FeedPost {
  id: string;
  type: PostType;
  authorName: string; // "Mateo" | "Anuncio general"
  authorInitial?: string; // "M" — ausente para "announcement" (usa ícono megáfono)
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
  time: string; // "14:20"
  publishedBy: string; // "publicado por vos"
  audience: string; // "Para: familia de Mateo" | "Para: toda la sala"
  text: string;
  likes: number;
  comments: number;
  photo?: { caption: string }; // presente solo en el post de tipo "activity"
}

export const badgeConfig: Record<
  PostType,
  { bg: string; dot: string; text: string; label: string }
> = {
  achievement: {
    bg: "#CFEBD8",
    dot: "#3E9B6C",
    text: "#3E9B6C",
    label: "LOGRO",
  },
  activity: {
    bg: "#C7E7F1",
    dot: "#2E89A6",
    text: "#2E89A6",
    label: "ACTIVIDAD",
  },
  announcement: {
    bg: "#CCD8F4",
    dot: "#4E72C8",
    text: "#4E72C8",
    label: "ANUNCIO",
  },
};

export const currentUser = {
  name: "Caro Giménez",
  role: "Maestra · Soles",
  initial: "C",
  avatarBg: "#F2937A",
};

export const classroom = { name: "Soles", childrenCount: 12 };

export const feedPosts: FeedPost[] = [
  // 1) achievement — logro de Mateo, orinal ("¡Usó el orinal solito por primera vez!...")
  // 2) activity — actividad de Mateo, témperas (con photo.caption "Foto · pintando con témperas")
  // 3) announcement — anuncio general, salida al parque ("El viernes salimos al parque...")
];
```

Convenciones:

- Los colores de avatar y badge se guardan como strings hex y se renderizan con valores arbitrarios de Tailwind (`bg-[...]` / `text-[...]`).
- `id` es un slug estable en español que refleja el contenido del post (`"mateo-logro-orinal"`, etc.), no un número autogenerado. Los identificadores internos (tipos, variables, claves) van en inglés; los slugs se mantienen en español por reflejar contenido.

## Implementation plan

1. **Fuentes y metadata en `app/layout.tsx`.** Reemplazar `Geist`/`Geist_Mono` por `Fredoka` (pesos 400–700) y `Nunito` (pesos 400–800, estilos normal + italic), expuestas como variables CSS `--font-fredoka` y `--font-nunito`. `<html lang="es">`, `metadata` con title "OpenDayCare". _Test:_ `npm run dev` arranca y el body usa Nunito.
2. **Tokens y base en `app/globals.css`.** Reemplazar el bloque `:root`/`@media dark` por `@theme inline` con la paleta (`--color-cream #F6ECDF`, `--color-surface #FFFDF9`, `--color-ink #3F362E`, `--color-muted #94887B`, `--color-border-warm #ECE0D0`, `--color-primary #EE8164`, `--color-primary-soft #FBE3D8`, `--color-accent #D9583C`, `--color-like #E0654A`, `--font-display`, `--font-sans`). Body: fondo `#F6ECDF`, color `#3F362E`, `font-family` Nunito, scrollbar custom (`#E4D6C4`). Eliminar modo oscuro. _Test:_ la home queda con fondo crema.
3. **Mock data en `lib/mock/feed.ts`.** Crear tipos, `badgeConfig`, `currentUser`, `classroom` y `feedPosts` con los 3 posts del mockup (textos, horas y contadores exactos). _Test:_ importa sin errores de tipos.
4. **Primitivas UI en `components/ui/`.** Crear `avatar.tsx` (iniciales o ícono, props `size`/`bg`/`color`), `button.tsx` (`PrimaryButton` con gradient naranja `#F4977E→#EE8164` + sombra), `card.tsx` (contenedor `#FFFDF9` + borde `#ECE0D0` + sombra), `section-label.tsx` (eyebrow uppercase 12.5px bold). _Test:_ compilan sin usarse aún.
5. **Layout base en `components/layout/`.** Crear `page-header.tsx` (props `eyebrow`, `title`, `subtitle`) y `app-shell.tsx` (wrapper `flex` que recibe `sidebar` y `children`). _Test:_ compilan.
6. **Sidebar en `components/layout/sidebar/`.** Crear `sidebar-content.tsx` (logo OpenDayCare + "Sala Soles", `PrimaryButton` "Nueva publicación"→`#`, nav Feed activo / Niños / Avisos / Mi cuenta→`#`, `Avatar` + user card + logout→`#`, SVGs inline del mockup), `sidebar.tsx` (`<aside>` sticky 248px, `hidden md:flex`) y `mobile-nav.tsx` (`'use client'`: botón hamburguesa `md:hidden` + overlay + drawer que renderiza `<SidebarContent />`, toggle con `useState`, cierre al clickar overlay/enlace). _Test:_ render aislado correcto.
7. **Feature feed en `components/feed/`.** Crear `post-badge.tsx` (pill con dot + label según `badgeConfig`), `photo-placeholder.tsx` (caja dashed + ícono cámara + caption), `post-actions.tsx` (corazón + count + comentario + count + "Editar"→`#`), `post-card.tsx` (compone avatar/ícono, nombre, hora, `PostBadge`, destinatario, texto, `PhotoPlaceholder` opcional, `PostActions`) y `composer-trigger.tsx` (tarjeta "Compartí un momento…"→`#` con avatar + ícono cámara). _Test:_ `PostCard` renderiza un post mock.
8. **Componer `app/page.tsx`.** Usar `AppShell` con `Sidebar`/`MobileNav` + `<main>` con `PageHeader` ("GUARDERÍA · SALA SOLES" / "Buenas, Caro" / "12 niños · martes 17 jun"), `ComposerTrigger`, separador "PUBLICADO HOY" y `feedPosts.map(PostCard)`. Borrar el boilerplate de create-next-app. _Test:_ `/` se ve como el mockup.
9. **Verificación.** `npm run lint` y `npm run build` (typecheck) sin errores; comparación visual contra `references/screenshots/feed.png` en desktop; el drawer abre/cierra en viewport < 768px.

## Acceptance criteria

- [x] `npm run dev` muestra `/` sin errores en consola.
- [x] El fondo del body es `#F6ECDF` y el texto base `#3F362E` (sin modo oscuro).
- [x] Los titulares ("Buenas, Caro", "OpenDayCare", nombres de niño) usan Fredoka; el cuerpo usa Nunito.
- [x] Existe `components/ui/` con `avatar`, `button`, `card`, `section-label` reutilizables.
- [x] Existe `components/layout/` con `app-shell`, `page-header` y `sidebar/` (sidebar, sidebar-content, mobile-nav).
- [x] Existe `components/feed/` con `post-card`, `post-badge`, `photo-placeholder`, `post-actions`, `composer-trigger`.
- [x] El mock data vive en `lib/mock/feed.ts` (tipos + `badgeConfig` + `currentUser` + `classroom` + `feedPosts`).
- [x] El sidebar desktop (248px, sticky) coincide con el mockup: logo + "Sala Soles", botón naranja "Nueva publicación", nav con "Feed" activo (`#FBE3D8`/`#D9583C`), tarjeta "Caro Giménez · Maestra · Soles".
- [x] El feed muestra exactamente 3 tarjetas en el orden del mockup: logro de Mateo, actividad de Mateo (con placeholder de foto), anuncio general.
- [x] Cada tarjeta muestra avatar/ícono, nombre, hora, badge de tipo con sus colores, destinatario, texto, contadores de likes/comentarios y enlace "Editar".
- [x] Todos los enlaces (Nueva publicación, nav, Editar, likes, comentarios, logout) apuntan a `#` y no producen 404.
- [x] En viewport < `md` (768px) el sidebar se oculta y aparece el botón hamburguesa; al pulsarlo se abre un drawer con el mismo contenido del sidebar.
- [x] El drawer se cierra al pulsar el overlay o un enlace.
- [x] `npm run lint` pasa sin errores.
- [x] `npm run build` pasa (typecheck).
- [x] La comparación visual con `references/screenshots/feed.png` en desktop no muestra diferencias significativas de layout, color ni tipografía.

## Decisions

- **Sí:** Árbol de componentes con `ui/` (primitivas) + `layout/` (shell/header/sidebar) + `feed/` (feature). Prepara reutilización: `PostCard` se reusará en familia-feed y detalle-publicacion; `Sidebar`/`Avatar`/`Button`/`Card` en casi todas las pantallas.
- **No:** Colocation dentro de `app/` o route groups `(maestra)`/`(familia)` ahora — se introducen cuando exista una segunda ruta.
- **Sí:** Sidebar hardcodeado a variante Maestra — esta spec no ejercita la variante Familia.
- **No:** Diseñar `Sidebar` con props `variant` desde ahora — refactorizar cuando llegue familia-feed (el informe ya documenta la variante, no se pierde conocimiento).
- **Sí:** Mock data en `lib/mock/feed.ts` separado del componente — fácil de reemplazar cuando haya DB.
- **No:** Datos hardcodeados en `page.tsx` — mezcla presentación y datos.
- **Sí:** Solo la ruta `/`; todos los enlaces a `#` — el alcance es visual.
- **No:** Páginas stub para Niños/Avisos/Mi cuenta/Crear publicación — amplía el scope.
- **Sí:** Tailwind v4 con tokens en `@theme inline` — sigue la convención del proyecto.
- **No:** Estilos inline 1:1 — menos idiomático y mantenible.
- **Sí:** Fredoka + Nunito vía `next/font/google` — necesario para coincidencia visual.
- **No:** Mantener Geist — el look no coincidiría.
- **Sí:** Drawer hamburguesa para mobile — reutiliza el contenido del sidebar sin inventar UI fuera de las referencias.
- **No:** Bottom-nav + FAB — requeriría rediseñar el CTA y no existe en las referencias.
- **Sí:** Quitar el modo oscuro del boilerplate — el mockup es solo tema claro crema.
- **Sí:** Nomenclatura en inglés para identificadores internos (tipos, variables, funciones, claves de objetos, props): `PostType = "achievement" | "activity" | "announcement"`, `classroom`, `badgeConfig`, `currentUser`. Sigue clean code y facilita el mantenimiento. Los comentarios van en español (regla AGENTS.md).
- **Sí:** Slugs de `id` y contenido visible en español — `id: "mateo-logro-orinal"`, `authorName: "Mateo"`, `label: "LOGRO"`, textos del nav y UI. Reflejan contenido real del mockup y se muestran al usuario; no son identificadores de código.

## Risks

| Riesgo                                                   | Mitigación                                                                                                                                           |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| La API de `next/font/google` puede cambiar en Next.js 16 | Verificar usage en `node_modules/next/dist/docs/` antes del paso 1; confirmar pesos de Fredoka (400–700) y Nunito (hasta 800) + estilo italic.       |
| El drawer mobile no tiene referencia visual              | Reutilizar exactamente el contenido y estilo del sidebar desktop; solo adaptar el contenedor (overlay + slide-in). No introducir componentes nuevos. |
| Matices no cubiertos por tokens (sombras, gradientes)    | Usar valores arbitrarios de Tailwind (`shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]`, `bg-[linear-gradient(180deg,#F4977E,#EE8164)]`).               |
| Granularidad alta (~17 archivos) para una spec visual    | Cada componente es pequeño y con responsabilidad única; el coste ahora evita refactor doloroso al llegar familia-feed.                               |
| Sin IC de UI                                             | Verificación visual manual contra `references/screenshots/feed.png`.                                                                                 |

## What is **not** in this spec

- Autenticación / login.
- Base de datos ni persistencia.
- Páginas Niños, Avisos, Mi cuenta, Crear publicación, detalle, foto, familia-feed.
- Variante Familia del Sidebar (props `variant`).
- Route groups `(maestra)`/`(familia)`.
- Funcionalidad real de likes, comentarios, editar, crear publicación.
- Diseño mobile dedicado (bottom-nav, FAB) más allá del drawer.
- Modo oscuro.

## Implementation log

> Bitácora de la implementación sobre la rama `spec-01-feed-home`. Los 9 pasos del plan se completaron en orden.

### Archivos creados / modificados

| Paso | Archivo                                         | Tipo                                                                                                                                                     |
| ---- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `app/layout.tsx`                                | modificado — Fredoka + Nunito vía `next/font/google`, `lang="es"`, title "OpenDayCare", CSS vars `--font-fredoka`/`--font-nunito`                        |
| 2    | `app/globals.css`                               | modificado — `@theme inline` con 9 tokens de color + 2 de fuente, body crema, scrollbar custom, modo oscuro eliminado                                    |
| 3    | `lib/mock/feed.ts`                              | creado — tipos (`PostType`, `FeedPost`), `badgeConfig`, `currentUser`, `classroom`, `feedPosts` (3 posts con textos/horas/contadores exactos del mockup) |
| 4    | `components/ui/avatar.tsx`                      | creado — `Avatar` (iniciales o ícono, props `size`/`bg`/`color`)                                                                                         |
| 4    | `components/ui/button.tsx`                      | creado — `PrimaryButton` (gradient `#F4977E→#EE8164` + sombra)                                                                                           |
| 4    | `components/ui/card.tsx`                        | creado — `Card` (surface + borde warm + sombra)                                                                                                          |
| 4    | `components/ui/section-label.tsx`               | creado — `SectionLabel` (eyebrow uppercase 12.5px/800/tracking 0.8px)                                                                                    |
| 5    | `components/layout/page-header.tsx`             | creado — `PageHeader` (props `eyebrow`/`title`/`subtitle`)                                                                                               |
| 5    | `components/layout/app-shell.tsx`               | creado — `AppShell` (wrapper flex, slot `sidebar` + `<main>` scrollable)                                                                                 |
| 6    | `components/layout/sidebar/sidebar-content.tsx` | creado — logo + CTA + nav + user card (SVGs inline)                                                                                                      |
| 6    | `components/layout/sidebar/sidebar.tsx`         | creado — `<aside>` sticky 248px `hidden md:flex`                                                                                                         |
| 6    | `components/layout/sidebar/mobile-nav.tsx`      | creado — `'use client'`, hamburger + overlay + drawer slide-in, cierre por overlay o link                                                                |
| 7    | `components/feed/post-badge.tsx`                | creado — pill con dot + label según `badgeConfig`                                                                                                        |
| 7    | `components/feed/photo-placeholder.tsx`         | creado — caja dashed + ícono + caption                                                                                                                   |
| 7    | `components/feed/post-actions.tsx`              | creado — likes + comentarios + "Editar"                                                                                                                  |
| 7    | `components/feed/post-card.tsx`                 | creado — compone avatar/badge/texto/foto/actions                                                                                                         |
| 7    | `components/feed/composer-trigger.tsx`          | creado — tarjeta "Compartí un momento…"                                                                                                                  |
| 8    | `app/page.tsx`                                  | modificado — composición final con `AppShell` + `PageHeader` + `ComposerTrigger` + separador + `feedPosts.map(PostCard)`; boilerplate eliminado          |
| —    | `eslint.config.mjs`                             | modificado — `references/**` agregado a `globalIgnores` (el dc-runtime no es parte de la app)                                                            |

### Hallazgos y decisiones durante la implementación

- **Fredoka es variable font** (wght 300–700, sin italic): se carga sin `weight` para usar el eje completo. Nunito es variable (wght 200–1000, con italic): se cargan pesos `400–800` + estilo `normal`/`italic`. Verificado en `node_modules/next/dist/.../font-data.json`.
- **Mockup como fuente de verdad**: el spec decía "solita" pero el mockup dice "solito" — se usó el mockup (textos visibles al usuario).
- **Tailwind v4 usa la propiedad `translate`** (no `transform`) para las utilidades `translate-x-*`. Relevante al inspeccionar el estado del drawer.
- **`eslint.config.mjs`**: `references/pantallas/support.js` (dc-runtime generado) disparaba errores de lint ajenos a la app. Se ignoró `references/**` en `globalIgnores` dado que, por AGENTS.md, no es parte de la app Next.js ni debe importarse/modificarse.
- **Likes como `<span>`** (no `<a>`) y comentarios + "Editar" como `<a href="#">`, igualando el mockup.
- Colores no tokenizados (sombras, gradientes, matices) se renderizan con valores arbitrarios de Tailwind (`bg-[#...]`, `shadow-[...]`, `bg-[linear-gradient(...)]`), según mitigación de riesgos.

### Verificación (Paso 9)

- `npm run lint` → exit 0 (sin errores ni warnings en código de la app).
- `npm run build` → exit 0 (compilación + typecheck OK, 1 ruta estática `/`).
- `npm run dev` → `Ready in 1680ms`, `GET / 200`, 0 errores en consola del navegador.
- Estructura desktop verificada vía snapshot de accesibilidad: sidebar (logo, CTA, nav 4 items, user card), header ("GUARDERÍA · SALA SOLES" / "Buenas, Caro" / "12 niños · martes 17 jun"), composer, separador "PUBLICADO HOY" y los 3 posts con textos, badges, foto y contadores exactos.
- Drawer mobile (390×844): abre al pulsar el hamburger (overlay opacity 1, pointer-events auto); cierra al pulsar un enlace del sidebar (overlay opacity 0, pointer-events none). El cierre por overlay está implementado (`onClick` en el div overlay) pero no se pudo disparar vía Playwright porque el drawer intercepta los clics en su zona; el path de cierre por enlace sí se verificó.
