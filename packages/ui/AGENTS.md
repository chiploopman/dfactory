# AGENTS.md - @dfactory/ui

## Ownership
Storybook-like manager UX: template catalog, preview, source, schema, and API playground.

## Guardrails
- Prefer shadcn-style primitives for common controls.
- Keep production flags respected (source/playground visibility).
- Ensure keyboard and responsive behavior remain usable.

## Validation
Run:
1. `pnpm --filter @dfactory/ui typecheck`
2. `pnpm --filter @dfactory/ui test`
3. `pnpm test:e2e`
