# AGENTS.md

## Purpose

This repository contains DFactory, a Storybook-like PDF template catalog, preview, and generation platform.

## Architecture overview

- `packages/core`: template discovery, registry, config, schema, plugin contracts.
- `packages/adapter-react`: React framework plugin package (`@dfactory/framework-react`).
- `packages/adapter-vue`: Vue framework plugin package (`@dfactory/framework-vue`).
- `packages/module-loader-bundle`: default TypeScript/JavaScript template module loader.
- `packages/module-loader-vite`: transform-capable loader for frameworks that require module transforms (e.g. Vue SFC).
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

Use `.agents/skills/README.md` for repo-local modules (templates, framework plugins, Playwright, deployment). For UI work, use official shadcn v4 tooling via `packages/ui/components.json`.

## Commands instructions

Do not try to build and verify docs (next js app) in sandboxed environment. It never works.
Ask for elevated permission and build on users machine.
