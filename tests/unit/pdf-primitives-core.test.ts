import { describe, expect, it } from "vitest";

import {
  PDF_PRIMITIVE_MARKER_CLASSES,
  PDF_TEMPLATE_TOKEN_VALUES,
  applyPdfTemplateTokens,
  getPdfPrimitiveMarkerClass,
  resolvePdfTheme,
  stringifyPdfThemeCssVariables,
  toPdfThemeCssVariables
} from "../../packages/pdf-primitives-core/src/index.ts";

describe("pdf primitives core", () => {
  it("maps marker names to stable compatibility classes", () => {
    expect(getPdfPrimitiveMarkerClass("pageBreakBefore")).toBe("df-page-break-before");
    expect(getPdfPrimitiveMarkerClass("keepTogether")).toBe("df-keep-together");
    expect(getPdfPrimitiveMarkerClass("startOnRecto")).toBe("df-start-on-recto");
    expect(PDF_PRIMITIVE_MARKER_CLASSES.avoidBreakInside).toBe("df-avoid-break-inside");
  });

  it("applies token replacements including pageXofY", () => {
    const template =
      "Page: {{pageNumber}} Total: {{totalPages}} Pair: {{pageXofY}} Title: {{title}}";

    const output = applyPdfTemplateTokens(template, {
      pageNumber: "1",
      totalPages: "8",
      title: "Invoice",
      pageXofY: "1/8"
    });

    expect(output).toContain("Page: 1");
    expect(output).toContain("Total: 8");
    expect(output).toContain("Pair: 1/8");
    expect(output).toContain("Title: Invoice");
    expect(output).not.toContain(PDF_TEMPLATE_TOKEN_VALUES.pageXofY);
  });

  it("resolves theme partials and emits css variable contract", () => {
    const theme = resolvePdfTheme({
      font: {
        family: "IBM Plex Sans"
      },
      color: {
        accent: "#2563eb"
      }
    });

    expect(theme.font.family).toBe("IBM Plex Sans");
    expect(theme.font.size).toBe("12px");
    expect(theme.color.accent).toBe("#2563eb");

    const vars = toPdfThemeCssVariables({
      space: {
        md: "14px"
      }
    });

    expect(vars["--df-pdf-space-md"]).toBe("14px");
    expect(vars["--df-pdf-color-text"]).toBeTruthy();

    const cssText = stringifyPdfThemeCssVariables({
      border: {
        width: "2px"
      }
    });

    expect(cssText).toContain("--df-pdf-border-width: 2px;");
    expect(cssText).toContain("--df-pdf-font-family");
  });
});
