import * as React from "react";
import { z } from "zod";

export const meta = {
  id: "invoice",
  title: "Invoice",
  description: "Starter invoice template for DFactory",
  framework: "react",
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

export function render(payload: Payload): React.ReactElement {
  const total = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: 32, color: "#1a1a1a" }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 28 }}>Invoice {payload.invoiceNumber}</h1>
        <p style={{ marginTop: 8, color: "#444" }}>Customer: {payload.customerName}</p>
        <p style={{ marginTop: 0, color: "#666" }}>Issued at: {payload.issuedAt}</p>
      </header>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "2px solid #ddd", padding: 8 }}>Item</th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ddd", padding: 8 }}>Qty</th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ddd", padding: 8 }}>Price</th>
            <th style={{ textAlign: "right", borderBottom: "2px solid #ddd", padding: 8 }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {payload.items.map((item) => (
            <tr key={item.name}>
              <td style={{ borderBottom: "1px solid #eee", padding: 8 }}>{item.name}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>{item.qty}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>${item.price.toFixed(2)}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: 8 }}>
                ${(item.qty * item.price).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <footer style={{ marginTop: 20, textAlign: "right" }}>
        <p style={{ fontSize: 18, fontWeight: 700 }}>Total: ${total.toFixed(2)}</p>
      </footer>
    </main>
  );
}
