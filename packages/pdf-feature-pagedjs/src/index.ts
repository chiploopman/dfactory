import type {
  PdfFeatureDiagnostic,
  PdfFeaturePlugin
} from "@dfactory/renderer-playwright";
import { PDF_PRIMITIVE_MARKER_CLASSES } from "@dfactory/pdf-primitives-core";

const PAGED_MODE_CLASS = "df-pagedjs-mode";

export const pdfFeaturePlugin: PdfFeaturePlugin = {
  id: "@dfactory/pdf-feature-pagedjs",
  htmlPre(context) {
    if (context.resolvedFeatures.pagination?.mode !== "pagedjs") {
      return;
    }

    if (context.html.includes(PAGED_MODE_CLASS)) {
      return;
    }

    context.html = context.html.replace(
      "<body",
      `<body class="${PAGED_MODE_CLASS}"`
    );

    context.html = context.html.replace(
      "</head>",
      `<style data-dfactory-pagedjs="true">
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.pageBreakBefore} { break-before: page; page-break-before: always; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.pageBreakAfter} { break-after: page; page-break-after: always; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.avoidBreak},
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.avoidBreakInside} { break-inside: avoid-page; page-break-inside: avoid; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.keepWithNext} { break-after: avoid-page; page-break-after: avoid; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.keepTogether} { break-inside: avoid-page; page-break-inside: avoid; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.startOnLeftPage} { break-before: left; page-break-before: left; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.startOnRightPage} { break-before: right; page-break-before: right; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.startOnRecto} { break-before: recto; page-break-before: always; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.startOnVerso} { break-before: verso; page-break-before: always; }
        .${PAGED_MODE_CLASS} .${PDF_PRIMITIVE_MARKER_CLASSES.pageGroup} { break-before: page; page-break-before: always; }

        .${PAGED_MODE_CLASS} .df-running-top-left { position: running(df-running-top-left); }
        .${PAGED_MODE_CLASS} .df-running-top-center { position: running(df-running-top-center); }
        .${PAGED_MODE_CLASS} .df-running-top-right { position: running(df-running-top-right); }
        .${PAGED_MODE_CLASS} .df-running-bottom-left { position: running(df-running-bottom-left); }
        .${PAGED_MODE_CLASS} .df-running-bottom-center { position: running(df-running-bottom-center); }
        .${PAGED_MODE_CLASS} .df-running-bottom-right { position: running(df-running-bottom-right); }

        @page {
          @top-left { content: element(df-running-top-left); }
          @top-center { content: element(df-running-top-center); }
          @top-right { content: element(df-running-top-right); }
          @bottom-left { content: element(df-running-bottom-left); }
          @bottom-center { content: element(df-running-bottom-center); }
          @bottom-right { content: element(df-running-bottom-right); }
        }
      </style></head>`
    );

    return context.html;
  },
  diagnostics(context) {
    if (context.resolvedFeatures.pagination?.mode !== "pagedjs") {
      return;
    }

    const diagnostics: PdfFeatureDiagnostic[] = [
      {
        pluginId: "@dfactory/pdf-feature-pagedjs",
        level: "info",
        code: "pagination.pagedjs.enabled",
        message:
          "Paged.js feature mode requested. Advanced paged-media helpers (left/right/recto/verso + running elements) are enabled."
      }
    ];

    return diagnostics;
  },
  doctorChecks() {
    return [
      {
        name: "Paged.js feature plugin",
        ok: true,
        message: "Installed and available for opt-in pagination.mode='pagedjs'"
      }
    ];
  }
};

export default pdfFeaturePlugin;
