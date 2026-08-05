# SPEC 01 — Feed de la guardería como home `/`

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-08-05
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

- [ ] `npm run dev` muestra `/` sin errores en consola.
- [ ] El fondo del body es `#F6ECDF` y el texto base `#3F362E` (sin modo oscuro).
- [ ] Los titulares ("Buenas, Caro", "OpenDayCare", nombres de niño) usan Fredoka; el cuerpo usa Nunito.
- [ ] Existe `components/ui/` con `avatar`, `button`, `card`, `section-label` reutilizables.
- [ ] Existe `components/layout/` con `app-shell`, `page-header` y `sidebar/` (sidebar, sidebar-content, mobile-nav).
- [ ] Existe `components/feed/` con `post-card`, `post-badge`, `photo-placeholder`, `post-actions`, `composer-trigger`.
- [ ] El mock data vive en `lib/mock/feed.ts` (tipos + `badgeConfig` + `currentUser` + `classroom` + `feedPosts`).
- [ ] El sidebar desktop (248px, sticky) coincide con el mockup: logo + "Sala Soles", botón naranja "Nueva publicación", nav con "Feed" activo (`#FBE3D8`/`#D9583C`), tarjeta "Caro Giménez · Maestra · Soles".
- [ ] El feed muestra exactamente 3 tarjetas en el orden del mockup: logro de Mateo, actividad de Mateo (con placeholder de foto), anuncio general.
- [ ] Cada tarjeta muestra avatar/ícono, nombre, hora, badge de tipo con sus colores, destinatario, texto, contadores de likes/comentarios y enlace "Editar".
- [ ] Todos los enlaces (Nueva publicación, nav, Editar, likes, comentarios, logout) apuntan a `#` y no producen 404.
- [ ] En viewport < `md` (768px) el sidebar se oculta y aparece el botón hamburguesa; al pulsarlo se abre un drawer con el mismo contenido del sidebar.
- [ ] El drawer se cierra al pulsar el overlay o un enlace.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa (typecheck).
- [ ] La comparación visual con `references/screenshots/feed.png` en desktop no muestra diferencias significativas de layout, color ni tipografía.

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
