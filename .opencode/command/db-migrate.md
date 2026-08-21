---
description: Verifica que existan las migraciones de BD Supabase y las aplica (local y remoto).
agent: db-migrator
---

Ejecuta el flujo completo de `db-migrator`: verifica que existan migraciones para los cambios de esquema y los specs de BD, crea las faltantes en `supabase/migrations/` y las aplica en local y, tras confirmación, en remoto.

$ARGUMENTS
