# @dfactory/example-react-starter

## Purpose

React starter showcasing canonical dFactory template structure, including:

- `invoice` quick-start template
- `invoice-reference` advanced multi-component template

## Usage

```bash
pnpm --filter @dfactory/example-react-starter dfactory:dev
```

Starter config file: `examples/react-starter/dfactory.config.ts`

## Development

Use this starter to validate React adapter and template authoring changes.

Recommended checks from repository root:

```bash
pnpm test
pnpm test:e2e
```

## Troubleshooting

- Template load errors: verify file layout under `src/templates/**`.
- Render mismatch: compare payload examples against schema requirements.

## Related Documentation

- [Frameworks: React](/docs/frameworks/react)
- [Template Authoring](/docs/template-authoring)
