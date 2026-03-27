# AGENTS.md - @dfactory/server

## Ownership
HTTP API, auth middleware, OpenAPI docs, readiness/liveness, and static UI serving for production.

## Guardrails
- Preserve endpoint contracts for `/api/document/*` and `/api/templates/*`.
- Keep production defaults strict: source and playground disabled unless enabled.
- Ensure auth logic is centralized and test-backed.

## Validation
Run:
1. `pnpm --filter @dfactory/server typecheck`
2. `pnpm --filter @dfactory/server test`
