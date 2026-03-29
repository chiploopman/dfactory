# @dfactory/cli

## Purpose

`@dfactory/cli` provides the operational command surface for dFactory runtime workflows.

Supported commands: `dev`, `build`, `serve`, `index`, `doctor`.

## Usage

```bash
dfactory dev --config dfactory.config.ts
dfactory build
dfactory serve --config dfactory.config.ts
dfactory index --output .dfactory/templates.index.json
dfactory doctor
```

Within this monorepo:

```bash
pnpm dev
```

## Development

```bash
pnpm --filter @dfactory/cli typecheck
pnpm --filter @dfactory/cli test
pnpm --filter @dfactory/cli build
```

When changing CLI options, update docs and API/operator instructions in same PR.

## Troubleshooting

- UI port already in use: pass `--ui-port` on `dev`.
- serve mode missing UI: ensure `dfactory build` generated `.dfactory/ui`.
- doctor Playwright failures: install system/browser dependencies.

## Related Documentation

- [CLI docs page](/docs/cli)
- [Troubleshooting](/docs/troubleshooting)
