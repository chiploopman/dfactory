# @dfactory/pdf-feature-standard

## Purpose

Default PDF feature plugin for dFactory.

It provides common production features such as:

- TOC generation
- header/footer injection
- watermark and pagination layers
- page/font/asset handling helpers

## Usage

Enable in renderer config:

```ts
renderer: {
  pdfPlugins: ["@dfactory/pdf-feature-standard"]
}
```

## Development

```bash
pnpm --filter @dfactory/pdf-feature-standard typecheck
pnpm --filter @dfactory/pdf-feature-standard test
pnpm --filter @dfactory/pdf-feature-standard build
```

## Troubleshooting

- Missing TOC/header/footer: verify `pdf` and `pdfElements` template config.
- Asset handling issues: check feature limits and source availability.

## Related Documentation

- [Template Authoring](/docs/template-authoring)
- [Rendering Pipeline](/docs/rendering-pipeline)
