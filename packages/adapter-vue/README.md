# @dfactory/framework-vue

## Purpose

Vue framework plugin for dFactory runtime.

It provides SSR rendering and module transform configuration required for Vue SFC template workflows.

## Usage

Config pairing:

```ts
plugins: ["@dfactory/framework-vue"],
moduleLoader: "@dfactory/module-loader-vite",
```

## Development

```bash
pnpm --filter @dfactory/framework-vue typecheck
pnpm --filter @dfactory/framework-vue test
pnpm --filter @dfactory/framework-vue build
```

Maintain clear boundary between Vue rendering concerns and shared runtime orchestration.

## Troubleshooting

- SFC load errors: verify vite loader plugin and alias wiring.
- SSR output mismatch: validate component output and payload typing.

## Related Documentation

- [Frameworks: Vue](/docs/frameworks/vue)
- [Troubleshooting](/docs/troubleshooting)
