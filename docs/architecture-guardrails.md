# Architecture Guardrails

## Dependency boundaries

1. `@dfactory/core` must stay framework-agnostic.
2. `@dfactory/core` must not depend on `vue`, `react`, `@vitejs/plugin-vue`, or framework plugin packages.
3. `@dfactory/server` must not hardcode framework plugins in imports or dependencies.
4. Framework-specific runtime behavior belongs only in framework plugin packages and module loader packages.

## Runtime composition

1. Frameworks are discovered from `config.plugins`.
2. Module loading is resolved from `config.moduleLoader` or runtime auto-selection.
3. Core is orchestration only: discovery, validation, registry, rendering dispatch.

## CI enforcement

1. Dependency boundary tests must fail if forbidden dependencies are added to `core` or `server`.
2. Framework plugin conformance tests must pass for each supported framework plugin.
