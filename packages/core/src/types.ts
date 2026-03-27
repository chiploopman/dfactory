import type { ZodTypeAny } from "zod";

export type RenderMode = "html" | "pdf";

export interface TemplateMeta {
  id: string;
  title: string;
  description?: string;
  framework: string;
  version: string;
  tags?: string[];
}

export interface TemplateModule<TPayload = unknown> {
  meta: TemplateMeta;
  schema: ZodTypeAny;
  render: (payload: TPayload) => unknown | Promise<unknown>;
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

export interface TemplateDetails extends TemplateSummary {
  schema: Record<string, unknown>;
  source: string;
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
  };
}

export interface RenderContext {
  template: LoadedTemplate;
  payload: unknown;
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
  renderMs: number;
  schemaValidationMs: number;
}

export interface RenderResult {
  html: string;
  diagnostics: RenderDiagnostics;
}

export type TemplatePayloadSchema = ZodTypeAny;
