import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";

import { z } from "zod";

import { AdapterRegistry } from "./adapter-registry";
import { loadDFactoryConfig } from "./config";
import { discoverTemplateCandidates } from "./discovery";
import { loadFrameworkPlugins, resolveModuleLoaderFactory } from "./runtime-resolver";
import type {
  DFactoryConfig,
  DFactoryFrameworkPlugin,
  DFactoryModuleLoaderFactory,
  DoctorCheckResult,
  LoadedTemplate,
  RegistryOptions,
  RegistryRuntimeInfo,
  RenderResult,
  RenderMode,
  TemplateAdapter,
  TemplateDetails,
  TemplateExample,
  TemplateMeta,
  TemplateModule,
  TemplatePdfFeatureOverrides,
  PdfTemplateConfig,
  TemplateRenderContext,
  TemplateModuleLoader,
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

function mergePdfTemplateConfig(
  base: PdfTemplateConfig | undefined,
  override: TemplatePdfFeatureOverrides | undefined
): PdfTemplateConfig {
  if (!base && !override) {
    return {};
  }

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
    }
  };
}

function createTemplateRenderContext(options: {
  templateId: string;
  mode: RenderMode;
  runId: string;
  profile?: string;
  features: PdfTemplateConfig;
}): TemplateRenderContext {
  return {
    runId: options.runId,
    mode: options.mode,
    profile: options.profile,
    now: new Date(),
    templateId: options.templateId,
    features: options.features,
    helpers: {
      markerClass(name) {
        switch (name) {
          case "pageBreakBefore":
            return "df-page-break-before";
          case "keepWithNext":
            return "df-keep-with-next";
          case "avoidBreak":
            return "df-avoid-break";
          default:
            return "";
        }
      }
    }
  };
}

export class DFactoryRegistry {
  private readonly cwd: string;
  private readonly configPath?: string;
  private readonly preloadedPlugins: DFactoryFrameworkPlugin[];
  private readonly preloadedModuleLoaderFactory?: DFactoryModuleLoaderFactory;

  private config!: DFactoryConfig;
  private plugins: DFactoryFrameworkPlugin[] = [];
  private adapters!: AdapterRegistry;
  private moduleLoader!: TemplateModuleLoader;
  private runtimeInfo!: RegistryRuntimeInfo;
  private templateMap = new Map<string, LoadedTemplate>();

  constructor(options: RegistryOptions) {
    this.cwd = options.cwd;
    this.configPath = options.configPath;
    this.preloadedPlugins = options.plugins ?? [];
    this.preloadedModuleLoaderFactory = options.moduleLoaderFactory;
  }

  getConfig(): DFactoryConfig {
    return this.config;
  }

  getRuntimeInfo(): RegistryRuntimeInfo {
    return this.runtimeInfo;
  }

  async initialize(): Promise<void> {
    const { config } = await loadDFactoryConfig(this.cwd, this.configPath);
    this.config = config;

    this.plugins = await loadFrameworkPlugins({
      cwd: this.cwd,
      config,
      preloaded: this.preloadedPlugins
    });

    const adapters: TemplateAdapter[] = [];
    for (const plugin of this.plugins) {
      const adapter = await plugin.createAdapter();
      if (adapter.framework !== plugin.framework) {
        throw new Error(
          `Plugin '${plugin.id}' returned adapter for '${adapter.framework}', expected '${plugin.framework}'.`
        );
      }
      adapters.push(adapter);
    }
    this.adapters = new AdapterRegistry(adapters);

    const { factory, reference } = await resolveModuleLoaderFactory({
      cwd: this.cwd,
      config,
      plugins: this.plugins,
      preloaded: this.preloadedModuleLoaderFactory
    });
    this.moduleLoader = await factory.create({
      cwd: this.cwd,
      config: this.config,
      plugins: this.plugins
    });

    this.runtimeInfo = {
      pluginIds: this.plugins.map((plugin) => plugin.id),
      frameworks: this.plugins.map((plugin) => plugin.framework),
      moduleLoader: reference
    };

    await this.refresh();
  }

  async refresh(): Promise<void> {
    const candidates = await discoverTemplateCandidates(this.cwd, this.config);
    const next = new Map<string, LoadedTemplate>();

    for (const candidate of candidates) {
      const loaded = await this.moduleLoader.load(candidate.filePath);
      const moduleExports = assertTemplateModule(loaded, candidate.filePath);
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
      schema,
      pdf: template.module.pdf,
      examples: template.module.examples
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

  getTemplatePdfConfig(templateId: string): PdfTemplateConfig {
    const template = this.getTemplate(templateId);
    return mergePdfTemplateConfig(template.module.pdf, undefined);
  }

  getTemplateExamples(templateId: string): TemplateExample[] {
    const template = this.getTemplate(templateId);
    return [...(template.module.examples ?? [])];
  }

  async runPluginDoctorChecks(): Promise<DoctorCheckResult[]> {
    const checks: DoctorCheckResult[] = [];

    for (const plugin of this.plugins) {
      if (!plugin.doctorChecks) {
        continue;
      }

      const pluginChecks = await plugin.doctorChecks({
        cwd: this.cwd,
        config: this.config
      });
      checks.push(...pluginChecks);
    }

    return checks;
  }

  async renderTemplate(
    templateId: string,
    payload: unknown,
    options?: {
      mode?: RenderMode;
      profile?: string;
      features?: TemplatePdfFeatureOverrides;
      runId?: string;
    }
  ): Promise<RenderResult> {
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

    const runId = options?.runId ?? randomUUID();
    const features = mergePdfTemplateConfig(template.module.pdf, options?.features);
    const renderContext = createTemplateRenderContext({
      templateId,
      mode: options?.mode ?? "html",
      runId,
      profile: options?.profile,
      features
    });

    const renderStart = performance.now();
    const html = await adapter.renderHtml({
      template,
      payload: parsedPayload.data,
      renderContext
    });
    const renderEnd = performance.now();

    return {
      html,
      diagnostics: {
        templateId,
        framework: template.meta.framework,
        runId,
        schemaValidationMs: validationEnd - validationStart,
        renderMs: renderEnd - renderStart
      },
      templatePdfConfig: features
    };
  }

  async buildIndex(): Promise<{ generatedAt: string; templates: TemplateSummary[] }> {
    await this.refresh();
    return {
      generatedAt: new Date().toISOString(),
      templates: this.listTemplates()
    };
  }

  async close(): Promise<void> {
    if (this.moduleLoader) {
      await this.moduleLoader.close();
    }
  }
}

export async function createRegistry(options: RegistryOptions): Promise<DFactoryRegistry> {
  const registry = new DFactoryRegistry(options);
  await registry.initialize();
  return registry;
}
