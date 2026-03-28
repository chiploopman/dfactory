import { z } from "zod";

import { defineTemplate } from "@dfactory/template-kit";

import { InvoiceReferenceDocument } from "./components/InvoiceReferenceDocument";
import { InvoiceReferenceFooter } from "./components/InvoiceReferenceFooter";
import { InvoiceReferenceHeader } from "./components/InvoiceReferenceHeader";
import { InvoiceReferencePagination } from "./components/InvoiceReferencePagination";
import { InvoiceReferenceToc } from "./components/InvoiceReferenceToc";
import { InvoiceReferenceWatermark } from "./components/InvoiceReferenceWatermark";

const lineItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  qty: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  discount: z.number().nonnegative().max(100).optional(),
  taxRate: z.number().nonnegative().max(100).optional()
});

const sectionSchema = z.object({
  title: z.string(),
  description: z.string(),
  notes: z.string().optional()
});

const invoiceReferenceSchema = z.object({
  invoiceNumber: z.string(),
  purchaseOrder: z.string().optional(),
  issuedAt: z.string(),
  dueAt: z.string(),
  currency: z.string(),
  company: z.object({
    name: z.string(),
    address: z.string(),
    email: z.string(),
    phone: z.string(),
    website: z.string(),
    taxId: z.string(),
    logoUrl: z.string().url().optional()
  }),
  customer: z.object({
    name: z.string(),
    contact: z.string(),
    email: z.string(),
    address: z.string()
  }),
  items: z.array(lineItemSchema).min(1),
  sections: z.array(sectionSchema).min(1),
  payment: z.object({
    iban: z.string(),
    swift: z.string(),
    bankName: z.string(),
    instructions: z.string().optional()
  }),
  notes: z.string().optional(),
  watermark: z
    .object({
      enabled: z.boolean(),
      text: z.string()
    })
    .optional(),
  brand: z
    .object({
      accentColor: z.string().optional(),
      supportEmail: z.string().optional()
    })
    .optional()
});

type InvoiceReferencePayload = z.infer<typeof invoiceReferenceSchema>;

function createItems(count: number): InvoiceReferencePayload["items"] {
  return Array.from({ length: count }, (_, index) => {
    const row = index + 1;
    return {
      id: `line-${row}`,
      name: `Professional Service Block ${row}`,
      description:
        row % 2 === 0
          ? "Includes discovery, implementation, and QA handoff."
          : "Includes architecture review and stakeholder alignment.",
      qty: (row % 3) + 1,
      unitPrice: 180 + row * 12,
      discount: row % 5 === 0 ? 8 : 0,
      taxRate: 21
    };
  });
}

function createSections(count: number): InvoiceReferencePayload["sections"] {
  return Array.from({ length: count }, (_, index) => {
    const row = index + 1;
    return {
      title: `Delivery Milestone ${row}`,
      description:
        "This section demonstrates long-form print content with structured headings, making TOC and page breaks easy to validate during authoring.",
      notes:
        row % 2 === 0
          ? "Attach acceptance notes and sign-off evidence for enterprise audits."
          : "Use pagination markers for sections that should stay together."
    };
  });
}

function createPayload(options: {
  invoiceNumber: string;
  lineCount: number;
  watermarkText: string;
  accentColor: string;
}): InvoiceReferencePayload {
  return {
    invoiceNumber: options.invoiceNumber,
    purchaseOrder: "PO-40218",
    issuedAt: "2026-03-27",
    dueAt: "2026-04-10",
    currency: "EUR",
    company: {
      name: "DFactory Labs Ltd.",
      address: "A. Briana Street 9A\nRiga, LV-1001\nLatvia",
      email: "finance@dfactory.dev",
      phone: "+371 6700 4500",
      website: "https://dfactory.dev",
      taxId: "LV40203577891"
    },
    customer: {
      name: "Northwind Trading Group",
      contact: "Marta Jensen",
      email: "marta.jensen@northwind.example",
      address: "28 Innovation Plaza\nTallinn, 10111\nEstonia"
    },
    items: createItems(options.lineCount),
    sections: createSections(Math.max(4, Math.ceil(options.lineCount / 4))),
    payment: {
      iban: "LV80HABA0551045933178",
      swift: "HABALV22",
      bankName: "Swedbank AS",
      instructions: "Please reference invoice number in payment details."
    },
    notes:
      "All deliverables were accepted during sprint review. This reference template showcases advanced TOC, pagination markers, watermark layers, and custom header/footer element rendering.",
    watermark: {
      enabled: true,
      text: options.watermarkText
    },
    brand: {
      accentColor: options.accentColor,
      supportEmail: "support@dfactory.dev"
    }
  };
}

const template = defineTemplate({
  meta: {
    id: "invoice-reference",
    title: "Invoice Reference (Advanced)",
    description:
      "Rich multi-file reference template with first-class TOC/header/footer/watermark/pagination elements.",
    framework: "react",
    version: "1.0.0",
    tags: ["billing", "reference", "advanced"]
  },
  schema: invoiceReferenceSchema,
  pdf: {
    page: {
      size: "A4",
      marginsMm: { top: 16, right: 12, bottom: 16, left: 12 }
    },
    toc: {
      enabled: true,
      maxDepth: 3,
      title: "Invoice Reference Contents"
    },
    pagination: {
      mode: "css"
    },
    headerFooter: {
      enabled: true
    },
    assets: {
      maxAssetCount: 24,
      maxAssetBytes: 1024 * 1024,
      timeoutMs: 4000
    },
    metadata: {
      title: "DFactory Invoice Reference Document",
      author: "DFactory",
      keywords: ["invoice", "reference", "pdf", "dfactory"]
    },
    watermark: {
      text: "DRAFT",
      opacity: 0.12,
      fontSize: 44
    }
  },
  pdfElements: {
    toc: {
      render(context) {
        return (
          <InvoiceReferenceToc
            title={`${context.template.title} TOC`}
            headings={context.headings}
          />
        );
      }
    },
    header: {
      render(context) {
        return (
          <InvoiceReferenceHeader
            title={context.template.title}
            invoiceNumber={
              (context.payload as InvoiceReferencePayload).invoiceNumber
            }
            generatedAtToken={context.tokens.date}
          />
        );
      }
    },
    footer: {
      render(context) {
        return (
          <InvoiceReferenceFooter
            templateId={context.templateId}
            pageNumberToken={context.tokens.pageNumber}
            totalPagesToken={context.tokens.totalPages}
            supportEmail={
              (context.payload as InvoiceReferencePayload).brand?.supportEmail
            }
          />
        );
      }
    },
    watermark: {
      render(context) {
        const watermark = (context.payload as InvoiceReferencePayload).watermark;
        if (!watermark?.enabled) {
          return "";
        }
        return <InvoiceReferenceWatermark text={watermark.text} />;
      }
    },
    pagination: {
      render(context) {
        return (
          <InvoiceReferencePagination
            pageNumberToken={context.tokens.pageNumber}
            totalPagesToken={context.tokens.totalPages}
            markerClassPreview={context.pagination.markerClass("avoidBreak")}
          />
        );
      }
    }
  },
  examples: [
    {
      name: "short",
      description: "Single-page styled invoice with minimal line items.",
      payload: createPayload({
        invoiceNumber: "INV-REF-1001",
        lineCount: 4,
        watermarkText: "INTERNAL",
        accentColor: "#4f46e5"
      })
    },
    {
      name: "multi-page",
      description: "Long-form invoice designed to exercise TOC and pagination.",
      payload: createPayload({
        invoiceNumber: "INV-REF-1002",
        lineCount: 24,
        watermarkText: "REVIEW",
        accentColor: "#3730a3"
      })
    },
    {
      name: "branded",
      description: "Branded variation with strong accent and support metadata.",
      payload: createPayload({
        invoiceNumber: "INV-REF-1003",
        lineCount: 12,
        watermarkText: "BRANDED",
        accentColor: "#1d4ed8"
      })
    },
    {
      name: "watermark-heavy",
      description: "Watermark-forward profile to validate overlay readability.",
      payload: createPayload({
        invoiceNumber: "INV-REF-1004",
        lineCount: 18,
        watermarkText: "CONFIDENTIAL",
        accentColor: "#4338ca"
      })
    }
  ],
  render(payload, context) {
    return (
      <InvoiceReferenceDocument
        payload={payload}
        markerClasses={{
          keepWithNext: context?.helpers.markerClass("keepWithNext") ?? "",
          avoidBreak: context?.helpers.markerClass("avoidBreak") ?? "",
          pageBreakBefore:
            context?.helpers.markerClass("pageBreakBefore") ?? ""
        }}
      />
    );
  }
});

export const meta = template.meta;
export const schema = template.schema;
export const pdf = template.pdf;
export const pdfElements = template.pdfElements;
export const examples = template.examples;
export const render = template.render;
