import { h } from "vue";
import { z } from "zod";

import InvoiceTemplate from "./InvoiceTemplate.vue";

export const meta = {
  id: "invoice",
  title: "Invoice",
  description: "Starter invoice template for DFactory",
  framework: "vue",
  version: "1.0.0",
  tags: ["billing", "finance"]
} as const;

export const schema = z.object({
  invoiceNumber: z.string(),
  customerName: z.string(),
  issuedAt: z.string(),
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
