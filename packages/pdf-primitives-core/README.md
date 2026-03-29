# @dfactory/pdf-primitives-core

Shared constants, markers, template tokens, and theme helpers used by framework-native DFactory PDF primitives.

## Highlights

- Marker class map for pagination and break control
- Page token helpers (`{{pageNumber}}`, `{{totalPages}}`, `{{pageXofY}}`, etc.)
- PDF theme defaults + CSS variable helpers
- Paged-media marker classification helpers

## Development

```bash
pnpm --filter @dfactory/pdf-primitives-core typecheck
pnpm --filter @dfactory/pdf-primitives-core build
```
