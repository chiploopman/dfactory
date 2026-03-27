import { h } from "vue";
import { z } from "zod";

import InvoiceTemplate from "./InvoiceTemplate.vue";

export const meta = {
  id: "invoice",
  title: "Invoice",
  description: "Default starter invoice template",
  framework: "vue",
  version: "1.0.0",
  tags: ["billing", "starter"]
} as const;

export const schema = z.object({
  invoiceNumber: z.string(),
  customerName: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      price: z.number()
    })
  )
});

type Payload = z.infer<typeof schema>;

export function render(payload: Payload) {
  return h(InvoiceTemplate, { payload });
}
