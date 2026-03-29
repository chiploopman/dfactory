import { z } from "zod";

import {
  AvoidBreakInside,
  Document,
  Heading,
  KeepWithNext,
  NumericCell,
  Page,
  PageBreakBefore,
  Paragraph,
  Section,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow
} from "@dfactory/pdf-primitives-react";
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
        "<div style=\"width:100%;font-size:9px;padding:0 12px;color:#64748b;display:flex;justify-content:space-between;\"><span>{{title}}</span><span>{{pageXofY}}</span></div>"
    },
    metadata: {
      title: "Invoice Document",
      keywords: ["invoice", "billing", "starter"]
    },
    theme: {
      font: {
        family: "Inter, 'Segoe UI', sans-serif"
      },
      color: {
        accent: "#1d4ed8"
      }
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
  render(payload) {
    const total = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);

    return (
      <Document>
        <Page>
          <Section style={{ padding: "24px" }}>
            <KeepWithNext>
              <Heading as="h1" style={{ marginBottom: "8px", color: "var(--df-pdf-color-accent)" }}>
                Invoice {payload.invoiceNumber}
              </Heading>
              <Paragraph style={{ color: "var(--df-pdf-color-muted)", marginTop: 0 }}>
                Customer: {payload.customerName}
              </Paragraph>
              <Paragraph style={{ color: "var(--df-pdf-color-muted)", marginTop: "4px" }}>
                Issued: {payload.issuedAt}
              </Paragraph>
            </KeepWithNext>

            <AvoidBreakInside>
              <Heading as="h2" style={{ marginTop: "20px", marginBottom: "8px", fontSize: "16px" }}>
                Line Items
              </Heading>
              <Table style={{ marginTop: "10px" }}>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell style={{ textAlign: "left" }}>Item</TableHeaderCell>
                    <TableHeaderCell style={{ textAlign: "right" }}>Qty</TableHeaderCell>
                    <TableHeaderCell style={{ textAlign: "right" }}>Price</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payload.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <NumericCell>{item.qty}</NumericCell>
                      <NumericCell>${(item.price * item.qty).toFixed(2)}</NumericCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Paragraph style={{ textAlign: "right", marginTop: "16px", fontWeight: 700 }}>
                Total: ${total.toFixed(2)}
              </Paragraph>
            </AvoidBreakInside>

            <PageBreakBefore>
              <Heading as="h2" style={{ marginTop: "24px", fontSize: "16px" }}>
                Payment Terms
              </Heading>
              <Paragraph style={{ color: "var(--df-pdf-color-text)", lineHeight: 1.6 }}>
                Payment due within 14 calendar days from invoice date. Late payments may incur
                additional charges.
              </Paragraph>
            </PageBreakBefore>
          </Section>
        </Page>
      </Document>
    );
  }
});

export const meta = template.meta;
export const schema = template.schema;
export const pdf = template.pdf;
export const examples = template.examples;
export const render = template.render;
