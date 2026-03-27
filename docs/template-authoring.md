# Template Authoring

## Required location

`src/templates/<template-name>/template.tsx`

## Required exports

1. `meta`
2. `schema` (zod)
3. `render(payload)`

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
