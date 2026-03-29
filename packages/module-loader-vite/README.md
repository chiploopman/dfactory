# @dfactory/module-loader-vite

## Purpose

Vite-powered module loader for frameworks requiring transform pipelines (notably Vue SFC workflows).

## Usage

Use with Vue plugin in config:

```ts
moduleLoader: "@dfactory/module-loader-vite"
```

## Development

```bash
pnpm --filter @dfactory/module-loader-vite typecheck
pnpm --filter @dfactory/module-loader-vite test
pnpm --filter @dfactory/module-loader-vite build
```

## Troubleshooting

- Unexpected SSR module output: inspect collected transform config from plugin.
- Caching artifacts: invalidate Vite module graph by restarting runtime.

## Related Documentation

- [Frameworks: Vue](/docs/frameworks/vue)
- [Architecture](/docs/architecture)
