# Open Daycare

Aplicación web de gestión de guarderías construida con [Next.js](https://nextjs.org) (App Router), React 19, TypeScript (strict) y Tailwind CSS v4, con backend de [Supabase](https://supabase.com) (Auth, base de datos y migraciones).

## Requisitos

- Node.js 20+ (probado con v22)
- npm
- Docker Desktop (para el stack local de Supabase y migraciones locales)
- Supabase CLI (`supabase --version`; instalable vía Scoop/Homebrew o `npx supabase`)
- Una cuenta en [Supabase](https://supabase.com) con el proyecto de la guardería creado

## Configuración del entorno

Copia el archivo de plantilla y rellena los valores:

```bash
cp .env.template .env.local
```

Variables disponibles (definidas en `.env.template`):

| Variable | Descripción |
| --- | --- |
| `SUPABASE_DB_PASSWORD` | Contraseña de la BD del proyecto Supabase (solo CLI, no exponer en el cliente) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase, p. ej. `https://jmjcqadnhjdiuliaiqpy.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key del proyecto (Dashboard > Settings > API) |
| `RESEND_API_KEY` | Clave de API de [Resend](https://resend.com) para el envío de correos (invitaciones, etc.) |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app, `http://localhost:3000` en local |

`.env.local` está en `.gitignore` y no se debe commitear. Instala las dependencias:

```bash
npm install
```

## Levantar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Otros comandos útiles:

```bash
npm run lint     # eslint
npm run build    # build de producción (también es el typecheck)
npm run start    # sirve el build de producción
```

> Nota: Next.js 16 eliminó `next lint`; usa siempre `npm run lint`.

## Supabase

El proyecto usa Supabase como backend. Hay dos formas de interactuar con él:

### 1. MCP de Supabase (OpenCode)

El MCP remoto de Supabase está configurado en `opencode.json` apuntando al proyecto `jmjcqadnhjdiuliaiqpy` (OpenDaycare):

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=jmjcqadnhjdiuliaiqpy&features=docs%2Caccount%2Cdatabase%2Cdebugging%2Cdevelopment%2Cfunctions%2Cbranching"
    }
  }
}
```

#### Autenticación (local)

El servidor MCP usa **registro dinámico de clientes OAuth**: la primera vez que se conecte, se abrirá una ventana del navegador para iniciar sesión en tu cuenta de Supabase y conceder acceso al cliente (elige la organización que contiene el proyecto). No hace falta crear un token manualmente.

Si el flujo de navegador no se dispara, reinicia OpenCode; la sesión se guarda y no volverá a pedir autorización hasta que expire.

#### Autenticación (CI/headless)

En entornos sin navegador (CI), se usa un **personal access token (PAT)** en la cabecera `Authorization`:

1. Crea un token en [Supabase > Account > Access Tokens](https://supabase.com/dashboard/account/tokens).
2. Pásalo al MCP con la cabecera `Authorization: Bearer <PAT>`:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=jmjcqadnhjdiuliaiqpy",
      "headers": {
        "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
```

> Nunca conectes el MCP a datos de producción; úsalo solo para desarrollo.

### 2. CLI de Supabase

#### Autenticarse

```bash
supabase login
```

Abre el navegador para generar un access token, que queda almacenado en el almacén de credenciales nativo del sistema (o en `~/.supabase/access-token` si no está disponible). En CI se puede saltar el login exportando `SUPABASE_ACCESS_TOKEN`.

#### Vincular el proyecto

```bash
supabase link --project-ref jmjcqadnhjdiuliaiqpy
```

Te pedirá la contraseña de la base de datos (la que pusiste al crear el proyecto). Verifica el estado con:

```bash
supabase projects list        # muestra el proyecto vinculado con ●
```

### Migraciones (flujo obligatorio)

Todos los cambios de BD se versionan como migraciones locales en `supabase/migrations/`:

```bash
supabase migration new <nombre>   # crear nueva migración
supabase start                    # levantar el stack local (requiere Docker)
supabase db reset                 # reaplicar migraciones + seed en local
supabase db push                  # aplicar migraciones pendientes al proyecto remoto
```

Reglas:

- Nunca aplicar SQL suelto/DDL directamente al proyecto remoto.
- No editar migraciones ya aplicadas a un entorno remoto; crear una migración nueva.
- El flujo típico: escribir migración local → probar en local (`supabase start`) → empujar a remoto (`supabase db push`).

## Cliente de la app

Los clientes de Supabase viven en `utils/supabase/` (`server.ts`, `client.ts` y `middleware.ts`). Las variables de entorno necesarias son `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

> Estado actual: la web aún no consume la BD directamente; la UI se alimenta de datos mock en `lib/mock/`.

## Más información

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
