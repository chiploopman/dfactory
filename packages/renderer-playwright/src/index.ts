import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium, type Browser } from "playwright";
import type {
  DFactoryConfig,
  DoctorCheckResult,
  PdfTemplateConfig,
  RenderMode,
  ResolvedTemplatePdfElements,
  TemplateMeta,
  TemplatePdfElementCapabilities,
  TemplatePdfFeatureOverrides
} from "@dfactory/core";

type PdfOptionRecord = Record<string, unknown>;

export interface PdfFeatureDiagnostic {
  pluginId: string;
  level: "info" | "warn" | "error";
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface PdfFeatureBaseContext {
  templateId?: string;
  templateMeta?: TemplateMeta;
  mode?: RenderMode;
  profile?: string;
  payload?: unknown;
  templateFeatures?: PdfTemplateConfig;
  featuresOverride?: TemplatePdfFeatureOverrides;
  resolvedFeatures: PdfTemplateConfig;
  templatePdfElements?: ResolvedTemplatePdfElements;
  templatePdfElementCapabilities?: TemplatePdfElementCapabilities;
}

export interface PdfFeatureHtmlContext extends PdfFeatureBaseContext {
  html: string;
  diagnostics: PdfFeatureDiagnostic[];
  options: PdfOptionRecord;
}

export interface PdfFeaturePdfContext extends PdfFeatureHtmlContext {
  pdf: Buffer;
}

export interface PdfFeaturePlugin {
  id: string;
  htmlPre?: (context: PdfFeatureHtmlContext) => Promise<string | void> | string | void;
  htmlPost?: (context: PdfFeatureHtmlContext) => Promise<string | void> | string | void;
  preflight?: (context: PdfFeatureHtmlContext) => Promise<PdfFeatureDiagnostic[] | void> | PdfFeatureDiagnostic[] | void;
  diagnostics?: (context: PdfFeatureHtmlContext) => Promise<PdfFeatureDiagnostic[] | void> | PdfFeatureDiagnostic[] | void;
  pdfPost?: (context: PdfFeaturePdfContext) => Promise<Buffer | void> | Buffer | void;
  doctorChecks?: (context: { cwd: string; config: DFactoryConfig }) => Promise<DoctorCheckResult[]> | DoctorCheckResult[];
}

export interface PdfRenderOptions {
  timeoutMs?: number;
  pdf?: PdfOptionRecord;
  templateId?: string;
  templateMeta?: TemplateMeta;
  mode?: RenderMode;
  profile?: string;
  payload?: unknown;
  templateFeatures?: PdfTemplateConfig;
  features?: TemplatePdfFeatureOverrides;
  templatePdfElements?: ResolvedTemplatePdfElements;
  templatePdfElementCapabilities?: TemplatePdfElementCapabilities;
}

export interface PdfRenderResult {
  pdf: Buffer;
  diagnostics: PdfFeatureDiagnostic[];
  resolvedFeatures: PdfTemplateConfig;
  effectivePdfOptions: PdfOptionRecord;
}

export interface PdfPreflightResult {
  html: string;
  diagnostics: PdfFeatureDiagnostic[];
  resolvedFeatures: PdfTemplateConfig;
}

export interface PdfRenderer {
  htmlToPdf: (html: string, options?: PdfRenderOptions) => Promise<PdfRenderResult>;
  preflight: (html: string, options?: PdfRenderOptions) => Promise<PdfPreflightResult>;
  resolveFeatures: (options?: {
    templateFeatures?: PdfTemplateConfig;
    featuresOverride?: TemplatePdfFeatureOverrides;
  }) => PdfTemplateConfig;
  close: () => Promise<void>;
}

class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];

  constructor(size: number) {
    this.available = Math.max(1, size);
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });

    this.available -= 1;
    return () => this.release();
  }

  private release(): void {
    this.available += 1;
    const next = this.waiters.shift();
    if (next) {
      next();
    }
  }
}

function mergePdfTemplateConfig(
  base: PdfTemplateConfig | undefined,
  override: TemplatePdfFeatureOverrides | undefined
): PdfTemplateConfig {
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    page: {
      ...(base?.page ?? {}),
      ...(override?.page ?? {})
    },
    headerFooter: {
      ...(base?.headerFooter ?? {}),
      ...(override?.headerFooter ?? {})
    },
    toc: {
      ...(base?.toc ?? {}),
      ...(override?.toc ?? {})
    },
    pagination: {
      ...(base?.pagination ?? {}),
      ...(override?.pagination ?? {})
    },
    assets: {
      ...(base?.assets ?? {}),
      ...(override?.assets ?? {})
    },
    fonts: {
      ...(base?.fonts ?? {}),
      ...(override?.fonts ?? {}),
      families: override?.fonts?.families ?? base?.fonts?.families ?? []
    },
    metadata: {
      ...(base?.metadata ?? {}),
      ...(override?.metadata ?? {})
    },
    watermark: {
      ...(base?.watermark ?? {}),
      ...(override?.watermark ?? {})
    },
    theme: {
      ...(base?.theme ?? {}),
      ...(override?.theme ?? {}),
      font: {
        ...(base?.theme?.font ?? {}),
        ...(override?.theme?.font ?? {})
      },
      space: {
        ...(base?.theme?.space ?? {}),
        ...(override?.theme?.space ?? {})
      },
      color: {
        ...(base?.theme?.color ?? {}),
        ...(override?.theme?.color ?? {})
      },
      radius: {
        ...(base?.theme?.radius ?? {}),
        ...(override?.theme?.radius ?? {})
      },
      border: {
        ...(base?.theme?.border ?? {}),
        ...(override?.theme?.border ?? {})
      }
    }
  };
}

function replaceHeaderFooterTokens(template: string, options: {
  templateId?: string;
  title?: string;
  tokens?: Record<string, string>;
}): string {
  const replacements: Record<string, string> = {
    "{{pageNumber}}": `<span class="pageNumber"></span>`,
    "{{totalPages}}": `<span class="totalPages"></span>`,
    "{{pageXofY}}": `<span class="pageNumber"></span> / <span class="totalPages"></span>`,
    "{{date}}": new Date().toISOString(),
    "{{title}}": options.title ?? "",
    "{{templateId}}": options.templateId ?? "",
    ...(options.tokens ?? {})
  };

  let output = template;
  for (const [token, value] of Object.entries(replacements)) {
    output = output.replaceAll(token, value);
  }
  return output;
}

function toPdfPageOptions(
  features: PdfTemplateConfig,
  tokenContext: { templateId?: string; title?: string }
): PdfOptionRecord {
  const resolved: PdfOptionRecord = {};
  const page = features.page;
  if (page?.size) {
    resolved.format = page.size;
  }
  if (page?.orientation) {
    resolved.landscape = page.orientation === "landscape";
  }
  if (page?.marginsMm) {
    resolved.margin = {
      top: `${page.marginsMm.top}mm`,
      right: `${page.marginsMm.right}mm`,
      bottom: `${page.marginsMm.bottom}mm`,
      left: `${page.marginsMm.left}mm`
    };
  }

  const headerFooter = features.headerFooter;
  if (headerFooter?.enabled) {
    resolved.displayHeaderFooter = true;
    if (headerFooter.headerTemplate) {
      resolved.headerTemplate = replaceHeaderFooterTokens(headerFooter.headerTemplate, {
        templateId: tokenContext.templateId,
        title: tokenContext.title,
        tokens: headerFooter.tokens
      });
    }
    if (headerFooter.footerTemplate) {
      resolved.footerTemplate = replaceHeaderFooterTokens(headerFooter.footerTemplate, {
        templateId: tokenContext.templateId,
        title: tokenContext.title,
        tokens: headerFooter.tokens
      });
    }
  }

  return resolved;
}

async function runHtmlStage(
  plugins: PdfFeaturePlugin[],
  stage: "htmlPre" | "htmlPost",
  context: PdfFeatureHtmlContext
): Promise<void> {
  for (const plugin of plugins) {
    const handler = plugin[stage];
    if (!handler) {
      continue;
    }

    const updated = await handler(context);
    if (typeof updated === "string") {
      context.html = updated;
    }
  }
}

async function collectDiagnostics(
  plugins: PdfFeaturePlugin[],
  stage: "preflight" | "diagnostics",
  context: PdfFeatureHtmlContext
): Promise<void> {
  for (const plugin of plugins) {
    const handler = plugin[stage];
    if (!handler) {
      continue;
    }

    const result = await handler(context);
    if (Array.isArray(result) && result.length > 0) {
      context.diagnostics.push(...result);
    }
  }
}

function resolveModuleReference(cwd: string, moduleRef: string): string {
  if (moduleRef.startsWith(".")) {
    return pathToFileURL(path.resolve(cwd, moduleRef)).href;
  }
  return moduleRef;
}

function assertPdfFeaturePlugin(moduleRef: string, plugin: unknown): asserts plugin is PdfFeaturePlugin {
  if (!plugin || typeof plugin !== "object") {
    throw new Error(`PDF feature plugin '${moduleRef}' does not export a valid plugin object.`);
  }

  const candidate = plugin as Partial<PdfFeaturePlugin>;
  if (!candidate.id || typeof candidate.id !== "string") {
    throw new Error(`PDF feature plugin '${moduleRef}' is missing string 'id'.`);
  }
}

async function importPdfFeaturePlugin(moduleRef: string): Promise<PdfFeaturePlugin> {
  let imported: Record<string, unknown>;
  try {
    imported = await import(moduleRef);
  } catch (error) {
    throw new Error(
      `Failed to load PDF feature plugin '${moduleRef}'. Install it and ensure it is resolvable. Cause: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  const plugin = imported.default ?? imported.pdfFeaturePlugin ?? imported.plugin;
  assertPdfFeaturePlugin(moduleRef, plugin);
  return plugin;
}

export async function loadPdfFeaturePlugins(options: {
  cwd: string;
  pluginRefs: string[];
  preloaded?: PdfFeaturePlugin[];
}): Promise<PdfFeaturePlugin[]> {
  const plugins: PdfFeaturePlugin[] = [];
  const preloadedById = new Map((options.preloaded ?? []).map((plugin) => [plugin.id, plugin]));

  for (const pluginRef of options.pluginRefs) {
    const preloaded = preloadedById.get(pluginRef);
    const plugin = preloaded ?? (await importPdfFeaturePlugin(resolveModuleReference(options.cwd, pluginRef)));
    const alreadyLoaded = plugins.some((candidate) => candidate.id === plugin.id);
    if (alreadyLoaded) {
      continue;
    }
    plugins.push(plugin);
  }

  return plugins;
}

export async function runPdfFeatureDoctorChecks(options: {
  cwd: string;
  config: DFactoryConfig;
  plugins: PdfFeaturePlugin[];
}): Promise<DoctorCheckResult[]> {
  const checks: DoctorCheckResult[] = [];
  checks.push({
    name: "PDF feature plugins",
    ok: true,
    message: options.plugins.length
      ? `Loaded PDF feature plugins: ${options.plugins.map((plugin) => plugin.id).join(", ")}`
      : "No PDF feature plugins configured"
  });

  for (const plugin of options.plugins) {
    if (!plugin.doctorChecks) {
      continue;
    }

    const pluginChecks = await plugin.doctorChecks({
      cwd: options.cwd,
      config: options.config
    });
    checks.push(...pluginChecks);
  }

  return checks;
}

export class PlaywrightPdfRenderer implements PdfRenderer {
  private browserPromise: Promise<Browser> | undefined;
  private readonly semaphore: Semaphore;
  private readonly defaultTimeoutMs: number;
  private readonly defaultPdfOptions: PdfOptionRecord;
  private readonly plugins: PdfFeaturePlugin[];

  constructor(options?: {
    poolSize?: number;
    timeoutMs?: number;
    defaults?: PdfOptionRecord;
    plugins?: PdfFeaturePlugin[];
  }) {
    this.semaphore = new Semaphore(options?.poolSize ?? 4);
    this.defaultTimeoutMs = options?.timeoutMs ?? 30000;
    this.defaultPdfOptions = {
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      ...(options?.defaults ?? {})
    };
    this.plugins = options?.plugins ?? [];
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = chromium.launch({
        headless: true,
        args: ["--font-render-hinting=none"]
      });
    }

    return this.browserPromise;
  }

  resolveFeatures(options?: {
    templateFeatures?: PdfTemplateConfig;
    featuresOverride?: TemplatePdfFeatureOverrides;
  }): PdfTemplateConfig {
    return mergePdfTemplateConfig(options?.templateFeatures, options?.featuresOverride);
  }

  async preflight(html: string, options?: PdfRenderOptions): Promise<PdfPreflightResult> {
    const resolvedFeatures = this.resolveFeatures({
      templateFeatures: options?.templateFeatures,
      featuresOverride: options?.features
    });

    const context: PdfFeatureHtmlContext = {
      templateId: options?.templateId,
      templateMeta: options?.templateMeta,
      mode: options?.mode,
      profile: options?.profile,
      payload: options?.payload,
      templateFeatures: options?.templateFeatures,
      featuresOverride: options?.features,
      resolvedFeatures,
      templatePdfElements: options?.templatePdfElements,
      templatePdfElementCapabilities: options?.templatePdfElementCapabilities,
      html,
      diagnostics: [],
      options: {}
    };

    await runHtmlStage(this.plugins, "htmlPre", context);
    await runHtmlStage(this.plugins, "htmlPost", context);
    await collectDiagnostics(this.plugins, "preflight", context);

    return {
      html: context.html,
      diagnostics: context.diagnostics,
      resolvedFeatures
    };
  }

  async htmlToPdf(html: string, options?: PdfRenderOptions): Promise<PdfRenderResult> {
    const release = await this.semaphore.acquire();
    try {
      const preflight = await this.preflight(html, options);
      const browser = await this.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      page.setDefaultNavigationTimeout(options?.timeoutMs ?? this.defaultTimeoutMs);
      await page.setContent(preflight.html, { waitUntil: "networkidle" });

      const featurePdfOptions = toPdfPageOptions(preflight.resolvedFeatures, {
        templateId: options?.templateId,
        title: options?.templateMeta?.title
      });
      const effectivePdfOptions: PdfOptionRecord = {
        ...this.defaultPdfOptions,
        ...featurePdfOptions,
        ...(options?.pdf ?? {})
      };

      const pdfRaw = await page.pdf(effectivePdfOptions as Parameters<typeof page.pdf>[0]);
      await context.close();

      const htmlContext: PdfFeatureHtmlContext = {
        templateId: options?.templateId,
        templateMeta: options?.templateMeta,
        mode: options?.mode,
        profile: options?.profile,
        payload: options?.payload,
        templateFeatures: options?.templateFeatures,
        featuresOverride: options?.features,
        resolvedFeatures: preflight.resolvedFeatures,
        templatePdfElements: options?.templatePdfElements,
        templatePdfElementCapabilities: options?.templatePdfElementCapabilities,
        html: preflight.html,
        diagnostics: [...preflight.diagnostics],
        options: effectivePdfOptions
      };

      const pdfContext: PdfFeaturePdfContext = {
        ...htmlContext,
        pdf: Buffer.from(pdfRaw)
      };

      for (const plugin of this.plugins) {
        if (!plugin.pdfPost) {
          continue;
        }
        const maybePdf = await plugin.pdfPost(pdfContext);
        if (Buffer.isBuffer(maybePdf)) {
          pdfContext.pdf = maybePdf;
        }
      }

      await collectDiagnostics(this.plugins, "diagnostics", htmlContext);

      return {
        pdf: pdfContext.pdf,
        diagnostics: htmlContext.diagnostics,
        resolvedFeatures: preflight.resolvedFeatures,
        effectivePdfOptions
      };
    } finally {
      release();
    }
  }

  async close(): Promise<void> {
    if (!this.browserPromise) {
      return;
    }

    const browser = await this.browserPromise;
    await browser.close();
    this.browserPromise = undefined;
  }
}

export function createPlaywrightPdfRenderer(options?: {
  poolSize?: number;
  timeoutMs?: number;
  defaults?: PdfOptionRecord;
  plugins?: PdfFeaturePlugin[];
}): PdfRenderer {
  return new PlaywrightPdfRenderer(options);
}
