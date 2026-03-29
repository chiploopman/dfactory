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

  it("prioritizes first-class pdf element renderers over legacy defaults", async () => {
    const context = {
      templateId: "invoice-reference",
      templateMeta: {
        id: "invoice-reference",
        title: "Invoice Reference",
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
          enabled: true,
          footerTemplate: "<div>legacy-footer</div>"
        },
        watermark: {
          text: "LEGACY"
        },
        pagination: {
          mode: "css"
        }
      },
      templatePdfElements: {
        toc: {
          async render(context: { headings?: Array<{ text: string }> }) {
            return `<nav data-custom-toc="true">${context.headings?.[0]?.text ?? "none"}</nav>`;
          }
        },
        header: {
          template: "<div>Header {{title}}</div>"
        },
        footer: {
          async render() {
            return "<div>Footer {{pageNumber}} / {{totalPages}}</div>";
          }
        },
        watermark: {
          template: "<div>WATERMARK-ELEMENT</div>"
        },
        pagination: {
          template: "<div>PAGINATION-ELEMENT</div>"
        },
        background: {
          template: "<div>BACKGROUND-ELEMENT</div>"
        },
        foreground: {
          template: "<div>FOREGROUND-ELEMENT</div>"
        },
        bookmarks: {
          template: "[{\"title\":\"Intro\"}]"
        },
        pageRules: {
          template: "@page { margin: 20mm; }"
        }
      },
      html: "<!doctype html><html><head></head><body><h1>Main</h1><h2>Sub</h2></body></html>",
      diagnostics: [],
      options: {}
    } as Parameters<NonNullable<typeof pdfFeaturePlugin.htmlPre>>[0];

    const output = await pdfFeaturePlugin.htmlPre?.(context);
    const html = typeof output === "string" ? output : context.html;

    expect(html).toContain("data-custom-toc");
    expect(html).toContain("WATERMARK-ELEMENT");
    expect(html).toContain("PAGINATION-ELEMENT");
    expect(html).toContain("BACKGROUND-ELEMENT");
    expect(html).toContain("FOREGROUND-ELEMENT");
    expect(html).toContain("data-dfactory-element=\"bookmarks\"");
    expect(html).toContain("data-dfactory-element=\"pageRules\"");
    expect(context.resolvedFeatures.headerFooter?.headerTemplate).toContain("Header {{title}}");
    expect(context.resolvedFeatures.headerFooter?.footerTemplate).toContain("Footer {{pageNumber}}");
    expect(context.resolvedFeatures.watermark?.text).toBeUndefined();
  });

  it("warns when paged-media-only markers are used without pagedjs mode", () => {
    const context = {
      resolvedFeatures: {
        pagination: {
          mode: "css"
        }
      },
      html: "<html><body><div class='df-start-on-right-page'>section</div></body></html>",
      diagnostics: [],
      options: {}
    } as Parameters<NonNullable<typeof pdfFeaturePlugin.preflight>>[0];

    const diagnostics = pdfFeaturePlugin.preflight?.(context) ?? [];
    expect(Array.isArray(diagnostics)).toBe(true);
    expect(diagnostics.some((entry) => entry.code === "pagination.paged-only-marker")).toBe(true);
  });

  it("does not warn for paged markers present only in injected stylesheet text", async () => {
    const context = {
      resolvedFeatures: {
        pagination: {
          mode: "css"
        }
      },
      html: "<!doctype html><html><head></head><body><main>content</main></body></html>",
      diagnostics: [],
      options: {}
    } as Parameters<NonNullable<typeof pdfFeaturePlugin.htmlPre>>[0];

    await pdfFeaturePlugin.htmlPre?.(context);
    const diagnostics = pdfFeaturePlugin.preflight?.(context) ?? [];

    expect(Array.isArray(diagnostics)).toBe(true);
    expect(diagnostics.some((entry) => entry.code === "pagination.paged-only-marker")).toBe(false);
  });
});
