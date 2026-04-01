# @dfactory/example-vue-starter

## Purpose

Vue starter showcasing dFactory Vue SFC template workflows, including:

- `invoice` basic template
- `invoice-reference` advanced componentized template

## Usage

```bash
pnpm --filter @dfactory/example-vue-starter dev
```

Starter config file: `examples/vue-starter/dfactory.config.ts`

## Development

Use this starter when validating Vue adapter or module-loader-vite behavior.

Recommended checks from repository root:

```bash
pnpm test
pnpm test:e2e
```

## Troubleshooting

- SFC transform issues: verify `@dfactory/module-loader-vite` pairing in config.
- Missing runtime types: ensure `src/env.d.ts` and TS config are intact.

## Related Documentation

- [Frameworks: Vue](/docs/frameworks/vue)
- [Template Authoring](/docs/template-authoring)
