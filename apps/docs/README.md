# @dfactory/docs

## Purpose

`@dfactory/docs` is the official documentation app for dFactory.

It provides end-consumer and contributor documentation, including API reference generated from a checked-in OpenAPI snapshot.

## Usage

Run locally:

```bash
pnpm --filter @dfactory/docs dev
```

Default URL: `http://127.0.0.1:3333/docs`

Build/start:

```bash
pnpm --filter @dfactory/docs build
pnpm --filter @dfactory/docs start
```

## Development

Core docs maintenance commands:

```bash
pnpm docs:sync-openapi
pnpm docs:typecheck
pnpm docs:build
pnpm docs:check-links
pnpm docs:validate-frontmatter
pnpm docs:check-readmes
```

Important content paths:

- MDX docs content: `apps/docs/content/docs/*.mdx`
- OpenAPI snapshot: `apps/docs/content/openapi/dfactory.openapi.json`
- Fumadocs source wiring: `apps/docs/source.config.ts` and `apps/docs/lib/source.ts`

## Troubleshooting

- Build fails on docs MDX: verify frontmatter has valid YAML and required fields.
- API reference appears empty: run `pnpm docs:sync-openapi` and confirm snapshot is non-empty.
- Style/theme issues: ensure Tailwind v4 + PostCSS setup is intact in `postcss.config.mjs` and `app/global.css`.

## Related Documentation

- [Docs Home](/docs)
- [Contributing](/docs/contributing)
- [API Reference](/docs/api-reference)
- [Root README](../../README.md)
