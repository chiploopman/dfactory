import { degrees, rgb, StandardFonts, PDFDocument } from "pdf-lib";
import type {
  PdfFeatureDiagnostic,
  PdfFeaturePlugin
} from "@dfactory/renderer-playwright";

export const pdfFeaturePlugin: PdfFeaturePlugin = {
  id: "@dfactory/pdf-feature-pdf-lib",
  async pdfPost(context) {
    const metadata = context.resolvedFeatures.metadata;
    const watermark = context.resolvedFeatures.watermark;

    if (!metadata && !watermark?.text) {
      return;
    }

    const document = await PDFDocument.load(context.pdf);

    if (metadata?.title) {
      document.setTitle(metadata.title);
    }
    if (metadata?.author) {
      document.setAuthor(metadata.author);
    }
    if (metadata?.subject) {
      document.setSubject(metadata.subject);
    }
    if (metadata?.keywords && metadata.keywords.length > 0) {
      document.setKeywords(metadata.keywords);
    }

    if (watermark?.text) {
      const font = await document.embedFont(StandardFonts.HelveticaBold);
      const pages = document.getPages();
      for (const page of pages) {
        const size = page.getSize();
        page.drawText(watermark.text, {
          x: size.width / 5,
          y: size.height / 2,
          size: watermark.fontSize ?? 42,
          font,
          color: rgb(0.4, 0.4, 0.4),
          opacity: watermark.opacity ?? 0.16,
          rotate: degrees(-24)
        });
      }
    }

    const bytes = await document.save();
    return Buffer.from(bytes);
  },
  diagnostics(context) {
    if (!context.resolvedFeatures.metadata && !context.resolvedFeatures.watermark?.text) {
      return;
    }

    const diagnostics: PdfFeatureDiagnostic[] = [
      {
        pluginId: "@dfactory/pdf-feature-pdf-lib",
        level: "info",
        code: "pdf.postprocessed",
        message: "Applied pdf-lib post processing",
        details: {
          metadata: Boolean(context.resolvedFeatures.metadata),
          watermark: Boolean(context.resolvedFeatures.watermark?.text)
        }
      }
    ];

    return diagnostics;
  },
  doctorChecks() {
    return [
      {
        name: "PDF-lib feature plugin",
        ok: true,
        message: "Installed and available for post-processing metadata/watermarks"
      }
    ];
  }
};

export default pdfFeaturePlugin;
