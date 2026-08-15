# SPEC 05 — Pantalla de crear publicación en `/crear-publicacion`

> **Status:** Aprobado
> **Depends on:** SPEC 01, SPEC 04
> **Date:** 2026-08-14
> **Objective:** Crear la pantalla `/crear-publicacion` replicando `references/pantallas/crear-publicacion.dc.html`, con selección de destinatarios (multiniño con toggle "Toda la sala"), tipo, descripción y fotos por drag & drop, que al publicar agrega el post en memoria al feed `/`.

## Scope

**In:**

- Ruta propia `/crear-publicacion`, como tarjeta centrada (max 580px) sin sidebar, fiel a la referencia.
- Header de la tarjeta: "Cancelar" (izq.) · "Nueva publicación" (centro) · "Publicar" (der.).
- Sección PARA con los 8 niños del mock de `lib/mock/children.ts` con `classroom === "Sol"` + botón "Toda la sala", con multiselección.
- Toggle "Toda la sala": al activarse desmarca los chips individuales y solo queda activo "Toda la sala"; si ya estaban todos seleccionados, desmarca todo.
- Sección TIPO con las 7 píldoras (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio) con los colores de la referencia; selección simple (ninguna por defecto).
- Sección DESCRIPCIÓN con textarea placeholder "Contá cómo le fue hoy…".
- Sección FOTOS con drag & drop de imágenes: las soltadas se pintan como miniaturas (solo preview, sin subir nada) con botón X para quitarlas; el recuadro "Agregar" queda visual sin acción.
- Validación de Publicar: requiere al menos un destinatario (niño o toda la sala) + descripción no vacía; el botón queda deshabilitado hasta cumplirse.
- Al publicar: agrega el post al feed en memoria y navega a `/`, donde aparece al inicio.
- Enlaces "Nueva publicación" del sidebar y del composer del feed apuntan a `/crear-publicacion`.
- Ampliar `PostType` y `badgeConfig` a los 7 tipos para que el feed renderice el badge correcto.
- Feed `/` pasa a componente cliente con store en memoria (`useSyncExternalStore`).

**Out of scope (for future specs):**

- Persistencia entre sesiones (API, localStorage, DB).
- Subida real de imágenes (solo preview en memoria).
- Edición de publicaciones ("Editar" sigue en `#`).
- Likes y comentarios funcionales.
- Página de detalle de publicación (`detalle-publicacion.dc.html`).
- Store compartido de niños entre `/kids` y `/crear-publicacion` (los agregados en `/kids` no aparecen).
- Variante familia, avisos, mi cuenta.

## Data model

Se extiende el modelo de `lib/mock/feed.ts` y se reutiliza `Child` de `lib/mock/children.ts`:

```ts
// PostType ampliado a los 7 tipos de la referencia (claves en inglés).
export type PostType =
  | "meal" // Comida
  | "nap" // Siesta
  | "activity" // Actividad
  | "achievement" // Logro
  | "mood" // Ánimo
  | "photo" // Foto
  | "announcement"; // Anuncio

// Píldoras del compositor (label visible + colores de la referencia).
export const composerTypeConfig: Record<
  PostType,
  { label: string; bg: string; text: string }
> = {
  meal: { label: "Comida", bg: "#9A7B1E", text: "#FFFFFF" },
  nap: { label: "Siesta", bg: "#E7DCF6", text: "#7B5FC0" },
  activity: { label: "Actividad", bg: "#2E89A6", text: "#FFFFFF" },
  achievement: { label: "Logro", bg: "#CFEBD8", text: "#3E9B6C" },
  mood: { label: "Ánimo", bg: "#F9D2DE", text: "#C56486" },
  photo: { label: "Foto", bg: "#FBD8CC", text: "#D9684A" },
  announcement: { label: "Anuncio", bg: "#CCD8F4", text: "#4E72C8" },
};

// Store en memoria del feed (módulo mutable + suscripción).
let posts: FeedPost[] = [
  /* los 3 posts del mock */
];
const listeners = new Set<() => void>();
export function getPosts(): FeedPost[] {
  return posts;
}
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
export function addPost(post: FeedPost): void {
  posts = [post, ...posts];
  listeners.forEach((l) => l());
}
```

Convenciones:

- Nuevo post generado: `id` = `<slug>-<typeKey>-<timestamp>` (`slugify(firstName)` si es un niño; `<typeKey>-sala-<timestamp>` si son varios o toda la sala).
- `authorName`: nombre del niño si es destinatario único; "Anuncio general" si son varios o "Toda la sala" (sin `authorInitial` → ícono megáfono).
- `audience`: `"Para: familia de <nombre>"` (1), `"Para: familias de <a>, <b> y <c>"` (varios), `"Para: toda la sala"`.
- `time`: hora actual `HH:MM`. `publishedBy`: `"publicado por vos"`. `likes`/`comments`: 0.
- Con fotos: `photo: { caption: "Foto · <descripción>" }` (el feed muestra el placeholder, no la imagen).
- `badgeConfig` gana 4 entradas: `meal` (`#9A7B1E`/texto blanco), `nap` (`#E7DCF6`/`#7B5FC0`), `mood` (`#F9D2DE`/`#C56486`), `photo` (`#FBD8CC`/`#D9684A`).

## Implementation plan

1. **Store y tipos en `lib/mock/feed.ts`.** Ampliar `PostType`, agregar `composerTypeConfig`, los 4 `badgeConfig` nuevos y el store `getPosts`/`subscribe`/`addPost`. _Test:_ `npm run build` sin errores de tipos.
2. **Esqueleto de `/crear-publicacion`.** `app/crear-publicacion/page.tsx` (`"use client"`) renderizando la tarjeta centrada con header (Cancelar / Nueva publicación / Publicar) y las 4 secciones, estilado fiel a la referencia. _Test:_ render aislado.
3. **Sección PARA.** Chips de los 8 niños (filtro `classroom === "Sol"`) + botón "Toda la sala". Estado `selectedSlugs: string[]` + `isAllSelected: boolean`. Estilo: chip activo oscuro (`#3F362E`/blanco), inactivo claro (`#FFFDF9`/`#6E6359`); "Toda la sala" activo oscuro. _Test:_ marcar/desmarcar varios.
4. **Toggle "Toda la sala".** Activar → desmarca chips y deja solo "Toda la sala" activo; si ya estaba activo → desmarca todo. Al marcar el último niño individualmente → auto-activa "Toda la sala" y desmarca los chips. Tocar un chip en modo "Toda la sala" → sale del modo y selecciona solo ese niño. _Test:_ casos del checklist.
5. **Sección TIPO.** 7 píldoras desde `composerTypeConfig`; selección simple; la activa se distingue con borde oscuro 2px sin alterar sus colores. _Test:_ seleccionar una desmarca la anterior.
6. **DESCRIPCIÓN + FOTOS.** Textarea controlado. Zona FOTOS como drop target: al soltar imágenes, `URL.createObjectURL` y miniaturas 96px con botón X (revocar URL al quitar). "Agregar" sin `onClick`. _Test:_ soltar archivos en el navegador.
7. **Publicar/Cancelar.** "Publicar" deshabilitado si falta destinatario o descripción; al publicar, construir el `FeedPost` con autor/destinatario/hora según reglas, `addPost(post)` y `router.push("/")`. "Cancelar" → `router.push("/")`. _Test:_ flujo completo.
8. **Feed en memoria.** `app/page.tsx` pasa a `"use client"` y usa `useSyncExternalStore(subscribe, getPosts)`; `ComposerTrigger` y `SidebarContent` apuntan "Nueva publicación" a `/crear-publicacion`. _Test:_ el post nuevo aparece arriba tras publicar.
9. **Verificación.** `npm run lint` y `npm run build`; comparación visual con `references/pantallas/crear-publicacion.dc.html` y comportamiento vía Playwright (capturas en `.playwright-mcp/`).

## Acceptance criteria

- [ ] Desde `/`, tanto "Nueva publicación" del sidebar como el composer navegan a `/crear-publicacion`.
- [ ] La pantalla muestra las 4 secciones (PARA, TIPO, DESCRIPCIÓN, FOTOS) y los botones Cancelar y Publicar, con el estilo de la referencia.
- [ ] PARA muestra los 8 niños del mock de la sala Sol y el botón "Toda la sala".
- [ ] Se pueden seleccionar varios niños a la vez (multiselección).
- [ ] Al activar "Toda la sala", los chips individuales quedan desmarcados y solo "Toda la sala" queda activo.
- [ ] Al seleccionar individualmente todos los niños, se desmarcan los chips y se activa "Toda la sala".
- [ ] Pulsar "Toda la sala" cuando ya está activo desmarca todos los destinatarios.
- [ ] TIPO ofrece los 7 tipos con los colores de la referencia; la selección es única y puede quedar vacía.
- [ ] "Publicar" está deshabilitado sin destinatario o con descripción vacía.
- [ ] Publicar con destinatario + descripción agrega el post al inicio del feed en memoria y navega a `/`.
- [ ] El post nuevo muestra autor, destinatario, badge, hora y contadores: autor = niño único o "Anuncio general" (varios / toda la sala).
- [ ] El destinatario del post es "Para: familia de X", "Para: familias de X, Y y Z" o "Para: toda la sala".
- [ ] El badge del post usa los colores del tipo elegido (los 7 tipos renderizan).
- [ ] Arrastrar imágenes a FOTOS las pinta como miniaturas con X para quitarlas; tocar "Agregar" no abre selector.
- [ ] El post publicado con fotos muestra el placeholder de foto con su caption.
- [ ] Cancelar vuelve al feed sin crear nada.
- [ ] Recargar la página pierde el post (memoria).
- [ ] `npm run lint` y `npm run build` pasan sin errores.

## Decisions

- **Sí:** Ruta propia `/crear-publicacion` sin `AppShell` — la referencia no incluye sidebar; pantalla centrada.
- **No:** Overlay/modal sobre el feed — el usuario eligió ruta propia.
- **Sí:** Multiselección de niños con toggle "Toda la sala" que desmarca los chips — comportamiento pedido por el usuario.
- **Sí:** Niños de `lib/mock/children.ts` (sala Sol). **No:** incluir los agregados en `/kids` (viven en estado local de esa página; un store compartido es otro spec).
- **Sí:** Un post por publicación. **No:** un post por niño.
- **Sí:** Autor = niño único, o "Anuncio general" para varios / toda la sala — consistente con el mock del feed.
- **Sí:** Validación destinatario + descripción con "Publicar" deshabilitado. **No:** errores inline al pulsar.
- **Sí:** Fotos solo drag & drop con X; "Agregar" visual sin acción. **No:** selector de archivos.
- **Sí:** Estado inicial vacío. **No:** precargado como el mock.
- **Sí:** Feed `/` como cliente con `useSyncExternalStore` sobre un store en memoria.
- **Sí:** `PostType` a 7 claves en inglés (`meal`, `nap`, `mood`, `photo`) + `badgeConfig` y `composerTypeConfig` ampliados.
- **Sí:** Tipo seleccionado con borde oscuro manteniendo los colores de referencia. **No:** invertir la paleta de la píldora.
- **Sí:** `photo.caption = "Foto · <descripción>"` (el feed usa `PhotoPlaceholder`, no la imagen real).

## Risks

| Riesgo                                                  | Mitigación                                                                                               |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Los objetos URL de las fotos quedan en memoria          | `URL.revokeObjectURL` al quitar una miniatura con la X.                                                  |
| Lógica del toggle "Toda la sala" ambigua                | Reglas exactas en el plan (paso 4) y casos cubiertos en acceptance criteria, verificados por Playwright. |
| El post se pierde al recargar (memoria)                 | Esperado por decisión del usuario; sin persistencia en este spec.                                        |
| La combinación server/client con `useSyncExternalStore` | Verificar tras el paso 8 con `npm run build` y navegación real.                                          |

## What is **not** in this spec

- Persistencia entre sesiones ni API.
- Subida real de imágenes.
- Edición de publicaciones, likes y comentarios funcionales.
- Página de detalle de publicación.
- Store compartido de niños entre `/kids` y `/crear-publicacion`.
