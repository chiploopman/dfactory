import { Buffer } from "node:buffer";

import { load as loadHtml } from "cheerio";
import {
  PDF_ONLY_CLASS,
  PDF_PREVIEW_ONLY_CLASS,
  PDF_PAGED_MEDIA_ONLY_MARKERS,
  PDF_PRIMITIVE_MARKER_CLASSES,
  stringifyPdfThemeCssVariables
} from "@dfactory/pdf-primitives-core";
import type {
  PdfTemplateConfig,
  PdfTemplateElementName,
  TemplateTocHeading
} from "@dfactory/core";
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
const PAGED_MEDIA_ONLY_CLASS_NAMES = PDF_PAGED_MEDIA_ONLY_MARKERS.map((markerName) => {
  return PDF_PRIMITIVE_MARKER_CLASSES[markerName];
});

const assetCache = new Map<string, string>();

function collectHeadings(html: string, depth: number): {
  html: string;
  headings: TemplateTocHeading[];
} {
  const $ = loadHtml(html);
  const headingSelector = Array.from({ length: depth }, (_, index) => `h${index + 1}`).join(", ");
  const headingNodes = $(headingSelector).toArray();
  const headings: TemplateTocHeading[] = headingNodes.map((heading, index) => {
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

  return {
    html: $.html(),
    headings
  };
}

function createDefaultTocMarkup(options: {
  title: string;
  headings: TemplateTocHeading[];
}): string {
  const listItems = options.headings
    .map((item) => {
      return `<li class="df-toc-item df-toc-level-${item.level}"><a href="#${item.id}">${item.text}</a></li>`;
    })
    .join("");

  return `<nav class="df-toc" aria-label="${options.title}"><h2>${options.title}</h2><ol>${listItems}</ol></nav>`;
}

function prependBodyHtml(html: string, fragment: string): string {
  const $ = loadHtml(html);
  $("body").prepend(fragment);
  return $.html();
}

function appendBodyHtml(html: string, fragment: string): string {
  const $ = loadHtml(html);
  $("body").append(fragment);
  return $.html();
}

async function resolveElementMarkup(
  context: PdfFeatureHtmlContext,
  element: PdfTemplateElementName,
  options?: { headings?: TemplateTocHeading[] }
): Promise<string | undefined> {
  const definition = context.templatePdfElements?.[element];
  if (!definition) {
    return undefined;
  }
  if (definition.render) {
    const rendered = await definition.render({
      headings: options?.headings
    });
    if (typeof rendered === "string" && rendered.trim().length > 0) {
      return rendered;
    }
    return undefined;
  }
  if (typeof definition.template === "string" && definition.template.trim().length > 0) {
    return definition.template;
  }
  return undefined;
}

function appendHeadHtml(html: string, fragment: string): string {
  const $ = loadHtml(html);
  $("head").append(fragment);
  return $.html();
}

async function applyToc(context: PdfFeatureHtmlContext): Promise<void> {
  const tocEnabled = context.resolvedFeatures.toc?.enabled ?? false;
  const depth = context.resolvedFeatures.toc?.maxDepth ?? 3;
  const title = context.resolvedFeatures.toc?.title ?? "Table of Contents";

  const collected = collectHeadings(context.html, depth);
  context.html = collected.html;

  const tocFromElement = await resolveElementMarkup(context, "toc", {
    headings: collected.headings
  });
  if (tocFromElement) {
    context.html = prependBodyHtml(context.html, tocFromElement);
    context.diagnostics.push({
      pluginId: "@dfactory/pdf-feature-standard",
      level: "info",
      code: "toc.element",
      message: "Rendered TOC using first-class template element.",
      details: {
        headings: collected.headings.length
      }
    });
    return;
  }

  if (!tocEnabled || collected.headings.length === 0) {
    return;
  }

  context.html = prependBodyHtml(
    context.html,
    createDefaultTocMarkup({
      title,
      headings: collected.headings
    })
  );
}

async function applyWatermarkElement(context: PdfFeatureHtmlContext): Promise<void> {
  const watermarkMarkup = await resolveElementMarkup(context, "watermark");
  if (!watermarkMarkup) {
    return;
  }

  context.html = appendBodyHtml(
    context.html,
    `<div class="df-watermark-layer" data-dfactory-element="watermark">${watermarkMarkup}</div>`
  );
  context.resolvedFeatures.watermark = {
    ...context.resolvedFeatures.watermark,
    text: undefined
  };
  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "watermark.element",
    message: "Rendered watermark using first-class template element."
  });
}

async function applyPaginationElement(context: PdfFeatureHtmlContext): Promise<void> {
  const paginationMarkup = await resolveElementMarkup(context, "pagination");
  if (!paginationMarkup) {
    return;
  }

  context.html = appendBodyHtml(
    context.html,
    `<div class="df-pagination-layer" data-dfactory-element="pagination">${paginationMarkup}</div>`
  );
  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "pagination.element",
    message: "Rendered pagination using first-class template element."
  });
}

async function applyBackgroundElement(context: PdfFeatureHtmlContext): Promise<void> {
  const backgroundMarkup = await resolveElementMarkup(context, "background");
  if (!backgroundMarkup) {
    return;
  }

  context.html = appendBodyHtml(
    context.html,
    `<div class="df-background-layer" data-dfactory-element="background">${backgroundMarkup}</div>`
  );

  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "background.element",
    message: "Rendered background layer using first-class template element."
  });
}

async function applyForegroundElement(context: PdfFeatureHtmlContext): Promise<void> {
  const foregroundMarkup = await resolveElementMarkup(context, "foreground");
  if (!foregroundMarkup) {
    return;
  }

  context.html = appendBodyHtml(
    context.html,
    `<div class="df-foreground-layer" data-dfactory-element="foreground">${foregroundMarkup}</div>`
  );

  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "foreground.element",
    message: "Rendered foreground layer using first-class template element."
  });
}

async function applyBookmarksElement(context: PdfFeatureHtmlContext): Promise<void> {
  const bookmarksMarkup = await resolveElementMarkup(context, "bookmarks");
  if (!bookmarksMarkup) {
    return;
  }

  context.html = appendHeadHtml(
    context.html,
    `<meta data-dfactory-element="bookmarks" content="${encodeURIComponent(bookmarksMarkup)}" />`
  );

  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "bookmarks.element",
    message: "Captured bookmark payload from first-class template element."
  });
}

async function applyPageRulesElement(context: PdfFeatureHtmlContext): Promise<void> {
  const pageRulesMarkup = await resolveElementMarkup(context, "pageRules");
  if (!pageRulesMarkup) {
    return;
  }

  context.html = appendHeadHtml(
    context.html,
    `<style data-dfactory-element="pageRules">${pageRulesMarkup}</style>`
  );

  context.diagnostics.push({
    pluginId: "@dfactory/pdf-feature-standard",
    level: "info",
    code: "pageRules.element",
    message: "Injected page rules from first-class template element."
  });
}

function buildFeatureStyles(features: PdfTemplateConfig): string {
  const themeCssVariables = stringifyPdfThemeCssVariables(features.theme);
  const rules: string[] = [
    `:root { ${themeCssVariables} }`,
    `body, [data-df-primitive="document"] { font-family: var(--df-pdf-font-family); color: var(--df-pdf-color-text); font-size: var(--df-pdf-font-size); line-height: var(--df-pdf-line-height); background: var(--df-pdf-color-surface); }`,
    `.df-page { width: 100%; min-height: 100%; }`,
    `.df-section, .df-block, .df-stack, .df-row, .df-columns, .df-column, .df-grid, .df-grid-item { box-sizing: border-box; }`,
    `.df-stack > * + * { margin-top: var(--df-pdf-space-sm); }`,
    `.df-row { display: flex; gap: var(--df-pdf-space-md); align-items: flex-start; }`,
    `.df-columns { display: flex; gap: var(--df-pdf-space-md); }`,
    `.df-column { flex: 1 1 0%; min-width: 0; }`,
    `.df-grid { display: grid; gap: var(--df-pdf-space-md); }`,
    `.df-divider { border: 0; border-top: var(--df-pdf-border-width) var(--df-pdf-border-style) var(--df-pdf-color-border); margin: var(--df-pdf-space-md) 0; }`,
    `.df-page-break-before, [data-df-primitive='page-break'], [data-df-primitive='page-break-before'] { break-before: page; page-break-before: always; }`,
    `.df-page-break-after, [data-df-primitive='page-break-after'] { break-after: page; page-break-after: always; }`,
    `.df-keep-with-next, [data-df-primitive='keep-with-next'] { break-after: avoid-page; page-break-after: avoid; }`,
    `.df-keep-together, [data-df-primitive='keep-together'] { break-inside: avoid-page; page-break-inside: avoid; }`,
    `.df-avoid-break, .df-avoid-break-inside, [data-df-primitive='avoid-break-inside'] { break-inside: avoid-page; page-break-inside: avoid; }`,
    `.df-start-on-left-page, [data-df-primitive='start-on-left-page'] { break-before: left; page-break-before: left; }`,
    `.df-start-on-right-page, [data-df-primitive='start-on-right-page'] { break-before: right; page-break-before: right; }`,
    `.df-start-on-recto, [data-df-primitive='start-on-recto'] { break-before: recto; page-break-before: always; }`,
    `.df-start-on-verso, [data-df-primitive='start-on-verso'] { break-before: verso; page-break-before: always; }`,
    `.df-page-group, [data-df-primitive='page-group'] { break-before: page; page-break-before: always; }`,
    `.df-toc, [data-df-primitive='table-of-contents'] { margin-bottom: var(--df-pdf-space-xl); padding: var(--df-pdf-space-lg); border: var(--df-pdf-border-width) var(--df-pdf-border-style) color-mix(in oklab, var(--df-pdf-color-border) 90%, transparent); border-radius: var(--df-pdf-radius-md); background: var(--df-pdf-color-surface-alt); }`,
    `.df-toc h2, .df-toc-title { margin: 0 0 var(--df-pdf-space-sm); font-size: calc(var(--df-pdf-font-size) + 2px); color: var(--df-pdf-color-text); }`,
    `.df-toc ol, .df-toc-list { margin: 0; padding: 0 0 0 var(--df-pdf-space-lg); }`,
    `.df-toc-item { margin: var(--df-pdf-space-xs) 0; }`,
    `.df-toc-item a { color: inherit; text-decoration: none; }`,
    `.df-table { width: 100%; border-collapse: collapse; }`,
    `.df-table-header-cell, .df-table-cell { border-bottom: var(--df-pdf-border-width) var(--df-pdf-border-style) var(--df-pdf-color-border); padding: var(--df-pdf-space-sm); }`,
    `.df-table-cell-numeric { text-align: right; }`,
    `.df-running-header, .df-running-footer { width: 100%; color: var(--df-pdf-color-muted); font-size: 9px; }`,
    `.df-token { color: inherit; }`,
    `.df-background-layer { position: fixed; inset: 0; pointer-events: none; z-index: 9991; }`,
    `.df-pagination-layer { position: fixed; left: 0; right: 0; bottom: 0; pointer-events: none; z-index: 9998; }`,
    `.df-watermark-layer { position: fixed; inset: 0; pointer-events: none; display: flex; align-items: center; justify-content: center; z-index: 9999; }`,
    `.df-foreground-layer { position: fixed; inset: 0; pointer-events: none; z-index: 10000; }`,
    `.${PDF_ONLY_CLASS}, [data-df-primitive='pdf-only'] { display: initial; }`,
    `.${PDF_PREVIEW_ONLY_CLASS}, [data-df-primitive='preview-only'] { display: initial; }`,
    `@media print { .${PDF_PREVIEW_ONLY_CLASS}, [data-df-primitive='preview-only'] { display: none !important; } }`,
    `@media screen { .${PDF_ONLY_CLASS}, [data-df-primitive='pdf-only'] { display: none !important; } }`,
    `.df-debug-bounds { outline: 1px dashed #ef4444; }`,
    `.df-debug-flow { outline: 1px dashed #14b8a6; }`,
    `.df-overflow-guard { overflow: hidden; }`,
    `.df-orphan-widow-guard { orphans: 2; widows: 2; }`
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

async function applyHeaderFooter(context: PdfFeatureHtmlContext): Promise<void> {
  const existing = context.resolvedFeatures.headerFooter ?? {};
  const renderedHeader = await resolveElementMarkup(context, "header");
  const renderedFooter = await resolveElementMarkup(context, "footer");

  const hasElementHeader = typeof renderedHeader === "string" && renderedHeader.length > 0;
  const hasElementFooter = typeof renderedFooter === "string" && renderedFooter.length > 0;

  if (hasElementHeader || hasElementFooter || existing.enabled) {
    context.resolvedFeatures.headerFooter = {
      ...existing,
      enabled: true,
      headerTemplate: hasElementHeader ? renderedHeader : existing.headerTemplate,
      footerTemplate: hasElementFooter ? renderedFooter : existing.footerTemplate
    };
  }

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
    await applyHeaderFooter(context);
    addMetadataDefaults(context);
    const styles = buildFeatureStyles(context.resolvedFeatures);
    context.html = injectStyles(context.html, styles);
    await applyToc(context);
    await applyBackgroundElement(context);
    await applyPaginationElement(context);
    await applyWatermarkElement(context);
    await applyForegroundElement(context);
    await applyBookmarksElement(context);
    await applyPageRulesElement(context);
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

    const pagedClassUsedWithoutPagedMode = PAGED_MEDIA_ONLY_CLASS_NAMES.find((className) => {
      return context.html.includes(className);
    });
    if (
      pagedClassUsedWithoutPagedMode &&
      context.resolvedFeatures.pagination?.mode !== "pagedjs"
    ) {
      diagnostics.push({
        pluginId: "@dfactory/pdf-feature-standard",
        level: "warn",
        code: "pagination.paged-only-marker",
        message:
          `Detected paged-media marker '${pagedClassUsedWithoutPagedMode}' while pagination.mode is not 'pagedjs'. ` +
          "Enable '@dfactory/pdf-feature-pagedjs' and set pagination.mode='pagedjs' for full behavior."
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
