# @dfactory/renderer-playwright

## Purpose

Playwright-based HTML-to-PDF renderer with plugin hook system.

It executes HTML/PDF feature hooks and exposes preflight/diagnostics utilities.

## Usage

```ts
import { createPlaywrightPdfRenderer } from "@dfactory/renderer-playwright";

const renderer = createPlaywrightPdfRenderer({
  poolSize: 2,
  timeoutMs: 30000,
});
```

## Development

```bash
pnpm --filter @dfactory/renderer-playwright typecheck
pnpm --filter @dfactory/renderer-playwright test
pnpm --filter @dfactory/renderer-playwright build
```

Add tests when introducing new hook behavior or PDF option merge logic.

## Troubleshooting

- Browser launch failures: ensure Playwright runtime dependencies are installed.
- Hook order confusion: verify plugin list order in renderer config.

## Related Documentation

- [Rendering Pipeline](/docs/rendering-pipeline)
- [Best Practices](/docs/best-practices)
