# DFactory

DFactory is a Storybook-inspired platform for designing, previewing, cataloging, and generating PDF documents from code templates.

Currently supported template frameworks: React and Vue.

Framework runtime wiring is plugin-based (`config.plugins`) with explicit or auto-selected module loaders (`config.moduleLoader`).

## Quick start

```bash
pnpm install
pnpm dev
```

## Core commands

- `pnpm dev` - start API + UI in development mode.
- `pnpm build` - build all packages.
- `pnpm serve` - run production server.
- `pnpm index` - emit template index JSON.
- `pnpm run doctor` - validate local runtime prerequisites.
- `pnpm test` - run unit/integration test suites.
- `pnpm test:e2e` - run Playwright E2E tests.

## Install into existing projects

```bash
npm create dfactory@latest
# or
pnpm create dfactory@latest
# or
yarn create dfactory
```
