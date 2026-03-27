import fs from "node:fs/promises";
import { performance } from "node:perf_hooks";

import { bundleRequire } from "bundle-require";
import { z } from "zod";

import { AdapterRegistry, loadAdaptersFromConfig } from "./adapter-registry";
import { loadDFactoryConfig } from "./config";
import { discoverTemplateCandidates } from "./discovery";
import type {
  DFactoryConfig,
  LoadedTemplate,
  RegistryOptions,
  RenderResult,
  TemplateAdapter,
  TemplateDetails,
  TemplateMeta,
  TemplateModule,
  TemplateSummary
} from "./types";
import { inferTemplateId } from "./utils";

const templateMetaSchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  framework: z.string(),
  version: z.string(),
  tags: z.array(z.string()).optional()
});

function assertTemplateModule(value: unknown, filePath: string): TemplateModule {
  const record = value as Partial<TemplateModule>;

  if (!record || typeof record !== "object") {
    throw new Error(`Template module at ${filePath} must export an object module.`);
  }
  if (!record.meta) {
    throw new Error(`Template module at ${filePath} is missing 'meta' export.`);
  }
  if (!record.schema) {
    throw new Error(`Template module at ${filePath} is missing 'schema' export.`);
  }
  if (typeof record.render !== "function") {
    throw new Error(`Template module at ${filePath} is missing 'render(payload)' export.`);
  }

  return record as TemplateModule;
}

export class DFactoryRegistry {
  private readonly cwd: string;
  private readonly configPath?: string;
  private readonly preloadedAdapters: TemplateAdapter[];

  private config!: DFactoryConfig;
  private adapters!: AdapterRegistry;
  private templateMap = new Map<string, LoadedTemplate>();

  constructor(options: RegistryOptions) {
    this.cwd = options.cwd;
    this.configPath = options.configPath;
    this.preloadedAdapters = options.adapters ?? [];
  }

  getConfig(): DFactoryConfig {
    return this.config;
  }

  async initialize(): Promise<void> {
    const { config } = await loadDFactoryConfig(this.cwd, this.configPath);
    this.config = config;

    const adapters = await loadAdaptersFromConfig(this.cwd, config, this.preloadedAdapters);
    this.adapters = new AdapterRegistry(adapters);

    await this.refresh();
  }

  async refresh(): Promise<void> {
    const candidates = await discoverTemplateCandidates(this.cwd, this.config);
    const next = new Map<string, LoadedTemplate>();

    for (const candidate of candidates) {
      const loaded = await bundleRequire<TemplateModule>({
        filepath: candidate.filePath,
        cwd: this.cwd,
        format: "esm"
      });

      const moduleExports = assertTemplateModule(loaded.mod, candidate.filePath);
      const parsedMeta = templateMetaSchema.parse(moduleExports.meta);
      const id = parsedMeta.id ?? inferTemplateId(candidate.filePath);
      const meta: TemplateMeta = { ...parsedMeta, id };

      const template: LoadedTemplate = {
        id,
        filePath: candidate.filePath,
        directory: candidate.directory,
        meta,
        schema: moduleExports.schema,
        module: moduleExports
      };

      next.set(id, template);
    }

    this.templateMap = next;
  }

  listTemplates(): TemplateSummary[] {
    return [...this.templateMap.values()].map((template) => ({
      id: template.id,
      filePath: template.filePath,
      meta: template.meta,
      framework: template.meta.framework
    }));
  }

  getTemplate(templateId: string): LoadedTemplate {
    const template = this.templateMap.get(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found.`);
    }

    return template;
  }

  async getTemplateDetails(templateId: string): Promise<TemplateDetails> {
    const template = this.getTemplate(templateId);
    const source = await fs.readFile(template.filePath, "utf8");
    const schema = z.toJSONSchema(template.schema) as TemplateDetails["schema"];

    return {
      id: template.id,
      filePath: template.filePath,
      meta: template.meta,
      framework: template.meta.framework,
      source,
      schema
    };
  }

  getTemplateSchema(templateId: string): TemplateDetails["schema"] {
    const template = this.getTemplate(templateId);
    return z.toJSONSchema(template.schema) as TemplateDetails["schema"];
  }

  async getTemplateSource(templateId: string): Promise<string> {
    const template = this.getTemplate(templateId);
    return fs.readFile(template.filePath, "utf8");
  }

  async renderTemplate(templateId: string, payload: unknown): Promise<RenderResult> {
    const template = this.getTemplate(templateId);

    const validationStart = performance.now();
    const parsedPayload = template.schema.safeParse(payload);
    const validationEnd = performance.now();

    if (!parsedPayload.success) {
      throw new Error(`Payload validation failed: ${parsedPayload.error.message}`);
    }

    const adapter = this.adapters.get(template.meta.framework);
    if (!adapter) {
      throw new Error(`No adapter registered for framework '${template.meta.framework}'.`);
    }

    const renderStart = performance.now();
    const html = await adapter.renderHtml({
      template,
      payload: parsedPayload.data
    });
    const renderEnd = performance.now();

    return {
      html,
      diagnostics: {
        templateId,
        framework: template.meta.framework,
        schemaValidationMs: validationEnd - validationStart,
        renderMs: renderEnd - renderStart
      }
    };
  }

  async buildIndex(): Promise<{ generatedAt: string; templates: TemplateSummary[] }> {
    await this.refresh();
    return {
      generatedAt: new Date().toISOString(),
      templates: this.listTemplates()
    };
  }
}

export async function createRegistry(options: RegistryOptions): Promise<DFactoryRegistry> {
  const registry = new DFactoryRegistry(options);
  await registry.initialize();
  return registry;
}
