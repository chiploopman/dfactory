import * as React from "react";
import { z } from "zod";

import { defineTemplate } from "@dfactory/template-kit";

const template = defineTemplate({
  meta: {
    id: "invoice",
    title: "Invoice",
    description: "Default starter invoice template",
    framework: "react",
    version: "1.0.0",
    tags: ["billing", "starter"]
  },
  schema: z.object({
    invoiceNumber: z.string(),
    customerName: z.string(),
    items: z.array(
      z.object({
        name: z.string(),
        qty: z.number(),
        price: z.number()
      })
    )
  }),
  pdf: {
    page: {
      size: "A4",
      marginsMm: { top: 12, right: 12, bottom: 14, left: 12 }
    },
    toc: {
      enabled: true,
      maxDepth: 2,
      title: "Invoice Overview"
    },
    pagination: {
      mode: "css"
    },
    headerFooter: {
      enabled: true,
      footerTemplate:
        "<div style=\"width:100%;font-size:9px;padding:0 12px;color:#64748b;display:flex;justify-content:space-between;\"><span>{{title}}</span><span>{{pageNumber}} / {{totalPages}}</span></div>"
    },
    metadata: {
      title: "Invoice Document",
      keywords: ["invoice", "billing", "starter"]
    }
  },
  examples: [
    {
      name: "default",
      payload: {
        invoiceNumber: "INV-1001",
        customerName: "Northwind Trading",
        items: [
          { name: "Consulting", qty: 2, price: 420 },
          { name: "Support", qty: 1, price: 180 }
        ]
      }
    }
  ],
  render(payload, context) {
    const total = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const keepWithNext = context?.helpers.markerClass("keepWithNext") ?? "";
    const avoidBreak = context?.helpers.markerClass("avoidBreak") ?? "";
    const pageBreakBefore = context?.helpers.markerClass("pageBreakBefore") ?? "";

    return (
      <main style={{ fontFamily: "Inter, sans-serif", padding: "24px", color: "#0f172a" }}>
        <section className={keepWithNext}>
          <h1 style={{ marginBottom: "8px" }}>Invoice {payload.invoiceNumber}</h1>
          <p style={{ color: "#475569", marginTop: 0 }}>Customer: {payload.customerName}</p>
        </section>

        <section className={avoidBreak}>
          <h2 style={{ marginTop: "20px", marginBottom: "8px", fontSize: "16px" }}>Line Items</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", borderBottom: "1px solid #e2e8f0", padding: "8px" }}>Item</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #e2e8f0", padding: "8px" }}>Qty</th>
                <th style={{ textAlign: "right", borderBottom: "1px solid #e2e8f0", padding: "8px" }}>Price</th>
              </tr>
            </thead>
            <tbody>
              {payload.items.map((item) => (
                <tr key={item.name}>
                  <td style={{ borderBottom: "1px solid #f1f5f9", padding: "8px" }}>{item.name}</td>
                  <td style={{ textAlign: "right", borderBottom: "1px solid #f1f5f9", padding: "8px" }}>{item.qty}</td>
                  <td style={{ textAlign: "right", borderBottom: "1px solid #f1f5f9", padding: "8px" }}>
                    ${(item.price * item.qty).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ textAlign: "right", marginTop: "16px", fontWeight: 700 }}>Total: ${total.toFixed(2)}</p>
        </section>

        <section className={pageBreakBefore}>
          <h2 style={{ marginTop: "24px", fontSize: "16px" }}>Payment Terms</h2>
          <p style={{ color: "#334155", lineHeight: 1.6 }}>
            Payment due within 14 calendar days from invoice date. Late payments may incur additional charges.
          </p>
        </section>
      </main>
    );
  }
});

export const meta = template.meta;
export const schema = template.schema;
export const pdf = template.pdf;
export const examples = template.examples;
export const render = template.render;
