# AGENTS.md - @dfactory/core

## Ownership
Core contracts and runtime behavior for discovery, registry, schema validation, and adapter orchestration.

## Guardrails
- Preserve `DFactoryConfig` defaults and backwards compatibility.
- Keep adapter contracts framework-neutral.
- Ensure all public API changes are reflected in OpenAPI and docs.

## Validation
Run:
1. `pnpm --filter @dfactory/core typecheck`
2. `pnpm --filter @dfactory/core test`
