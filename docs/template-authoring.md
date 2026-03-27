# Template Authoring

## Required location

`src/templates/<template-name>/template.tsx` (React)

`src/templates/<template-name>/template.ts` (Vue)

## Required exports

1. `meta`
2. `schema` (zod)
3. `render(payload)`

## Runtime configuration

Use `plugins` and `moduleLoader` in `dfactory.config.ts`:

```ts
plugins: ["@dfactory/framework-react"]
moduleLoader: "@dfactory/module-loader-bundle"
```

For Vue SFC templates:

```ts
plugins: ["@dfactory/framework-vue"]
moduleLoader: "@dfactory/module-loader-vite"
```

## Example

```tsx
import { z } from "zod";

export const meta = {
  id: "invoice",
  title: "Invoice",
  framework: "react",
  version: "1.0.0"
} as const;

export const schema = z.object({
  customerName: z.string()
});

export function render(payload: z.infer<typeof schema>) {
  return <main>Hello {payload.customerName}</main>;
}
```

## Vue SFC example

```ts
import { h } from "vue";
import { z } from "zod";

import InvoiceTemplate from "./InvoiceTemplate.vue";

export const meta = {
  id: "invoice",
  title: "Invoice",
  framework: "vue",
  version: "1.0.0"
} as const;

export const schema = z.object({
  customerName: z.string()
});

export function render(payload: z.infer<typeof schema>) {
  return h(InvoiceTemplate, { payload });
}
```
