import * as React from "react";
import { z } from "zod";

export const meta = {
  id: "invoice",
  title: "Invoice",
  description: "Default starter invoice template",
  framework: "react",
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

export function render(payload: Payload): React.ReactElement {
  const total = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: "24px" }}>
      <h1 style={{ marginBottom: "8px" }}>Invoice {payload.invoiceNumber}</h1>
      <p style={{ color: "#555", marginTop: 0 }}>Customer: {payload.customerName}</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Item</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Qty</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {payload.items.map((item) => (
            <tr key={item.name}>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.name}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "8px" }}>{item.qty}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "8px" }}>
                ${(item.price * item.qty).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ textAlign: "right", marginTop: "16px", fontWeight: 700 }}>Total: ${total.toFixed(2)}</p>
    </main>
  );
}
