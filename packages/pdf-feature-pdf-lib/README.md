# @dfactory/pdf-feature-pdf-lib

## Purpose

Optional PDF post-processing plugin powered by `pdf-lib`.

Common uses:

- metadata enrichment
- post-render watermarking at PDF layer

## Usage

Add plugin reference in renderer config:

```ts
renderer: {
  pdfPlugins: ["@dfactory/pdf-feature-standard", "@dfactory/pdf-feature-pdf-lib"]
}
```

## Development

```bash
pnpm --filter @dfactory/pdf-feature-pdf-lib typecheck
pnpm --filter @dfactory/pdf-feature-pdf-lib test
pnpm --filter @dfactory/pdf-feature-pdf-lib build
```

## Troubleshooting

- No post-processing effect: verify feature flags/metadata exist in resolved config.
- Binary parse failures: inspect input PDF integrity and hook sequencing.

## Related Documentation

- [Rendering Pipeline](/docs/rendering-pipeline)
- [Troubleshooting](/docs/troubleshooting)
