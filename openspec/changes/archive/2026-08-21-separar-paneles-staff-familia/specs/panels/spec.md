## Purpose

Define la separación estructural de la aplicación en dos paneles por rol de usuario (staff/admin y familia), con rutas, shells, navegación y control de acceso propios para cada panel.

## ADDED Requirements

### Requirement: Rutas de panel separadas por rol

La aplicación DEBE organizar sus rutas en dos paneles según el rol del usuario autenticado: staff y admin usan el panel `/staff`; los usuarios con rol parent usan el panel `/familia`. La raíz `/` NO DEBE mostrar contenido de ningún panel y DEBE redirigir al home del panel del usuario autenticado.

#### Scenario: Staff logueado visita la raíz

- **WHEN** un usuario con rol staff o admin autenticado visita `/`
- **THEN** el sistema lo redirige a `/staff`

#### Scenario: Padre logueado visita la raíz

- **WHEN** un usuario con rol parent autenticado visita `/`
- **THEN** el sistema lo redirige a `/familia`

#### Scenario: Sin sesión en una ruta protegida

- **WHEN** un visitante sin sesión abre `/staff`, `/familia` o `/posts` (o cualquier ruta dentro de ellas)
- **THEN** el sistema lo redirige a `/login`

#### Scenario: Login redirige por rol

- **WHEN** un usuario inicia sesión correctamente o la activación de cuenta crea un usuario
- **THEN** el sistema lo envía al home de su panel según su rol (staff → `/staff`, parent → `/familia`)

### Requirement: Acceso cruzado entre paneles bloqueado

El sistema DEBE impedir que un usuario abra rutas de un panel que no le corresponde y DEBE redirigirlo al home de su panel.

#### Scenario: Padre intenta abrir una ruta staff

- **WHEN** un usuario con rol parent visita `/staff` o cualquier ruta bajo `/staff`
- **THEN** el sistema lo redirige a `/familia`

#### Scenario: Staff intenta abrir una ruta de familia

- **WHEN** un usuario con rol staff o admin visita `/familia` o cualquier ruta bajo `/familia`
- **THEN** el sistema lo redirige a `/staff`

### Requirement: Shell y navegación propios de cada panel

Cada panel DEBE presentar su propia navegación y branding en el sidebar, según el rol del usuario autenticado.

#### Scenario: Sidebar del panel staff

- **WHEN** un usuario con rol staff o admin autenticado abre cualquier ruta de `/staff`
- **THEN** el sidebar muestra el branding "Sala Soles", el botón "Nueva publicación" y los ítems Feed, Niños, Avisos y Mi cuenta

#### Scenario: Sidebar del panel familia

- **WHEN** un usuario con rol parent autenticado abre cualquier ruta de `/familia`
- **THEN** el sidebar muestra el branding "Familia", sin botón de publicar, y los ítems Feed, Resumen del día y Mi cuenta

### Requirement: Feed del panel familia

El panel familia DEBE mostrar una página de feed con encabezado propio ("TU FAMILIA") y una lista de publicaciones.

#### Scenario: Padre abre el feed de familia

- **WHEN** un usuario con rol parent abre `/familia`
- **THEN** el sistema muestra el encabezado "TU FAMILIA" con el saludo "Hola, <nombre>" y una lista de publicaciones del feed

#### Scenario: El feed de familia no expone herramientas de staff

- **WHEN** un usuario con rol parent ve el feed de familia
- **THEN** el sistema no le muestra el botón "Nueva publicación" ni herramientas de creación de posts

### Requirement: Rutas compartidas entre paneles

El detalle de una publicación y la vista de foto DEBEN ser accesibles tanto desde el panel staff como desde el panel familia, y DEBEN respetar el control de acceso por rol.

#### Scenario: Staff abre el detalle de una publicación

- **WHEN** un usuario con rol staff o admin autenticado abre `/posts/<id>` o `/posts/<id>/foto`
- **THEN** el sistema muestra la pantalla dentro del shell del panel staff

#### Scenario: Padre abre el detalle de una publicación

- **WHEN** un usuario con rol parent autenticado abre `/posts/<id>` o `/posts/<id>/foto`
- **THEN** el sistema muestra la pantalla dentro del shell del panel familia

### Requirement: Destinos de navegación placeholder

Los destinos de navegación de cada panel que aún no tienen pantalla implementada DEBEN existir como rutas reales y mostrar una pantalla provisional, para que los ítems del sidebar no queden sin destino.

#### Scenario: Navegar a un destino sin pantalla implementada

- **WHEN** un usuario navega a `/staff/avisos`, `/staff/mi-cuenta`, `/familia/resumen-dia` o `/familia/mi-cuenta`
- **THEN** el sistema muestra una pantalla provisional "En construcción" dentro del shell de su panel, sin romper la navegación
