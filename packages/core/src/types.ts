import type { ZodTypeAny } from "zod";

export type RenderMode = "html" | "pdf";
export type PdfPageSize = "A4" | "Letter";
export type PdfPaginationMode = "css" | "pagedjs";
export type PdfMarkerName = "pageBreakBefore" | "keepWithNext" | "avoidBreak";

export interface TemplateMeta {
  id: string;
  title: string;
  description?: string;
  framework: string;
  version: string;
  tags?: string[];
}

export interface TemplateRenderHelpers {
  markerClass: (name: PdfMarkerName) => string;
}

export interface PdfTemplatePageConfig {
  size?: PdfPageSize;
  orientation?: "portrait" | "landscape";
  marginsMm?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface PdfTemplateHeaderFooterConfig {
  enabled?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  tokens?: Record<string, string>;
}

export interface PdfTemplateTocConfig {
  enabled?: boolean;
  maxDepth?: 1 | 2 | 3 | 4;
  title?: string;
}

export interface PdfTemplatePaginationConfig {
  mode?: PdfPaginationMode;
}

export interface PdfTemplateAssetsConfig {
  allowedHosts?: string[];
  maxAssetBytes?: number;
  maxAssetCount?: number;
  timeoutMs?: number;
}

export interface PdfFontFamilyConfig {
  family: string;
  src: string;
  weight?: string;
  style?: string;
}

export interface PdfTemplateFontConfig {
  families: PdfFontFamilyConfig[];
}

export interface PdfTemplateMetadataConfig {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
}

export interface PdfTemplateWatermarkConfig {
  text?: string;
  opacity?: number;
  fontSize?: number;
}

export interface PdfTemplateConfig {
  page?: PdfTemplatePageConfig;
  headerFooter?: PdfTemplateHeaderFooterConfig;
  toc?: PdfTemplateTocConfig;
  pagination?: PdfTemplatePaginationConfig;
  assets?: PdfTemplateAssetsConfig;
  fonts?: PdfTemplateFontConfig;
  metadata?: PdfTemplateMetadataConfig;
  watermark?: PdfTemplateWatermarkConfig;
}

export type TemplatePdfFeatureOverrides = Partial<PdfTemplateConfig>;

export interface TemplateExample<TPayload = unknown> {
  name: string;
  description?: string;
  payload: TPayload;
  profile?: string;
}

export interface TemplateRenderContext {
  runId: string;
  mode: RenderMode;
  profile?: string;
  now: Date;
  templateId: string;
  features: PdfTemplateConfig;
  helpers: TemplateRenderHelpers;
}

export interface TemplateModule<TPayload = unknown> {
  meta: TemplateMeta;
  schema: ZodTypeAny;
  render: (
    payload: TPayload,
    context?: TemplateRenderContext
  ) => unknown | Promise<unknown>;
  pdf?: PdfTemplateConfig;
  examples?: TemplateExample<TPayload>[];
}

export interface LoadedTemplate {
  id: string;
  filePath: string;
  directory: string;
  meta: TemplateMeta;
  schema: ZodTypeAny;
  module: TemplateModule;
}

export interface TemplateSummary {
  id: string;
  filePath: string;
  meta: TemplateMeta;
  framework: string;
}

export type TemplateSourceFileStatus = "ready" | "skipped";
export type TemplateSourceSkipReason = "binary" | "tooLarge" | "unreadable";

export interface TemplateSourceFile {
  path: string;
  status: TemplateSourceFileStatus;
  content?: string;
  skipReason?: TemplateSourceSkipReason;
  bytes: number;
  entry: boolean;
}

export interface TemplateSourceManifest {
  templateId: string;
  root: string;
  entryFile: string;
  files: TemplateSourceFile[];
}

export interface TemplateDetails extends TemplateSummary {
  schema: Record<string, unknown>;
  source: string;
  pdf?: PdfTemplateConfig;
  examples?: TemplateExample[];
}

export interface DFactoryConfig {
  templates: {
    globs: string[];
    ignore?: string[];
    compatibilityGlobEnabled?: boolean;
  };
  plugins: string[];
  moduleLoader?: string;
  auth: {
    mode: "apiKey";
    apiKeys?: string[];
    hookModule?: string;
  };
  ui: {
    exposeInProd: boolean;
    sourceInProd: boolean;
    playgroundInProd: boolean;
  };
  renderer: {
    engine: "playwright";
    poolSize: number;
    timeoutMs: number;
    pdfPlugins?: string[];
    defaults?: {
      format?: string;
      printBackground?: boolean;
      preferCSSPageSize?: boolean;
      tagged?: boolean;
      outline?: boolean;
    };
  };
}

export interface RenderContext {
  template: LoadedTemplate;
  payload: unknown;
  renderContext: TemplateRenderContext;
}

export interface TemplateAdapter {
  framework: string;
  renderHtml: (context: RenderContext) => Promise<string>;
}

export interface DoctorCheckResult {
  name: string;
  ok: boolean;
  message: string;
}

export interface ModuleTransformAlias {
  find: string | RegExp;
  replacement: string;
}

export interface ModuleTransformConfig {
  aliases?: ModuleTransformAlias[];
  vitePlugins?: unknown[];
}

export interface DFactoryFrameworkPlugin {
  id: string;
  framework: string;
  createAdapter: () => Promise<TemplateAdapter> | TemplateAdapter;
  requiresModuleTransforms?: boolean;
  createModuleTransformConfig?: () => Promise<ModuleTransformConfig> | ModuleTransformConfig;
  doctorChecks?: (context: { cwd: string; config: DFactoryConfig }) => Promise<DoctorCheckResult[]> | DoctorCheckResult[];
}

export interface TemplateModuleLoader {
  id: string;
  load(filePath: string): Promise<unknown>;
  close(): Promise<void>;
}

export interface DFactoryModuleLoaderFactory {
  id: string;
  supportsModuleTransforms: boolean;
  create: (options: { cwd: string; config: DFactoryConfig; plugins: DFactoryFrameworkPlugin[] }) => Promise<TemplateModuleLoader> | TemplateModuleLoader;
}

export interface RegistryRuntimeInfo {
  pluginIds: string[];
  frameworks: string[];
  moduleLoader: string;
}

export interface RegistryOptions {
  cwd: string;
  configPath?: string;
  plugins?: DFactoryFrameworkPlugin[];
  moduleLoaderFactory?: DFactoryModuleLoaderFactory;
}

export interface RenderDiagnostics {
  templateId: string;
  framework: string;
  runId: string;
  renderMs: number;
  schemaValidationMs: number;
}

export interface RenderResult {
  html: string;
  diagnostics: RenderDiagnostics;
  templatePdfConfig?: PdfTemplateConfig;
}

export type TemplatePayloadSchema = ZodTypeAny;
