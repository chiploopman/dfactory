import fs from "node:fs/promises";
import path from "node:path";

import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { createRegistry } from "@dfactory/core";
import {
  createPlaywrightPdfRenderer,
  loadPdfFeaturePlugins
} from "@dfactory/renderer-playwright";
import chokidar from "chokidar";
import Fastify from "fastify";
import { z } from "zod";
import type { FSWatcher } from "chokidar";

import { authorizeRequest } from "./auth";
import type { DFactoryServerOptions, DocumentRequest } from "./types";
import type { TemplatePdfFeatureOverrides } from "@dfactory/core";

const documentRequestSchema = z.object({
  templateId: z.string().min(1),
  payload: z.unknown(),
  mode: z.enum(["html", "pdf"]),
  options: z
    .object({
      timeoutMs: z.number().int().positive().optional(),
      pdf: z.record(z.string(), z.unknown()).optional(),
      profile: z.string().optional(),
      features: z.record(z.string(), z.unknown()).optional()
    })
    .optional()
});

const preflightRequestSchema = z.object({
  templateId: z.string().min(1),
  payload: z.unknown(),
  mode: z.enum(["html", "pdf"]).optional(),
  options: z
    .object({
      timeoutMs: z.number().int().positive().optional(),
      pdf: z.record(z.string(), z.unknown()).optional(),
      profile: z.string().optional(),
      features: z.record(z.string(), z.unknown()).optional()
    })
    .optional()
});

const sourceFileResponseSchema = {
  type: "object",
  required: ["path", "status", "bytes", "entry"],
  properties: {
    path: { type: "string" },
    status: { type: "string", enum: ["ready", "skipped"] },
    content: { type: "string" },
    skipReason: { type: "string", enum: ["binary", "tooLarge", "unreadable"] },
    bytes: { type: "number" },
    entry: { type: "boolean" }
  }
} as const;

const sourceManifestResponseSchema = {
  type: "object",
  required: ["templateId", "root", "entryFile", "files"],
  properties: {
    templateId: { type: "string" },
    root: { type: "string" },
    entryFile: { type: "string" },
    files: {
      type: "array",
      items: sourceFileResponseSchema
    }
  }
} as const;

function isPayloadValidationError(error: unknown): error is Error {
  return error instanceof Error && error.message.startsWith("Payload validation failed:");
}

function deriveTemplateWatchGlobs(templateGlobs: string[]): string[] {
  const derived = templateGlobs.map((globPattern) => {
    const marker = "/*/template.";
    const markerIndex = globPattern.indexOf(marker);
    if (markerIndex === -1) {
      return globPattern;
    }

    return `${globPattern.slice(0, markerIndex)}/**/*`;
  });

  return [...new Set([...templateGlobs, ...derived])];
}

export async function createDFactoryServer(options: DFactoryServerOptions) {
  const app = Fastify({
    logger: true
  });

  const isProduction = options.isProduction ?? process.env.NODE_ENV === "production";

  const registry = await createRegistry({
    cwd: options.cwd,
    configPath: options.configPath
  });

  const config = registry.getConfig();
  const pdfFeaturePlugins = await loadPdfFeaturePlugins({
    cwd: options.cwd,
    pluginRefs: config.renderer.pdfPlugins ?? []
  });
  const renderer = createPlaywrightPdfRenderer({
    poolSize: config.renderer.poolSize,
    timeoutMs: config.renderer.timeoutMs,
    defaults: config.renderer.defaults,
    plugins: pdfFeaturePlugins
  });
  let watcher: FSWatcher | undefined;

  await app.register(cors, {
    origin: options.corsOrigins ?? true,
    credentials: true
  });

  await app.register(swagger, {
    openapi: {
      info: {
        title: "DFactory API",
        version: "0.1.0"
      }
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/api/docs"
  });

  app.addHook("onRequest", async (request, reply) => {
    if (!request.url.startsWith("/api") || request.url.startsWith("/api/health") || request.url.startsWith("/api/ready") || request.url.startsWith("/api/openapi.json") || request.url.startsWith("/api/docs")) {
      return;
    }

    const authorized = await authorizeRequest({
      request,
      reply,
      registry,
      cwd: options.cwd
    });

    if (!authorized) {
      return reply;
    }
  });

  app.get("/api/health", async () => ({
    status: "ok",
    service: "dfactory-server",
    timestamp: new Date().toISOString()
  }));

  app.get("/api/ready", async () => ({
    status: "ready",
    templates: registry.listTemplates().length,
    timestamp: new Date().toISOString()
  }));

  app.get("/api/openapi.json", async () => app.swagger());

  app.get("/api/runtime", async () => ({
    isProduction,
    runtime: registry.getRuntimeInfo(),
    pdfFeaturePlugins: pdfFeaturePlugins.map((plugin) => plugin.id),
    ui: {
      exposeInProd: config.ui.exposeInProd,
      sourceInProd: config.ui.sourceInProd,
      playgroundInProd: config.ui.playgroundInProd
    }
  }));

  if (!isProduction) {
    app.get("/", async () => ({
      status: "ok",
      service: "dfactory-api",
      message: "API server is running. In development, open the UI using the URL printed by `dfactory dev`."
    }));
  }

  app.get("/api/templates", async () => ({
    templates: registry.listTemplates()
  }));

  app.get<{ Params: { id: string } }>("/api/templates/:id", async (request, reply) => {
    try {
      const details = await registry.getTemplateDetails(request.params.id);
      return {
        id: details.id,
        meta: details.meta,
        framework: details.framework,
        filePath: details.filePath,
        schema: details.schema,
        pdf: details.pdf,
        examples: details.examples ?? []
      };
    } catch (error) {
      return reply.code(404).send({
        error: "Template not found",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get<{ Params: { id: string } }>("/api/templates/:id/schema", async (request, reply) => {
    try {
      return {
        templateId: request.params.id,
        schema: registry.getTemplateSchema(request.params.id)
      };
    } catch (error) {
      return reply.code(404).send({
        error: "Template not found",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get<{ Params: { id: string } }>("/api/templates/:id/features", async (request, reply) => {
    try {
      const template = registry.getTemplate(request.params.id);
      const features = renderer.resolveFeatures({
        templateFeatures: template.module.pdf
      });
      const elementCapabilities = registry.getTemplateElementCapabilities(request.params.id);

      return {
        templateId: request.params.id,
        features,
        elementCapabilities,
        examples: template.module.examples ?? [],
        plugins: pdfFeaturePlugins.map((plugin) => plugin.id)
      };
    } catch (error) {
      return reply.code(404).send({
        error: "Template not found",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get<{ Params: { id: string } }>(
    "/api/templates/:id/source",
    {
      schema: {
        response: {
          200: sourceManifestResponseSchema
        }
      }
    },
    async (request, reply) => {
      if (isProduction && !config.ui.sourceInProd) {
        return reply.code(403).send({
          error: "Forbidden",
          message: "Source view is disabled in production."
        });
      }

      try {
        return await registry.getTemplateSource(request.params.id);
      } catch (error) {
        return reply.code(404).send({
          error: "Template not found",
          message: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }
  );

  app.post("/api/document/preflight", async (request, reply) => {
    const parsed = preflightRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Validation error",
        message: parsed.error.message
      });
    }

    const mode = parsed.data.mode ?? "pdf";

    try {
      const rendered = await registry.renderTemplate(parsed.data.templateId, parsed.data.payload, {
        mode,
        profile: parsed.data.options?.profile,
        features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
        runId: request.id
      });

      const template = registry.getTemplate(parsed.data.templateId);
      const preflight = await renderer.preflight(rendered.html, {
        timeoutMs: parsed.data.options?.timeoutMs,
        pdf: parsed.data.options?.pdf,
        templateId: parsed.data.templateId,
        templateMeta: template.meta,
        mode,
        profile: parsed.data.options?.profile,
        payload: parsed.data.payload,
        templateFeatures: rendered.templatePdfConfig,
        features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
        templatePdfElements: rendered.templatePdfElements,
        templatePdfElementCapabilities: rendered.templatePdfElementCapabilities
      });

      return {
        ok: true,
        mode,
        templateId: parsed.data.templateId,
        diagnostics: {
          render: rendered.diagnostics,
          features: preflight.diagnostics
        },
        resolvedFeatures: preflight.resolvedFeatures,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      if (isPayloadValidationError(error)) {
        return reply.code(400).send({
          error: "Payload validation error",
          message: error.message
        });
      }

      return reply.code(500).send({
        error: "Preflight failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post<{ Body: DocumentRequest }>("/api/document/preview", async (request, reply) => {
    const parsed = documentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Validation error",
        message: parsed.error.message
      });
    }

    try {
      const rendered = await registry.renderTemplate(parsed.data.templateId, parsed.data.payload, {
        mode: parsed.data.mode,
        profile: parsed.data.options?.profile,
        features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
        runId: request.id
      });
      if (parsed.data.mode === "html") {
        const preflight = await renderer.preflight(rendered.html, {
          templateId: parsed.data.templateId,
          templateMeta: registry.getTemplate(parsed.data.templateId).meta,
          mode: parsed.data.mode,
          profile: parsed.data.options?.profile,
          payload: parsed.data.payload,
          templateFeatures: rendered.templatePdfConfig,
          features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
          templatePdfElements: rendered.templatePdfElements,
          templatePdfElementCapabilities: rendered.templatePdfElementCapabilities
        });
        return {
          mode: "html",
          templateId: parsed.data.templateId,
          html: preflight.html,
          diagnostics: rendered.diagnostics,
          featureDiagnostics: preflight.diagnostics,
          resolvedFeatures: preflight.resolvedFeatures,
          generatedAt: new Date().toISOString()
        };
      }

      const pdfResult = await renderer.htmlToPdf(rendered.html, {
        timeoutMs: parsed.data.options?.timeoutMs,
        pdf: parsed.data.options?.pdf,
        templateId: parsed.data.templateId,
        templateMeta: registry.getTemplate(parsed.data.templateId).meta,
        mode: parsed.data.mode,
        profile: parsed.data.options?.profile,
        payload: parsed.data.payload,
        templateFeatures: rendered.templatePdfConfig,
        features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
        templatePdfElements: rendered.templatePdfElements,
        templatePdfElementCapabilities: rendered.templatePdfElementCapabilities
      });

      reply.header("content-type", "application/pdf");
      reply.header("content-disposition", `inline; filename=\"${parsed.data.templateId}-preview.pdf\"`);
      return reply.send(pdfResult.pdf);
    } catch (error) {
      if (isPayloadValidationError(error)) {
        return reply.code(400).send({
          error: "Payload validation error",
          message: error.message
        });
      }

      return reply.code(500).send({
        error: "Render failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post<{ Body: DocumentRequest }>("/api/document/generate", async (request, reply) => {
    const parsed = documentRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        error: "Validation error",
        message: parsed.error.message
      });
    }

    try {
      const rendered = await registry.renderTemplate(parsed.data.templateId, parsed.data.payload, {
        mode: parsed.data.mode,
        profile: parsed.data.options?.profile,
        features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
        runId: request.id
      });

      if (parsed.data.mode === "html") {
        const preflight = await renderer.preflight(rendered.html, {
          templateId: parsed.data.templateId,
          templateMeta: registry.getTemplate(parsed.data.templateId).meta,
          mode: parsed.data.mode,
          profile: parsed.data.options?.profile,
          payload: parsed.data.payload,
          templateFeatures: rendered.templatePdfConfig,
          features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
          templatePdfElements: rendered.templatePdfElements,
          templatePdfElementCapabilities: rendered.templatePdfElementCapabilities
        });
        return {
          mode: "html",
          templateId: parsed.data.templateId,
          html: preflight.html,
          diagnostics: rendered.diagnostics,
          featureDiagnostics: preflight.diagnostics,
          resolvedFeatures: preflight.resolvedFeatures,
          generatedAt: new Date().toISOString()
        };
      }

      const pdfResult = await renderer.htmlToPdf(rendered.html, {
        timeoutMs: parsed.data.options?.timeoutMs,
        pdf: parsed.data.options?.pdf,
        templateId: parsed.data.templateId,
        templateMeta: registry.getTemplate(parsed.data.templateId).meta,
        mode: parsed.data.mode,
        profile: parsed.data.options?.profile,
        payload: parsed.data.payload,
        templateFeatures: rendered.templatePdfConfig,
        features: parsed.data.options?.features as TemplatePdfFeatureOverrides | undefined,
        templatePdfElements: rendered.templatePdfElements,
        templatePdfElementCapabilities: rendered.templatePdfElementCapabilities
      });

      reply.header("content-type", "application/pdf");
      reply.header("content-disposition", `attachment; filename=\"${parsed.data.templateId}.pdf\"`);
      return reply.send(pdfResult.pdf);
    } catch (error) {
      if (isPayloadValidationError(error)) {
        return reply.code(400).send({
          error: "Payload validation error",
          message: error.message
        });
      }

      return reply.code(500).send({
        error: "Generation failed",
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/templates/refresh", async () => {
    await registry.refresh();
    return {
      refreshed: true,
      templates: registry.listTemplates().length,
      at: new Date().toISOString()
    };
  });

  if (!isProduction) {
    watcher = chokidar.watch(config.templates.globs, {
      cwd: options.cwd,
      ignored: config.templates.ignore,
      ignoreInitial: true
    });

    watcher.add(deriveTemplateWatchGlobs(config.templates.globs));

    const refresh = async () => {
      try {
        await registry.refresh();
        app.log.info({ templates: registry.listTemplates().length }, "Template registry refreshed");
      } catch (error) {
        app.log.error({ error }, "Failed to refresh template registry");
      }
    };

    watcher.on("add", refresh).on("change", refresh).on("unlink", refresh);
  }

  if (isProduction && config.ui.exposeInProd !== false) {
    const uiDistDir = options.uiDistDir ?? path.resolve(options.cwd, ".dfactory/ui");
    try {
      await fs.access(uiDistDir);

      await app.register(fastifyStatic, {
        root: uiDistDir,
        prefix: "/"
      });

      app.get("/*", async (_, reply) => {
        return reply.sendFile("index.html");
      });
    } catch {
      app.log.warn(`UI dist directory '${uiDistDir}' not found. API will run without UI.`);
    }
  }

  app.addHook("onClose", async () => {
    if (watcher) {
      await watcher.close();
    }
    await registry.close();
    await renderer.close();
  });

  return app;
}
