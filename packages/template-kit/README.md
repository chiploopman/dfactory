# @dfactory/template-kit

## Purpose

`@dfactory/template-kit` is the canonical authoring helper package for templates.

It provides:

- `defineTemplate()` API
- typed payload inference from zod schema
- strongly typed template metadata/examples/pdf options

## Usage

```ts
import { z } from "zod";
import { defineTemplate } from "@dfactory/template-kit";

const template = defineTemplate({
  meta: { id: "invoice", title: "Invoice", framework: "react", version: "1.0.0" },
  schema: z.object({ customerName: z.string() }),
  render(payload) {
    return `<main>${payload.customerName}</main>`;
  },
});
```

## Development

```bash
pnpm --filter @dfactory/template-kit typecheck
pnpm --filter @dfactory/template-kit test
pnpm --filter @dfactory/template-kit build
```

Add template-kit behavior tests when changing the authoring contract.

## Troubleshooting

- Type inference mismatch: ensure zod schema and payload type are aligned.
- Runtime render mismatch: verify adapter-specific render output expectations.

## Related Documentation

- [Template Authoring](/docs/template-authoring)
- [Frameworks: React](/docs/frameworks/react)
