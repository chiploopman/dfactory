# @dfactory/core

## Purpose

`@dfactory/core` is the framework-agnostic runtime orchestrator for dFactory.

It owns:

- config loading and validation
- template discovery and registry lifecycle
- runtime plugin/module-loader resolution
- source manifest generation and shared contracts

## Usage

Install from workspace context:

```bash
pnpm --filter @dfactory/core build
```

Core exports are consumed by server, CLI, template-kit, adapters, and renderers:

```ts
import { createRegistry } from "@dfactory/core";

const registry = await createRegistry({
  cwd: process.cwd(),
  configPath: "dfactory.config.ts",
});
```

## Development

```bash
pnpm --filter @dfactory/core typecheck
pnpm --filter @dfactory/core test
pnpm --filter @dfactory/core build
```

Maintain architecture guardrails:

- keep core independent from React/Vue runtime packages
- keep PDF post-processing in renderer/plugin packages

## Troubleshooting

- Discovery returns zero templates: verify `templates.globs` and cwd.
- Runtime resolver mismatch: check plugin IDs and module loader IDs in config.
- Boundary test failures: inspect `tests/unit/dependency-boundaries.test.ts`.

## Related Documentation

- [Architecture](/docs/architecture)
- [Rendering Pipeline](/docs/rendering-pipeline)
