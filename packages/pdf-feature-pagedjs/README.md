# @dfactory/pdf-feature-pagedjs

## Purpose

Optional feature plugin for paged-media oriented pagination mode (`pagination.mode = "pagedjs"`).

It injects CSS helpers and diagnostics for paged rendering flows.

## Usage

```ts
renderer: {
  pdfPlugins: ["@dfactory/pdf-feature-standard", "@dfactory/pdf-feature-pagedjs"]
}
```

Then enable in template feature config:

```ts
pdf: {
  pagination: { mode: "pagedjs" }
}
```

## Development

```bash
pnpm --filter @dfactory/pdf-feature-pagedjs typecheck
pnpm --filter @dfactory/pdf-feature-pagedjs test
pnpm --filter @dfactory/pdf-feature-pagedjs build
```

## Troubleshooting

- No paged behavior: ensure pagination mode is set to `pagedjs`.
- Style conflicts: inspect injected class and CSS precedence in rendered HTML.

## Related Documentation

- [Template Authoring](/docs/template-authoring)
- [Best Practices](/docs/best-practices)
