import { h } from "vue";
import { z } from "zod";

import { defineTemplate } from "@dfactory/template-kit";

import InvoiceTemplate from "./InvoiceTemplate.vue";

const template = defineTemplate({
  meta: {
    id: "invoice",
    title: "Invoice",
    description: "Default starter invoice template",
    framework: "vue",
    version: "1.0.0",
    tags: ["billing", "starter"]
  },
  schema: z.object({
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
        issuedAt: "2026-03-27",
        items: [
          { name: "Consulting", qty: 2, price: 420 },
          { name: "Support", qty: 1, price: 180 }
        ]
      }
    }
  ],
  render(payload, context) {
    return h(InvoiceTemplate, {
      payload,
      markerClasses: {
        keepWithNext: context?.helpers.markerClass("keepWithNext") ?? "",
        avoidBreak: context?.helpers.markerClass("avoidBreak") ?? "",
        pageBreakBefore: context?.helpers.markerClass("pageBreakBefore") ?? ""
      }
    });
  }
});

export const meta = template.meta;
export const schema = template.schema;
export const pdf = template.pdf;
export const examples = template.examples;
export const render = template.render;
