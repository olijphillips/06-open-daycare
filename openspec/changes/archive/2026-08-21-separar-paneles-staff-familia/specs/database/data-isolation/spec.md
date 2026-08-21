## Purpose

Garantiza el aislamiento de datos del modelo multi-tenant de la guardería mediante políticas RLS que limitan la lectura por rol y por daycare, de modo que cada padre solo vea los datos de sus propios hijos.

## ADDED Requirements

### Requirement: Los padres solo leen a sus propios niños

La tabla `children` DEBE restringir el `SELECT` mediante RLS: un usuario con rol parent solo puede leer los niños con los que tiene un vínculo en `parent_children`; el staff (admin/staff) puede leer los niños de su daycare.

#### Scenario: Padre consulta la lista de niños

- **WHEN** un usuario con rol parent autenticado consulta `children`
- **THEN** el sistema solo le devuelve los niños con una fila en `parent_children` cuyo `parent_id` es su propio id

#### Scenario: Staff consulta la lista de niños

- **WHEN** un usuario con rol staff o admin autenticado consulta `children`
- **THEN** el sistema le devuelve los niños de su daycare

### Requirement: Los vínculos padre-niño son privados

La tabla `parent_children` DEBE restringir el `SELECT` mediante RLS: un usuario solo puede leer sus propios vínculos (filas donde `parent_id` es su id); el staff puede leer los vínculos de su daycare.

#### Scenario: Padre consulta los vínculos

- **WHEN** un usuario con rol parent autenticado consulta `parent_children`
- **THEN** el sistema solo le devuelve las filas con `parent_id` igual a su propio id

#### Scenario: Staff consulta los vínculos de un niño

- **WHEN** un usuario con rol staff o admin autenticado consulta `parent_children` por `child_id`
- **THEN** el sistema le devuelve los vínculos de ese niño

### Requirement: Las invitaciones solo son visibles para el staff

La tabla `invitations` DEBE restringir el `SELECT` mediante RLS al staff (admin/staff). El flujo de activación de cuenta DEBE seguir funcionando aunque el padre no pueda leer la tabla directamente.

#### Scenario: Un padre intenta leer invitaciones

- **WHEN** un usuario con rol parent autenticado consulta `invitations`
- **THEN** el sistema no le devuelve ninguna fila

#### Scenario: Un padre activa su cuenta con código

- **WHEN** un usuario con rol parent usa el código de invitación para activar su cuenta
- **THEN** el sistema valida y acepta la invitación correctamente (el flujo usa funciones que eluden RLS)

### Requirement: El staff puede leer los usuarios de su daycare

La tabla `users` DEBE permitir el `SELECT` al staff (admin/staff) además del propio usuario, de modo que el perfil de un niño pueda listar a los padres vinculados.

#### Scenario: El staff lista los padres de un niño

- **WHEN** un usuario con rol staff o admin autenticado consulta `users` (p. ej. nombres de padres vinculados)
- **THEN** el sistema le devuelve los usuarios de su daycare

#### Scenario: Un padre consulta usuarios

- **WHEN** un usuario con rol parent autenticado consulta `users`
- **THEN** el sistema solo le devuelve su propia fila

### Requirement: daycares y rooms acotados al daycare del usuario

Las tablas `daycares` y `rooms` DEBEN restringir el `SELECT` mediante RLS al daycare del usuario autenticado, evitando filtrar datos de otros tenants.

#### Scenario: Un usuario lee daycares y rooms

- **WHEN** un usuario autenticado consulta `daycares` o `rooms`
- **THEN** el sistema solo le devuelve las filas de su propio `daycare_id`
