import type {
  GenerateHtmlResponse,
  PreviewHtmlResponse,
  RuntimeConfig,
  TemplateSourceManifest,
  TemplateSummary,
} from "@/types/api";

function resolveApiBase(): string {
  if (import.meta.env.VITE_DFACTORY_API_URL) {
    return import.meta.env.VITE_DFACTORY_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api`;
  }

  return "http://127.0.0.1:3210/api";
}

const API_BASE = resolveApiBase();

export type RenderMode = "html" | "pdf";

export interface DocumentPayload {
  templateId: string;
  payload: unknown;
  mode: RenderMode;
  options?: {
    timeoutMs?: number;
    pdf?: Record<string, unknown>;
    profile?: string;
    features?: Record<string, unknown>;
  };
}

interface ApiErrorBody {
  error?: string;
  message?: string;
}

function headers(extra?: Record<string, string>): HeadersInit {
  return {
    "content-type": "application/json",
    ...extra
  };
}

async function readApiError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) {
    return `Request failed (${response.status}).`;
  }

  try {
    const parsed = JSON.parse(text) as ApiErrorBody;
    return parsed.message ?? parsed.error ?? text;
  } catch {
    return text;
  }
}

export async function fetchRuntime(): Promise<RuntimeConfig> {
  const response = await fetch(`${API_BASE}/runtime`);
  if (!response.ok) {
    throw new Error(`Failed to fetch runtime config (${response.status}).`);
  }
  return response.json() as Promise<RuntimeConfig>;
}

export async function fetchTemplates(): Promise<TemplateSummary[]> {
  const response = await fetch(`${API_BASE}/templates`);
  if (!response.ok) {
    throw new Error(`Failed to fetch templates (${response.status}).`);
  }

  const body = (await response.json()) as { templates: TemplateSummary[] };
  return body.templates;
}

export async function fetchTemplateSchema(templateId: string): Promise<unknown> {
  const response = await fetch(`${API_BASE}/templates/${templateId}/schema`);
  if (!response.ok) {
    throw new Error(`Failed to fetch schema (${response.status}).`);
  }

  const body = (await response.json()) as { schema: unknown };
  return body.schema;
}

export async function fetchTemplateSource(
  templateId: string,
): Promise<TemplateSourceManifest> {
  const response = await fetch(`${API_BASE}/templates/${templateId}/source`);
  if (!response.ok) {
    throw new Error(`Failed to fetch source (${response.status}).`);
  }

  return response.json() as Promise<TemplateSourceManifest>;
}

export async function fetchTemplateFeatures(templateId: string): Promise<{
  templateId: string;
  features: Record<string, unknown>;
  examples: Array<{ name: string; payload: unknown; description?: string; profile?: string }>;
  plugins: string[];
}> {
  const response = await fetch(`${API_BASE}/templates/${templateId}/features`);
  if (!response.ok) {
    throw new Error(`Failed to fetch template features (${response.status}).`);
  }

  return response.json() as Promise<{
    templateId: string;
    features: Record<string, unknown>;
    examples: Array<{ name: string; payload: unknown; description?: string; profile?: string }>;
    plugins: string[];
  }>;
}

export async function preflightDocument(payload: DocumentPayload): Promise<{
  ok: boolean;
  diagnostics: {
    render: unknown;
    features: unknown[];
  };
  resolvedFeatures: Record<string, unknown>;
}> {
  const response = await fetch(`${API_BASE}/document/preflight`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(message || `Preflight request failed (${response.status}).`);
  }

  return response.json() as Promise<{
    ok: boolean;
    diagnostics: {
      render: unknown;
      features: unknown[];
    };
    resolvedFeatures: Record<string, unknown>;
  }>;
}

export async function previewDocument(payload: DocumentPayload): Promise<PreviewHtmlResponse | Blob> {
  const response = await fetch(`${API_BASE}/document/preview`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(message || `Preview request failed (${response.status}).`);
  }

  if (payload.mode === "pdf") {
    return response.blob();
  }

  return response.json() as Promise<PreviewHtmlResponse>;
}

export async function generateDocument(payload: DocumentPayload): Promise<GenerateHtmlResponse | Blob> {
  const response = await fetch(`${API_BASE}/document/generate`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const message = await readApiError(response);
    throw new Error(message || `Generate request failed (${response.status}).`);
  }

  if (payload.mode === "pdf") {
    return response.blob();
  }

  return response.json() as Promise<GenerateHtmlResponse>;
}
