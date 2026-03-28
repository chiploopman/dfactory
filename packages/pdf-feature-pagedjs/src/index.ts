import type {
  PdfFeatureDiagnostic,
  PdfFeaturePlugin
} from "@dfactory/renderer-playwright";

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
        .${PAGED_MODE_CLASS} .df-page-break-before { break-before: page; page-break-before: always; }
        .${PAGED_MODE_CLASS} .df-avoid-break { break-inside: avoid-page; page-break-inside: avoid; }
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
        message: "Paged.js feature mode requested. CSS paged-media helpers are enabled."
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
