# AGENTS.md

## Purpose
This repository contains DFactory, a Storybook-like PDF template catalog, preview, and generation platform.

## Architecture overview
- `packages/core`: template discovery, registry, config, schema, adapter contracts.
- `packages/adapter-react`: React template rendering adapter.
- `packages/renderer-playwright`: HTML-to-PDF rendering runtime.
- `packages/server`: API endpoints, auth, OpenAPI, static UI serving.
- `packages/ui`: Storybook-like catalog and playground UI with official shadcn v4 components.
- `packages/cli`: command entrypoint for `dev`, `build`, `serve`, `index`, `doctor`.
- `packages/create-dfactory`: bootstrap generator (`create dfactory`).

## Required checks before merge
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm test:e2e`

## Collaboration and safety
- Never use destructive git commands unless explicitly requested.
- Avoid reverting unrelated user changes.
- Prefer small, test-backed edits.
- Maintain API compatibility for documented routes and template contracts.

## Skills routing
Use `.agents/skills/README.md` for repo-local modules (templates, adapters, Playwright, deployment). For UI work, use official shadcn v4 tooling via `packages/ui/components.json`.
