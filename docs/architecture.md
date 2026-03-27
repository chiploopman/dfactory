# DFactory Architecture

## Runtime model

DFactory follows a Storybook-inspired split between:

1. Manager UI (`@dfactory/ui`) for catalog, preview, schema, source, and playground UX.
2. Runtime engine (`@dfactory/core` + framework plugins + module loaders + renderer) for template discovery, validation, and rendering.

In development, `dfactory dev` starts:

- API server on `:3210`
- Vite UI on `:3211`

In production, `dfactory serve` runs a single API service that can also serve static UI assets (`.dfactory/ui`).

## Rendering pipeline

1. Discover templates using configured globs.
2. Load template module and metadata.
3. Validate payload with zod schema.
4. Render HTML through framework plugins (`@dfactory/framework-react` and `@dfactory/framework-vue`).
5. Optionally convert HTML to PDF via Playwright renderer.

## Extensibility

- Framework plugins implement `DFactoryFrameworkPlugin` and register through `config.plugins`.
- Module loader packages are selected through `config.moduleLoader` or runtime auto-selection.
- Renderer is isolated from framework plugins, allowing future backend alternatives.
- Auth supports built-in API key checks and optional external auth hook module.
