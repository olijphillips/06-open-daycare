# SPEC 03 — Login `/login` y Activación de cuenta `/activar-cuenta`

> **Status:** Aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-08-12
> **Objective:** Habilitar `/login` y `/activar-cuenta` replicando `login.dc.html` y `activar-cuenta.dc.html` con mock data en `lib/mock/auth.ts`, navegación cruzada entre ambas y hacia `/`, y sin el toggle "INGRESO COMO" (Personal/Familia) del mockup.

## Scope

**In:**

- Ruta `/login` que reproduce `login.dc.html` **sin** el selector INGRESO COMO (Personal/Familia): panel naranja izquierdo (logo OpenDayCare, titular "El día de cada niño, compartido con su familia.", subtexto, footer "🌿 Guardería Sala Soles") + formulario (título "Iniciar sesión", email precargado `caro@opendaycare.com`, contraseña, "¿Olvidaste tu contraseña?"→`#`, botón "Iniciar sesión"→`/`, enlace "Activá tu cuenta"→`/activar-cuenta`).
- Ruta `/activar-cuenta` que reproduce `activar-cuenta.dc.html`: logo, título "Bienvenida a OpenDayCare", card de invitación ("Te invitaron a seguir a" / "Mateo · Sala Soles"), campos CÓDIGO DE INVITACIÓN (`7K4P9`), EMAIL (`lucia.fernandez@gmail.com`) y CREAR CONTRASEÑA precargados, checkbox "Autorizo a la guardería…" marcado, botón "Activar mi cuenta"→`/`, enlace "Iniciar sesión"→`/login`.
- Mock data en `lib/mock/auth.ts`: tipo `Invitation` + `authDefaults` + `invitation`.
- Ambas rutas como server components **standalone** (sin `AppShell`/sidebar), fondo `#FBF4EC` y `min-h-screen`.
- Login responsive: panel izquierdo oculto en viewport < `md` (formulario centrado).

**Out of scope (for future specs):**

- Autenticación real, validación de formularios, sesión ni persistencia.
- Pantallas post-login rol Familia (`familia-feed` no existe aún).
- Flujo de recuperación de contraseña ("¿Olvidaste tu contraseña?" va a `#`).
- Envío real de la invitación ni guardado de la contraseña.
- Route groups `(maestra)`/`(familia)`.

## Data model

```ts
// lib/mock/auth.ts
export interface Invitation {
  childName: string; // "Mateo"
  classroom: string; // "Sala Soles"
  initial: string; // "M"
  avatarBg: string; // "#A9D9E8"
  avatarColor: string; // "#1F7A93"
}

// Valores de precarga fieles al mockup.
export const authDefaults = {
  loginEmail: "caro@opendaycare.com",
  loginPasswordPlaceholder: "••••••••",
  invitationCode: "7K4P9",
  accountEmail: "lucia.fernandez@gmail.com",
};

export const invitation: Invitation = {
  childName: "Mateo",
  classroom: "Sala Soles",
  initial: "M",
  avatarBg: "#A9D9E8",
  avatarColor: "#1F7A93",
};
```

## Implementation plan

1. **Mock data en `lib/mock/auth.ts`.** Crear `Invitation`, `authDefaults` e `invitation`. _Test:_ importa sin errores de tipos.
2. **Brand panel en `components/auth/brand-panel.tsx`.** Panel naranja (gradiente `155deg #F6A98E→#F2937A→#EC7E62`, círculos decorativos), logo + "OpenDayCare", titular/subtexto y footer. _Test:_ render aislado.
3. **Login en `components/auth/login.tsx`.** Grid 2 columnas ≥ `md` (`brand-panel` + form); en < `md` solo el form. Form: email precargado, password, "¿Olvidaste tu contraseña?"→`#`, `PrimaryButton` "Iniciar sesión"→`/`, "Activá tu cuenta"→`/activar-cuenta`. **Sin** toggle INGRESO COMO. _Test:_ render aislado.
4. **Activar cuenta en `components/auth/activate-account.tsx`.** Logo box, título, card de invitación con `Avatar` (datos de `lib/mock/auth.ts`), campos precargados, checkbox marcado, `PrimaryButton` "Activar mi cuenta"→`/`, "Iniciar sesión"→`/login`. _Test:_ render aislado.
5. **Páginas en `app/login/page.tsx` y `app/activar-cuenta/page.tsx`.** Server components que renderizan el feature component dentro de un contenedor `min-h-screen` con fondo `#FBF4EC`. _Test:_ ambas rutas renderizan sin errores.
6. **Verificación.** `npm run lint` y `npm run build` (typecheck) sin errores; comparación visual contra `references/pantallas/login.dc.html` y `activar-cuenta.dc.html` en desktop; en viewport 390px el login muestra solo el form; navegación `/login`→`/activar-cuenta`→`/login` y ambos botones principales→`/`.

## Acceptance criteria

- [ ] `npm run dev` muestra `/login` y `/activar-cuenta` sin errores en consola.
- [ ] `/login` reproduce `login.dc.html` **sin** el bloque INGRESO COMO (ni botones Personal/Familia).
- [ ] El panel izquierdo muestra logo OpenDayCare, titular "El día de cada niño, compartido con su familia.", subtexto y "🌿 Guardería Sala Soles".
- [ ] El form muestra EMAIL (precargado `caro@opendaycare.com`), CONTRASEÑA, "¿Olvidaste tu contraseña?"→`#`, botón "Iniciar sesión"→`/` y enlace "Activá tu cuenta"→`/activar-cuenta`.
- [ ] `/activar-cuenta` reproduce `activar-cuenta.dc.html`: logo, "Bienvenida a OpenDayCare", card "Mateo · Sala Soles" (datos desde `lib/mock/auth.ts`), código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña precargada y checkbox de autorización marcado.
- [ ] El botón "Activar mi cuenta"→`/` y el enlace "Iniciar sesión"→`/login`.
- [ ] Ambas pantallas usan fondo `#FBF4EC` y están fuera del `AppShell` (sin sidebar).
- [ ] En viewport < `md` el login oculta el panel izquierdo y centra el formulario.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npm run build` pasa (typecheck) con `/login` y `/activar-cuenta` prerenderizadas.
- [ ] La comparación visual con los `.dc.html` de referencia en desktop no muestra diferencias significativas.

## Decisions

- **Sí:** Rutas `/login` y `/activar-cuenta` standalone fuera del `AppShell` — las pantallas de auth no llevan sidebar; patrón estándar.
- **No:** Reusar el shell con sidebar — no corresponde a pantallas de login.
- **Sí:** Quitar el toggle INGRESO COMO (decisión del usuario) — solo queda el flujo único hacia `/`.
- **Sí:** Botones principales → `/` — familia-feed aún no existe; se enlazará cuando llegue su spec.
- **No:** Enlaces a `familia-feed` — ruta inexistente, 404.
- **Sí:** Inputs precargados con los valores del mockup — consistente con el enfoque pixel-perfect de SPEC 01/02.
- **No:** Placeholders vacíos — se aleja de la referencia.
- **Sí:** Panel izquierdo oculto en < `md` — simple, sin inventar UI sin referencia.
- **No:** Banner compacto en mobile — no existe en las referencias.
- **Sí:** Fondo `#FBF4EC` en estas pantallas aunque difiera del token global `#F6ECDF` — fiel al mockup; cambio acotado a estas dos rutas.
- **No:** Crear token nuevo ni modificar el global — el resto de la app sigue con `#F6ECDF`.
- **Sí:** Datos de invitación en `lib/mock/auth.ts` — mismo patrón que `feed.ts`/`children.ts`.
- **No:** Hardcodear el card de invitación en el JSX — mezcla datos y presentación.
- **Sí:** Reutilizar `Avatar` y `PrimaryButton` de SPEC 01 (ajustando tamaño con `className`).
- **No:** Crear primitiva `Input`/`TextField` — son pocos inputs y el estilo es específico del mockup.
- **Sí:** Server components (sin estado) — no hay interacción real que requiera `'use client'`.
- **No:** Validación ni lógica de envío — fuera de scope (auth real es spec futura).

## Risks

| Riesgo                                              | Mitigación                                                                                      |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `PrimaryButton` usa 14.5px y el mockup 16px/w800    | Ajustar con `className` sin modificar el componente (afecta a otras pantallas).                 |
| El fondo `#FBF4EC` difiere del token global         | Decisión documentada; contenedor `min-h-screen` propio por ruta, sin tocar `globals.css`.       |
| No hay screenshot de login/activar-cuenta           | Verificación visual contra los `.dc.html` directamente (mismo caso que perfil-nino en SPEC 02). |
| Panel decorativo del login no aporta info en mobile | Oculto en < `md`; se evita código muerto con `hidden md:flex`.                                  |

## What is not in this spec

- Autenticación, validación, sesión ni persistencia.
- Pantalla `familia-feed` ni rol Familia.
- Recuperación de contraseña.
- Route groups `(maestra)`/`(familia)`.
