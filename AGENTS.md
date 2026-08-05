<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Commands

- `npm run dev` — dev server on http://localhost:3000
- `npm run lint` — runs `eslint` directly (Next.js 16 removed `next lint`; do not use it)
- `npm run build` — production build; this is also the typecheck step (no separate `typecheck` script)
- No test framework is configured — do not assume `npm test` exists.

## Stack & config quirks

- Next.js 16.3.0 with App Router (`app/`), React 19.2.8, TypeScript (strict), Tailwind CSS v4.
- Tailwind v4 uses CSS-first config: `@import "tailwindcss"` + `@theme inline` in `app/globals.css`. There is no `tailwind.config.js` — customize the theme via `@theme inline`, not a JS config file.
- Path alias: `@/*` maps to the repo root (e.g. `@/app/page`), not `src/`.
- Fonts are loaded via `next/font/google` in `app/layout.tsx` (currently the Geist boilerplate; the design calls for Fredoka + Nunito — see references).

## Design references (source of truth for the UI)

- `references/pantallas/*.dc.html` — screen mockups for a daycare management app (guardería). Filenames and UI text are in Spanish: `login`, `feed`, `ninos` (children), `familia-feed`, `crear-publicacion`, `mi-cuenta`, etc.
- `references/screenshots/*.png` — rendered screenshots of the same screens.
- The `.dc.html` files are rendered by a standalone "dc-runtime" (`references/pantallas/support.js`, a generated bundle). This runtime is for previewing designs only — it is NOT part of the Next.js app and should not be imported or modified.
- Design system inferred from references: Fredoka + Nunito fonts, warm cream/brown palette (`#f6ecdf` background, `#3f362e` text). Match these when building real components.

## MCPs

- Playwright Screenshots y cualquier cosa relacionada a Playwright tienen que estar en la carpeta .playwright-mcp.

- Context. Usaremos este MCP para traer la documentación actualizada del framework.

## Spec Driven Development

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta habilidad para crear la implementación de las especificaciones.
