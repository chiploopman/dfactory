import { Buffer } from "node:buffer";

import { load as loadHtml } from "cheerio";
import type { PdfTemplateConfig } from "@dfactory/core";
import type {
  PdfFeatureDiagnostic,
  PdfFeatureHtmlContext,
  PdfFeaturePlugin
} from "@dfactory/renderer-playwright";

const DEFAULT_ASSET_LIMITS = {
  maxAssetBytes: 5 * 1024 * 1024,
  maxAssetCount: 64,
  timeoutMs: 5000
} as const;

const DATA_URL_PATTERN = /^data:[^;]+;base64,/i;

const assetCache = new Map<string, string>();

function ensureToc(html: string, context: PdfFeatureHtmlContext): string {
  if (!context.resolvedFeatures.toc?.enabled) {
    return html;
  }

  const depth = context.resolvedFeatures.toc.maxDepth ?? 3;
  const title = context.resolvedFeatures.toc.title ?? "Table of Contents";

  const $ = loadHtml(html);
  const headingSelector = Array.from({ length: depth }, (_, index) => `h${index + 1}`).join(", ");
  const headings = $(headingSelector).toArray();
  if (headings.length === 0) {
    return html;
  }

  const tocItems = headings.map((heading, index) => {
    const headingTag = ($(heading).prop("tagName") ?? "H1").toString().toLowerCase();
    const level = Number(headingTag.slice(1));
    const text = $(heading).text().trim();
    const existingId = $(heading).attr("id");
    const id = existingId || `df-heading-${index + 1}`;
    if (!existingId) {
      $(heading).attr("id", id);
    }

    return { level, text, id };
  });

  const listItems = tocItems
    .map((item) => {
      return `<li class="df-toc-item df-toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`;
    })
    .join("");

  const tocHtml = `<nav class="df-toc" aria-label="${title}"><h2>${title}</h2><ol>${listItems}</ol></nav>`;
  const body = $("body");
  body.prepend(tocHtml);

  return $.html();
}

function buildFeatureStyles(features: PdfTemplateConfig): string {
  const rules: string[] = [
    `.df-page-break-before { break-before: page; page-break-before: always; }`,
    `.df-keep-with-next { break-after: avoid-page; page-break-after: avoid; }`,
    `.df-avoid-break { break-inside: avoid-page; page-break-inside: avoid; }`,
    `.df-toc { margin-bottom: 24px; padding: 16px; border: 1px solid rgba(15, 23, 42, 0.08); border-radius: 8px; }`,
    `.df-toc h2 { margin: 0 0 12px; font-size: 16px; }`,
    `.df-toc ol { margin: 0; padding: 0 0 0 16px; }`,
    `.df-toc-item { margin: 4px 0; }`,
    `.df-toc-item a { color: inherit; text-decoration: none; }`
  ];

  const page = features.page;
  if (page?.size || page?.marginsMm || page?.orientation) {
    const size = page.size ?? "A4";
    const orientation = page.orientation ?? "portrait";
    const margins = page.marginsMm
      ? `${page.marginsMm.top}mm ${page.marginsMm.right}mm ${page.marginsMm.bottom}mm ${page.marginsMm.left}mm`
      : "12mm 12mm 12mm 12mm";
    rules.push(`@page { size: ${size} ${orientation}; margin: ${margins}; }`);
  }

  const fonts = features.fonts?.families ?? [];
  for (const font of fonts) {
    rules.push(
      `@font-face { font-family: "${font.family}"; src: url("${font.src}"); font-style: ${font.style ?? "normal"}; font-weight: ${font.weight ?? "400"}; }`
    );
  }

  return rules.join("\n");
}

function injectStyles(html: string, styles: string): string {
  const $ = loadHtml(html);
  const head = $("head");
  head.append(`<style data-dfactory-standard="true">${styles}</style>`);
  return $.html();
}

async function resolveImageSource(
  source: string,
  limits: {
    maxAssetBytes: number;
    maxAssetCount: number;
    timeoutMs: number;
    allowedHosts?: string[];
  },
  counter: { value: number }
): Promise<string> {
  if (!source) {
    return source;
  }
  if (DATA_URL_PATTERN.test(source)) {
    return source;
  }

  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return source;
  }

  if (url.protocol !== "https:") {
    throw new Error(`Only https:// asset URLs are supported. Received '${source}'.`);
  }

  if (limits.allowedHosts && limits.allowedHosts.length > 0 && !limits.allowedHosts.includes(url.hostname)) {
    throw new Error(`Asset host '${url.hostname}' is not allowed by template asset policy.`);
  }

  counter.value += 1;
  if (counter.value > limits.maxAssetCount) {
    throw new Error(`Template asset count exceeds maxAssetCount (${limits.maxAssetCount}).`);
  }

  const cacheKey = url.toString();
  const cached = assetCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const response = await fetch(url, {
    signal: AbortSignal.timeout(limits.timeoutMs)
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch asset '${url}': HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length > limits.maxAssetBytes) {
    throw new Error(`Asset '${url}' exceeded maxAssetBytes (${limits.maxAssetBytes}).`);
  }

  const dataUri = `data:${contentType};base64,${bytes.toString("base64")}`;
  assetCache.set(cacheKey, dataUri);
  return dataUri;
}

async function embedAssets(html: string, context: PdfFeatureHtmlContext): Promise<string> {
  const assetConfig = context.resolvedFeatures.assets;
  if (!assetConfig) {
    return html;
  }

  const limits = {
    maxAssetBytes: assetConfig.maxAssetBytes ?? DEFAULT_ASSET_LIMITS.maxAssetBytes,
    maxAssetCount: assetConfig.maxAssetCount ?? DEFAULT_ASSET_LIMITS.maxAssetCount,
    timeoutMs: assetConfig.timeoutMs ?? DEFAULT_ASSET_LIMITS.timeoutMs,
    allowedHosts: assetConfig.allowedHosts
  };

  const counter = { value: 0 };
  const $ = loadHtml(html);
  const images = $("img[src]").toArray();
  for (const img of images) {
    const src = $(img).attr("src") ?? "";
    const embedded = await resolveImageSource(src, limits, counter);
    $(img).attr("src", embedded);
  }

  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "assets.embedded",
    message: `Embedded ${counter.value} remote asset(s).`,
    details: {
      maxAssetBytes: limits.maxAssetBytes,
      maxAssetCount: limits.maxAssetCount
    }
  });

  return $.html();
}

function applyDefaultHeaderFooter(context: PdfFeatureHtmlContext): void {
  const headerFooter = context.resolvedFeatures.headerFooter;
  if (!headerFooter?.enabled) {
    return;
  }

  if (!headerFooter.footerTemplate) {
    context.resolvedFeatures.headerFooter = {
      ...headerFooter,
      footerTemplate:
        "<div style=\"width:100%;font-size:9px;padding:0 12px;color:#64748b;\"><span>{{pageNumber}}</span>/<span>{{totalPages}}</span></div>"
    };
  }
}

function addMetadataDefaults(context: PdfFeatureHtmlContext): void {
  const existing = context.resolvedFeatures.metadata ?? {};
  context.resolvedFeatures.metadata = {
    ...existing,
    title: existing.title ?? context.templateMeta?.title,
    keywords: existing.keywords ?? context.templateMeta?.tags
  };
}

export const pdfFeaturePlugin: PdfFeaturePlugin = {
  id: "@dfactory/pdf-feature-standard",
  async htmlPre(context) {
    applyDefaultHeaderFooter(context);
    addMetadataDefaults(context);
    const styles = buildFeatureStyles(context.resolvedFeatures);
    context.html = injectStyles(context.html, styles);
    context.html = ensureToc(context.html, context);
    return context.html;
  },
  async htmlPost(context) {
    context.html = await embedAssets(context.html, context);
    return context.html;
  },
  preflight(context) {
    const diagnostics: PdfFeatureDiagnostic[] = [];
    if (context.resolvedFeatures.pagination?.mode === "pagedjs") {
      diagnostics.push({
        pluginId: "@dfactory/pdf-feature-standard",
        level: "warn",
        code: "pagination.mode",
        message:
          "Template requests pagination.mode='pagedjs'. Configure '@dfactory/pdf-feature-pagedjs' in renderer.pdfPlugins for advanced pagination."
      });
    }
    return diagnostics;
  },
  diagnostics(context) {
    return [
      {
        pluginId: "@dfactory/pdf-feature-standard",
        level: "info",
        code: "features.applied",
        message: "Standard PDF features applied",
        details: {
          toc: context.resolvedFeatures.toc?.enabled ?? false,
          fonts: context.resolvedFeatures.fonts?.families.length ?? 0
        }
      }
    ];
  },
  doctorChecks() {
    return [
      {
        name: "Standard PDF feature plugin",
        ok: true,
        message: "Loaded and ready"
      }
    ];
  }
};

export default pdfFeaturePlugin;
