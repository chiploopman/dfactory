export interface TemplateMeta {
  id: string;
  title: string;
  description?: string;
  framework: string;
  version: string;
  tags?: string[];
}

export interface TemplateSummary {
  id: string;
  meta: TemplateMeta;
  framework: string;
  filePath: string;
}

export interface RuntimeConfig {
  isProduction: boolean;
  ui: {
    exposeInProd: boolean;
    sourceInProd: boolean;
    playgroundInProd: boolean;
  };
}

export interface PreviewHtmlResponse {
  mode: "html";
  templateId: string;
  html: string;
  diagnostics: {
    templateId: string;
    framework: string;
    renderMs: number;
    schemaValidationMs: number;
  };
  generatedAt: string;
}

export interface GenerateHtmlResponse {
  mode: "html";
  templateId: string;
  html: string;
  generatedAt: string;
}
