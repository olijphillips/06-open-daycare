# SPEC 05 — Vincular un padre a un niño (modal)

> **Status:** Aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-08-14
> **Objective:** Activar el modal de vincular un padre desde el perfil del niño replicando `vincular-padre.dc.html`, y añadir el padre nuevo a la lista "PADRES VINCULADOS" con estado pendiente en memoria.

## Scope

**In:**

- Modal overlay "Vincular padre" con subtítulo "a {nombre del niño}", accesible desde "Vincular otro padre" del perfil `/kids/[slug]`.
- Campos del modal fieles a la referencia: banner de aviso ("Le enviaremos un correo con un código… Solo verá el feed de Mateo."), NOMBRE DEL PADRE/MADRE, EMAIL, selector segmentado de parentesco y recuadro "CÓDIGO DE INVITACIÓN" (`7K4P9`, "Vence en 7 días").
- CTA "Enviar invitación" (gradiente naranja + icono de avión): añade el padre a la lista con estado `pending` (badge PENDIENTE) y cierra el modal.
- La X de cierre cierra el modal sin cambios en la lista.
- Estado de la lista en memoria (`useState`), mismo patrón que SPEC 04, sin mutar el array importado del mock.

**Out of scope (for future specs):**

- Envío real de correo con el código de invitación.
- Activación de cuenta del padre (flujo ya existente en `/activar-cuenta`).
- Gating del feed por rol ("Solo verá el feed de Mateo").
- Rol "Tutor/a" del mockup (decisión del usuario: solo Mamá/Papá).
- Validación del formulario (decisión del usuario: envío sin validación).
- Edición o desvinculación de padres.
- Persistencia entre sesiones.

## Data model

No se introduce una estructura de datos nueva persistente. Se reutiliza `Parent` (`lib/mock/children.ts`) sin cambios en los tipos (`ParentRole` sigue siendo `"Mamá" | "Papá"`) y se añade un builder:

```ts
// lib/mock/children.ts
// Crea un Parent pendiente a partir del modal de vincular.
export function buildNewParent(input: {
  name: string; // "Juan Pérez"
  role: ParentRole; // "Mamá" | "Papá"
}): Parent;
```

Convenciones:

- `status` siempre `"pending"`, `initial` = primera letra de `name`, y `avatarBg` según rol para mantener la paleta del mock: Mamá → `#C9B6E8`, Papá → `#A9C7E8` (el texto del avatar va en blanco).
- El email capturado en el modal no se persiste: `Parent` no tiene campo email y se descarta tras el envío.

## Implementation plan

1. **Builder en `lib/mock/children.ts`.** Añadir `buildNewParent` (rol → `avatarBg` según paleta, `status: "pending"`, `initial` de la primera letra). _Test:_ `npm run build` sin errores de tipos.
2. **Modal en `components/kids/link-parent-modal.tsx`** (`'use client'`). Overlay con tarjeta al estilo de la referencia (fondo `#FBF4EC`, border `#ECE0D0`, radio 24px, sombra suave) y header con la X de cierre a la derecha. Cuerpo: banner de aviso, campo NOMBRE DEL PADRE/MADRE, campo EMAIL, selector segmentado Mamá/Papá (Mamá activo por defecto, solo 2 botones), recuadro de código `7K4P9` con "Vence en 7 días", y CTA "Enviar invitación". Props: `childName`, `onClose`, `onSubmit({ name, role })`. _Test:_ render aislado.
3. **Sección de padres en `components/kids/linked-parents-card.tsx`** (`'use client'`). Extrae la tarjeta "PADRES VINCULADOS" del perfil: recibe `parents` y `childName`, mantiene la lista en `useState`, reutiliza `parentStatusConfig`/`ParentRow` del perfil y abre el modal al pulsar "Vincular otro padre". _Test:_ render aislado con la lista de Mateo.
4. **Conexión en `components/kids/kid-profile.tsx`.** Sustituir el bloque de padres estáticos y el `<a href="#">` por `LinkedParentsCard` pasando `child.parents` y `child.name`. El resto del perfil sigue siendo server. _Test:_ `/kids/mateo-fernandez` muestra la lista original sin cambios.
5. **Lógica de envío.** En `LinkedParentsCard`, al recibir `onSubmit` crear el padre con `buildNewParent`, agregarlo al estado y cerrar el modal. _Test:_ aparece "Juan Pérez · Papá · invitación enviada" con badge PENDIENTE.
6. **Verificación.** `npm run lint` y `npm run build` (typecheck) sin errores; comparación visual del modal contra `references/pantallas/vincular-padre.dc.html` (sin el botón Tutor/a); recarga de página restaura la lista original.

## Acceptance criteria

- [ ] En `/kids/mateo-fernandez`, "Vincular otro padre" abre el modal "Vincular padre a Mateo Fernández".
- [ ] El modal muestra el banner de aviso, NOMBRE DEL PADRE/MADRE, EMAIL, selector segmentado solo con Mamá (activo por defecto) y Papá, el recuadro con el código `7K4P9` y "Vence en 7 días", y el CTA "Enviar invitación".
- [ ] Escribir "Juan Pérez", seleccionar Papá y enviar: el modal se cierra y aparece "Juan Pérez · Papá · invitación enviada" con badge PENDIENTE (bg `#F7E7A6`, texto `#9A7B1E`).
- [ ] Enviar con campos vacíos funciona igual (sin validación) y crea el padre.
- [ ] La X de cierre cierra el modal sin cambios en la lista.
- [ ] El padre nuevo se coloca al final de la lista, tras los ya existentes.
- [ ] Recargar la página restaura la lista original del mock (estado en memoria).
- [ ] El resto del perfil (cabecera, alergias, tarjeta de datos, "Resumen del día") se mantiene intacto.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa (typecheck) con `/kids/[slug]` prerenderizada.

## Decisions

- **Sí:** Modal overlay cliente sobre el perfil — mismo patrón que `AddChildModal` (SPEC 04) y fiel a la palabra "modal" del requerimiento.
- **No:** Ruta propia `/kids/[slug]/vincular` — el mockup es una tarjeta modal; además obligaría a duplicar la lista de padres.
- **Sí:** Solo roles Mamá/Papá (decisión del usuario).
- **No:** Ampliar `ParentRole` con `"Tutor/a"` aunque el mockup lo muestre — se omite el botón.
- **Sí:** Código estático `7K4P9`, consistente con `authDefaults.invitationCode` de `/activar-cuenta` (SPEC 03).
- **No:** Código aleatorio por apertura — desincroniza el mock de la activación.
- **Sí:** Envío sin validación (decisión del usuario).
- **No:** Errores inline como en `AddChildModal` — el usuario prefirió el flujo directo del mockup.
- **Sí:** Estado en memoria con `useState`, copiando la lista al estado local.
- **No:** localStorage — rompe la consistencia del mock (SPEC 04 ya decidió lo mismo).
- **Sí:** `avatarBg` derivado del rol — reutiliza la paleta existente del mock (Mamá `#C9B6E8`, Papá `#A9C7E8`).
- **No:** Paleta nueva o aleatoria — incoherente con los padres ya existentes.
- **Sí:** El email se descarta tras el envío — `Parent` no tiene ese campo.
- **No:** Extender `Parent` con email — el envío real llega en un spec futuro.
- **Sí:** Los pasos 3 y 4 no mutan el array `children` importado — se copia a estado local (misma precaución que SPEC 04).

## Risks

| Riesgo                                                                    | Mitigación                                                                                                              |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| La lista de padres se reinicia al recargar o navegar (estado en memoria). | Aceptado: consistente con el mock de SPEC 04; la persistencia es spec futura.                                           |
| Página `/kids/[slug]` es server con `generateStaticParams`.               | El estado y el modal viven en componentes cliente; la página no se convierte a cliente y se preserva el prerenderizado. |
| El email capturado se descarta.                                           | Documentado en el data model; el envío real de correo queda fuera de scope.                                             |

## What is not in this spec

- Envío real de correo con el código de invitación.
- Activación de cuenta del padre ni gating del feed por rol.
- Rol "Tutor/a".
- Validación del formulario.
- Edición o desvinculación de padres.
- Persistencia entre sesiones.
- Cambios en el mock estático `children` (los padres nuevos solo viven en el estado local de la sección).
