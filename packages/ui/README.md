# @dfactory/ui

## Purpose

`@dfactory/ui` is the Storybook-style manager interface for dFactory.

It includes:

- template catalog and search
- HTML/PDF preview controls
- payload/schema/source/playground inspector panels
- production UI asset builder used by CLI/server

## Usage

Local UI-only development:

```bash
pnpm --filter @dfactory/ui dev
```

Build UI assets:

```bash
pnpm --filter @dfactory/ui build
```

The package root ships static UI assets. JavaScript helpers are exported only from `@dfactory/ui/node` for CLI and server integration.

## Development

```bash
pnpm --filter @dfactory/ui typecheck
pnpm --filter @dfactory/ui test
pnpm test:e2e
```

Use official shadcn component composition for all structural UI updates.

## Troubleshooting

- Preview iframe empty: verify API URL environment wiring in dev server startup.
- Catalog state regressions: run `tests/e2e/dfactory-ui.spec.ts`.
- style drift: keep semantic tokens and avoid raw color utilities in shared primitives.

## Related Documentation

- [Getting Started](/docs/getting-started)
- [Best Practices](/docs/best-practices)
