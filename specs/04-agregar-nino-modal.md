# SPEC 04 — Modal de agregar niño en `/kids`

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-08-13
> **Objective:** Agregar un modal en `/kids` para crear un niño con 3 campos obligatorios (nombre, fecha de nacimiento con máscara dd/mm/aaaa y sala), que al guardar lo agrega en memoria al listado agrupado por sala (Sol, Tierra y Luna).

## Scope

**In:**

- Modal con los campos NOMBRE COMPLETO, FECHA DE NACIMIENTO y SALA, replicando el estilo de `agregar-nino.dc.html`.
- Los 3 campos son obligatorios; errores inline bajo cada campo al pulsar Guardar.
- Máscara automática dd/mm/aaaa en la fecha de nacimiento (inserta `/` al escribir).
- Dropdown de sala hardcodeado con las opciones Sol, Tierra y Luna; Sol preseleccionada.
- Guardar agrega el niño al listado en memoria (estado React) y cierra el modal.
- El listado `/kids` se agrupa en 3 secciones siempre visibles: SALA SOL, SALA TIERRA y SALA LUNA, cada una con su contador de niños.
- Renombrar el dato `classroom` de los 8 niños del mock de "Soles" a "Sol".
- Calcular la edad del niño nuevo a partir de su fecha de nacimiento.

**Out of scope (for future specs):**

- Campos de alergias y notas médicas de la referencia.
- Persistencia entre sesiones (localStorage, base de datos, API).
- Renombrar "Soles" fuera del listado `/kids` (sidebar, feed, perfil, `currentUser.role`).
- Perfil funcional del niño recién agregado (ver Risks).
- Edición o eliminación de niños.
- Validación semántica de la fecha (día/mes/año reales, fechas futuras).

## Data model

No se introduce una estructura de datos nueva persistente. Se reutiliza `Child` (`lib/mock/children.ts`) y se define una lista de salas hardcodeada:

```ts
// Opciones de sala del modal (const local al componente o en el mock).
export const classrooms = ["Sol", "Tierra", "Luna"];
```

- El niño nuevo se crea con: `slug` kebab desde el nombre, `initial` = primera letra, `avatarBg`/`avatarColor` de una paleta fija, `age` calculado desde la fecha, `birthDate` en formato corto, `enrollmentDate` = fecha actual, `parentsCount` 0, `parents` [] y `classroom` elegido.

## Implementation plan

1. **Mock en `lib/mock/children.ts`.** Cambiar `classroom: "Soles"` → `"Sol"` en los 8 niños. _Test:_ `npm run build` sin errores de tipos.
2. **Encabezado de `/kids`.** Usar `"Sol"` en lugar de `classroom.name` de `lib/mock/feed.ts` para el label de sección.
3. **Modal en `components/kids/add-child-modal.tsx`.** Overlay con tarjeta al estilo de la referencia (fondo `#FBF4EC`, border `#ECE0D0`, radio 24px), header con Cancelar / "Agregar niño" / Guardar, y los 3 campos con sus labels. _Test:_ render aislado.
4. **Estado en `app/kids/page.tsx`.** Pasar los children a `useState`, manejar estado `open` del modal y hacer que el botón "Agregar niño" lo abra. _Test:_ abrir/cerrar el modal.
5. **Máscara y validación.** Máscara dd/mm/aaaa en el campo de fecha y validación inline al pulsar Guardar. _Test:_ escribir en la fecha inserta `/`; Guardar con campos vacíos muestra errores.
6. **Agrupación del listado.** Renderizar siempre 3 secciones de sala con contadores. _Test:_ las 3 secciones aparecen aunque alguna tenga 0 niños.
7. **Lógica de Guardar.** Validar, generar el `Child`, agregarlo al estado y cerrar el modal. _Test:_ el niño nuevo aparece en su sección con edad calculada.
8. **Verificación.** `npm run lint` y `npm run build` (typecheck) sin errores; comparación visual del modal contra `references/pantallas/agregar-nino.dc.html`.

## Acceptance criteria

- [ ] El botón "Agregar niño" en `/kids` abre el modal.
- [ ] El modal muestra los 3 campos obligatorios y los botones Cancelar y Guardar.
- [ ] El dropdown de sala ofrece Sol (preseleccionada), Tierra y Luna.
- [ ] La fecha de nacimiento aplica máscara dd/mm/aaaa al escribir.
- [ ] Pulsar Guardar con campos vacíos muestra errores inline bajo cada campo y no cierra el modal.
- [ ] Pulsar Guardar con los 3 campos completos agrega el niño al listado y cierra el modal.
- [ ] El niño nuevo aparece en la sección de su sala con la edad calculada.
- [ ] El listado muestra siempre las secciones SALA SOL, SALA TIERRA y SALA LUNA con sus contadores.
- [ ] Los 8 niños del mock muestran sala "Sol".
- [ ] Cancelar cierra el modal sin agregar nada.
- [ ] `npm run build` pasa sin errores.

## Decisions

- **Sí:** Solo 3 campos obligatorios — alergias y notas médicas quedan para un spec futuro.
- **No:** Los 5 campos de la referencia en el modal — fuera de scope.
- **Sí:** Persistencia en memoria con `useState` — sin backend ni localStorage.
- **No:** Mock estático sin mutación — el listado debe reflejar el niño nuevo.
- **Sí:** Tras guardar, cerrar y volver al listado — flujo simple, fiel a la referencia.
- **No:** Navegar al perfil del niño recién creado — su perfil no existe aún.
- **Sí:** Salas hardcodeadas Sol/Tierra/Luna con Sol preseleccionada — decisión del usuario.
- **No:** Mantener "Soles" — se abandona en favor de las 3 salas.
- **Sí:** Validación solo de máscara en la fecha — sin validación semántica.
- **Sí:** Errores inline al pulsar Guardar.
- **No:** Botón deshabilitado hasta completar — los errores inline son más claros.
- **Sí:** Listado siempre con 3 secciones de sala, aunque alguna tenga 0 niños.
- **No:** Solo secciones con niños — inconsistente con el concepto de 3 salas fijas.
- **Sí:** Renombrar el mock a "Sol" solo en el listado `/kids`.
- **No:** Renombrar "Soles" en toda la app — fuera de scope.
- **Sí:** Edad calculada desde la fecha de nacimiento.

## Risks

| Riesgo                                                                                    | Mitigación                                                                      |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| El niño nuevo genera un `slug` sin perfil en `getChildBySlug`; clic en su tarjeta da 404. | Documentado y fuera de scope; el perfil llega en un spec futuro.                |
| El niño agregado se pierde al recargar la página (memoria).                               | Persistencia real queda fuera de scope por decisión del usuario.                |
| `children` importado como constante: mutarlo rompe el server component.                   | Copiar a estado local con `useState` en la página; no mutar el array importado. |

## What is not in this spec

- Campos de alergias y notas médicas.
- Persistencia entre sesiones ni API.
- Renombrado de "Soles" fuera de `/kids`.
- Perfil del niño recién agregado.
- Edición o eliminación de niños.
- Validación semántica de fechas.
