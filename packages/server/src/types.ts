import type { FastifyRequest } from "fastify";

import type { DFactoryRegistry } from "@dfactory/core";

export interface DocumentRequest {
  templateId: string;
  payload: unknown;
  mode: "html" | "pdf";
  options?: {
    pdf?: Record<string, unknown>;
    timeoutMs?: number;
  };
}

export interface AuthHookContext {
  request: FastifyRequest;
  registry: DFactoryRegistry;
}

export type AuthHook = (context: AuthHookContext) => Promise<void> | void;

export interface DFactoryServerOptions {
  cwd: string;
  configPath?: string;
  port?: number;
  host?: string;
  uiDistDir?: string;
  isProduction?: boolean;
  corsOrigins?: string[];
}
