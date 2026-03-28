# Architecture Guardrails

## Dependency boundaries

1. `@dfactory/core` must stay framework-agnostic.
2. `@dfactory/core` must not depend on `vue`, `react`, `@vitejs/plugin-vue`, or framework plugin packages.
3. `@dfactory/server` must not hardcode framework plugins in imports or dependencies.
4. Framework-specific runtime behavior belongs only in framework plugin packages and module loader packages.
5. Rich PDF behavior must live in renderer/plugin packages, not in `@dfactory/core`.

## Runtime composition

1. Frameworks are discovered from `config.plugins`.
2. Module loading is resolved from `config.moduleLoader` or runtime auto-selection.
3. PDF feature plugins are discovered from `config.renderer.pdfPlugins`.
4. Core is orchestration only: discovery, validation, registry, rendering dispatch.

## CI enforcement

1. Dependency boundary tests must fail if forbidden dependencies are added to `core` or `server`.
2. Framework plugin conformance tests must pass for each supported framework plugin.
3. PDF feature runtime dependency license gate must pass (`pnpm test:licenses`) and only permissive SPDX licenses are allowed.
