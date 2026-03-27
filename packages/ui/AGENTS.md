# AGENTS.md - @dfactory/ui

## Ownership
Storybook-like manager UX: template catalog, preview, source, schema, and API playground.

## Guardrails
- Use official shadcn v4 CLI flows (`shadcn init`, `shadcn add`) and keep `components.json` authoritative.
- Prefer generated shadcn v4 primitives for common controls and avoid hand-rolled replacements.
- Keep production flags respected (source/playground visibility).
- Ensure keyboard and responsive behavior remain usable.

## Validation
Run:
1. `pnpm --filter @dfactory/ui typecheck`
2. `pnpm --filter @dfactory/ui test`
3. `pnpm test:e2e`
