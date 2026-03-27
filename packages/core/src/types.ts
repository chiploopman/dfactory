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
  adapters: string[];
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

export interface RegistryOptions {
  cwd: string;
  configPath?: string;
  adapters?: TemplateAdapter[];
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
