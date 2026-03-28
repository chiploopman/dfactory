import { describe, expect, it } from "vitest";

import pdfFeaturePlugin from "@dfactory/pdf-feature-standard";

describe("pdf-feature-standard", () => {
  it("injects toc + marker styles and default footer tokens", async () => {
    const context = {
      templateId: "invoice",
      templateMeta: {
        id: "invoice",
        title: "Invoice",
        framework: "react",
        version: "1.0.0"
      },
      resolvedFeatures: {
        toc: {
          enabled: true,
          maxDepth: 2,
          title: "Contents"
        },
        headerFooter: {
          enabled: true
        },
        pagination: {
          mode: "css"
        }
      },
      html: "<!doctype html><html><head></head><body><h1>Main</h1><h2>Sub</h2></body></html>",
      diagnostics: [],
      options: {}
    } as Parameters<NonNullable<typeof pdfFeaturePlugin.htmlPre>>[0];

    const output = await pdfFeaturePlugin.htmlPre?.(context);
    const html = typeof output === "string" ? output : context.html;

    expect(html).toContain("df-page-break-before");
    expect(html).toContain("df-toc");
    expect(html).toContain("href=\"#df-heading-1\"");
    expect(context.resolvedFeatures.headerFooter?.footerTemplate).toContain("{{pageNumber}}");
    expect(context.resolvedFeatures.metadata?.title).toBe("Invoice");
  });

  it("returns warning when pagedjs mode is requested without pagedjs plugin", () => {
    const context = {
      resolvedFeatures: {
        pagination: {
          mode: "pagedjs"
        }
      },
      html: "<html></html>",
      diagnostics: [],
      options: {}
    } as Parameters<NonNullable<typeof pdfFeaturePlugin.preflight>>[0];

    const diagnostics = pdfFeaturePlugin.preflight?.(context) ?? [];
    expect(Array.isArray(diagnostics)).toBe(true);
    expect(diagnostics[0]?.level).toBe("warn");
    expect(diagnostics[0]?.message).toContain("@dfactory/pdf-feature-pagedjs");
  });
});
