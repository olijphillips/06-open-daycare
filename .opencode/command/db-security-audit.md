---
description: Audita la seguridad de la base de datos Supabase: RLS, políticas, roles asignables por el usuario, funciones SECURITY DEFINER y buenas prácticas Postgres, en la BD real y en las migraciones locales.
agent: db-security-auditor
---

Ejecuta el flujo completo de `db-security-auditor`: audita el estado de seguridad de la base de datos Supabase (RLS, políticas, triggers, funciones y grants) y las migraciones locales de `supabase/migrations/`, detectando fugas de datos entre niños y padres y malas prácticas de Supabase/Postgres. Solo audita y reporta; propone migraciones de corrección para que las aplique `db-migrator`.

$ARGUMENTS
