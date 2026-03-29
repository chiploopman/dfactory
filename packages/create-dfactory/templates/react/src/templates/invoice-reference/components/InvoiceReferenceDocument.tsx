import {
  AvoidBreakInside,
  Divider,
  Document,
  KeepWithNext,
  Page,
  PageBreakBefore
} from "@dfactory/pdf-primitives-react";

import type { InvoiceReferencePayload } from "./types";

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(value);
}

function calculateLineTotal(options: {
  qty: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
}): number {
  const gross = options.qty * options.unitPrice;
  const discount = options.discount ?? 0;
  const discounted = gross - gross * (discount / 100);
  const taxRate = options.taxRate ?? 0;
  return discounted + discounted * (taxRate / 100);
}

export function InvoiceReferenceDocument(props: {
  payload: InvoiceReferencePayload;
}) {
  const accent = props.payload.brand?.accentColor ?? "#4f46e5";
  const subtotal = props.payload.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0
  );
  const total = props.payload.items.reduce(
    (sum, item) =>
      sum +
      calculateLineTotal({
        qty: item.qty,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxRate: item.taxRate
      }),
    0
  );

  return (
    <Document>
      <Page>
        <KeepWithNext
          as="header"
          style={{
            borderBottom: "2px solid #e2e8f0",
            paddingBottom: "16px",
            marginBottom: "18px"
          }}
        >
          <h1 style={{ margin: 0, color: accent }}>Invoice {props.payload.invoiceNumber}</h1>
          <p style={{ margin: "6px 0 0", color: "#475569" }}>
            Issued {props.payload.issuedAt} • Due {props.payload.dueAt}
          </p>
          {props.payload.purchaseOrder ? (
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              Purchase Order: {props.payload.purchaseOrder}
            </p>
          ) : null}
        </KeepWithNext>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "18px",
            marginBottom: "16px"
          }}
        >
          <AvoidBreakInside as="article">
            <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>Bill From</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>{props.payload.company.name}</p>
            <p style={{ margin: "4px 0 0", color: "#475569", whiteSpace: "pre-line" }}>
              {props.payload.company.address}
            </p>
            <p style={{ margin: "8px 0 0", color: "#334155" }}>
              {props.payload.company.email} • {props.payload.company.phone}
            </p>
            <p style={{ margin: "4px 0 0", color: "#64748b" }}>
              {props.payload.company.website} • Tax ID {props.payload.company.taxId}
            </p>
          </AvoidBreakInside>

          <AvoidBreakInside as="article">
            <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>Bill To</h2>
            <p style={{ margin: 0, fontWeight: 600 }}>{props.payload.customer.name}</p>
            <p style={{ margin: "4px 0 0", color: "#475569" }}>
              Contact: {props.payload.customer.contact}
            </p>
            <p style={{ margin: "4px 0 0", color: "#334155" }}>{props.payload.customer.email}</p>
            <p style={{ margin: "4px 0 0", color: "#64748b", whiteSpace: "pre-line" }}>
              {props.payload.customer.address}
            </p>
          </AvoidBreakInside>
        </section>

        <AvoidBreakInside as="section">
          <h2 style={{ fontSize: "16px", margin: "20px 0 8px" }}>Services & Deliverables</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              overflow: "hidden"
            }}
          >
            <thead style={{ backgroundColor: "#eef2ff" }}>
              <tr>
                <th style={{ textAlign: "left", padding: "10px 12px" }}>Description</th>
                <th style={{ textAlign: "right", padding: "10px 12px" }}>Qty</th>
                <th style={{ textAlign: "right", padding: "10px 12px" }}>Unit</th>
                <th style={{ textAlign: "right", padding: "10px 12px" }}>Discount</th>
                <th style={{ textAlign: "right", padding: "10px 12px" }}>Tax</th>
                <th style={{ textAlign: "right", padding: "10px 12px" }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {props.payload.items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: "10px 12px", borderTop: "1px solid #e2e8f0" }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>{item.name}</p>
                    {item.description ? (
                      <p style={{ margin: "4px 0 0", color: "#64748b" }}>{item.description}</p>
                    ) : null}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      borderTop: "1px solid #e2e8f0"
                    }}
                  >
                    {item.qty}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      borderTop: "1px solid #e2e8f0"
                    }}
                  >
                    {formatMoney(item.unitPrice, props.payload.currency)}
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      borderTop: "1px solid #e2e8f0"
                    }}
                  >
                    {(item.discount ?? 0).toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      borderTop: "1px solid #e2e8f0"
                    }}
                  >
                    {(item.taxRate ?? 0).toFixed(1)}%
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "10px 12px",
                      borderTop: "1px solid #e2e8f0",
                      fontWeight: 600
                    }}
                  >
                    {formatMoney(
                      calculateLineTotal({
                        qty: item.qty,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        taxRate: item.taxRate
                      }),
                      props.payload.currency
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </AvoidBreakInside>

        <section
          style={{
            marginTop: "16px",
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: "24px"
          }}
        >
          <article>
            <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>Summary Notes</h2>
            <p style={{ color: "#475569", marginTop: 0 }}>
              The sections below intentionally include long-form text to provide a strong
              multi-page reference for TOC, pagination, and marker helpers.
            </p>
            {props.payload.sections.map((section, index) => {
              const sectionStyle = {
                marginTop: "14px",
                padding: "12px",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                background: "#f8fafc"
              } as const;

              if (index === 2) {
                return (
                  <PageBreakBefore key={`${section.title}-${index}`} as="section" style={sectionStyle}>
                    <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#1e293b" }}>
                      {section.title}
                    </h3>
                    <p style={{ margin: 0, color: "#334155" }}>{section.description}</p>
                    {section.notes ? (
                      <p style={{ margin: "8px 0 0", color: "#64748b" }}>{section.notes}</p>
                    ) : null}
                  </PageBreakBefore>
                );
              }

              return (
                <section key={`${section.title}-${index}`} style={sectionStyle}>
                  <h3 style={{ marginTop: 0, marginBottom: "8px", color: "#1e293b" }}>
                    {section.title}
                  </h3>
                  <p style={{ margin: 0, color: "#334155" }}>{section.description}</p>
                  {section.notes ? (
                    <p style={{ margin: "8px 0 0", color: "#64748b" }}>{section.notes}</p>
                  ) : null}
                </section>
              );
            })}
          </article>

          <KeepWithNext
            as="aside"
            style={{
              border: "1px solid #dbeafe",
              background: "#eff6ff",
              borderRadius: "10px",
              padding: "14px"
            }}
          >
            <h2 style={{ margin: 0, fontSize: "15px" }}>Totals</h2>
            <p style={{ margin: "10px 0 0", color: "#475569" }}>
              Subtotal: <strong>{formatMoney(subtotal, props.payload.currency)}</strong>
            </p>
            <p style={{ margin: "6px 0 0", color: "#475569" }}>
              Grand Total: <strong>{formatMoney(total, props.payload.currency)}</strong>
            </p>
            <Divider
              style={{
                borderTopColor: "rgba(71, 85, 105, 0.2)",
                marginTop: "10px",
                marginBottom: "8px"
              }}
            />
            <p style={{ margin: "10px 0 0", color: "#1e293b", fontWeight: 600 }}>
              Payment via {props.payload.payment.bankName}
            </p>
            <p style={{ margin: "4px 0 0", color: "#475569" }}>
              IBAN: {props.payload.payment.iban}
            </p>
            <p style={{ margin: "4px 0 0", color: "#475569" }}>
              SWIFT: {props.payload.payment.swift}
            </p>
            {props.payload.payment.instructions ? (
              <p style={{ margin: "8px 0 0", color: "#64748b" }}>
                {props.payload.payment.instructions}
              </p>
            ) : null}
          </KeepWithNext>
        </section>

        {props.payload.notes ? (
          <PageBreakBefore
            as="section"
            style={{
              marginTop: "20px",
              padding: "16px",
              border: "1px dashed #cbd5e1",
              borderRadius: "10px"
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "16px" }}>Additional Terms</h2>
            <p style={{ marginBottom: 0, color: "#334155", whiteSpace: "pre-line" }}>
              {props.payload.notes}
            </p>
          </PageBreakBefore>
        ) : null}
      </Page>
    </Document>
  );
}
