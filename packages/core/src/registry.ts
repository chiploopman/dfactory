import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import path from "node:path";

import { z } from "zod";

import { AdapterRegistry } from "./adapter-registry";
import { loadDFactoryConfig } from "./config";
import { discoverTemplateCandidates } from "./discovery";
import { loadFrameworkPlugins, resolveModuleLoaderFactory } from "./runtime-resolver";
import {
  collectTemplateSourceFiles,
  DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES
} from "./source-manifest";
import { PDF_TEMPLATE_ELEMENT_NAMES } from "./types";
import type {
  DFactoryConfig,
  DFactoryFrameworkPlugin,
  DFactoryModuleLoaderFactory,
  DoctorCheckResult,
  LoadedTemplate,
  PdfMarkerName,
  PdfTemplateElementName,
  RegistryOptions,
  RegistryRuntimeInfo,
  ResolvedTemplatePdfElements,
  RenderResult,
  RenderMode,
  TemplateAdapter,
  TemplateDetails,
  TemplateExample,
  TemplateMeta,
  TemplateModule,
  TemplateModuleLoader,
  TemplatePdfElementContext,
  TemplatePdfElementRenderRuntime,
  TemplatePdfElementCapabilities,
  TemplatePdfElements,
  TemplatePdfFeatureOverrides,
  TemplateRenderContext,
  TemplateSourceManifest,
  PdfTemplateConfig,
  TemplateTokenHelpers,
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

const MARKER_CLASS_MAP: Record<PdfMarkerName, string> = {
  pageBreakBefore: "df-page-break-before",
  pageBreakAfter: "df-page-break-after",
  keepWithNext: "df-keep-with-next",
  keepTogether: "df-keep-together",
  avoidBreak: "df-avoid-break",
  avoidBreakInside: "df-avoid-break-inside",
  startOnLeftPage: "df-start-on-left-page",
  startOnRightPage: "df-start-on-right-page",
  startOnRecto: "df-start-on-recto",
  startOnVerso: "df-start-on-verso",
  pageGroup: "df-page-group"
};

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

function createTemplateRenderContext(options: {
  templateId: string;
  mode: RenderMode;
  runId: string;
  profile?: string;
  features: PdfTemplateConfig;
}): TemplateRenderContext {
  const now = new Date();
  return {
    runId: options.runId,
    mode: options.mode,
    profile: options.profile,
    now,
    templateId: options.templateId,
    features: options.features,
    helpers: {
      markerClass(name) {
        return MARKER_CLASS_MAP[name] ?? "";
      },
      markers: {
        ...MARKER_CLASS_MAP
      }
    }
  };
}

function createTokenHelpers(options: {
  templateId: string;
  title?: string;
  now: Date;
}): TemplateTokenHelpers {
  const tokenValues = {
    pageNumber: "{{pageNumber}}",
    totalPages: "{{totalPages}}",
    pageXofY: "{{pageXofY}}",
    date: "{{date}}",
    title: "{{title}}",
    templateId: "{{templateId}}"
  };

  const resolve = (extraTokens?: Record<string, string>): Record<string, string> => ({
    [tokenValues.pageNumber]: `<span class="pageNumber"></span>`,
    [tokenValues.totalPages]: `<span class="totalPages"></span>`,
    [tokenValues.pageXofY]: `<span class="pageNumber"></span> / <span class="totalPages"></span>`,
    [tokenValues.date]: options.now.toISOString(),
    [tokenValues.title]: options.title ?? "",
    [tokenValues.templateId]: options.templateId,
    ...(extraTokens ?? {})
  });

  return {
    ...tokenValues,
    resolve,
    apply(template, extraTokens) {
      const replacements = resolve(extraTokens);
      let output = template;
      for (const [token, value] of Object.entries(replacements)) {
        output = output.replaceAll(token, value);
      }
      return output;
    }
  };
}

function createTemplatePdfElementCapabilities(
  pdfElements: TemplatePdfElements | undefined
): TemplatePdfElementCapabilities {
  const capabilities = {} as TemplatePdfElementCapabilities;
  for (const elementName of PDF_TEMPLATE_ELEMENT_NAMES) {
    const definition = pdfElements?.[elementName];
    capabilities[elementName] = {
      defined: Boolean(definition),
      hasRender: typeof definition?.render === "function",
      hasTemplate:
        typeof definition?.template === "string" &&
        definition.template.trim().length > 0
    };
  }
  return capabilities;
}

function createResolvedTemplatePdfElements(options: {
  template: LoadedTemplate;
  adapter: TemplateAdapter;
  payload: unknown;
  renderContext: TemplateRenderContext;
  features: PdfTemplateConfig;
}): {
  elements: ResolvedTemplatePdfElements;
  capabilities: TemplatePdfElementCapabilities;
} {
  const pdfElements = options.template.module.pdfElements;
  const capabilities = createTemplatePdfElementCapabilities(pdfElements);
  const elements: ResolvedTemplatePdfElements = {};

  if (!pdfElements) {
    return { elements, capabilities };
  }

  const tokenHelpers = createTokenHelpers({
    templateId: options.template.id,
    title: options.template.meta.title,
    now: options.renderContext.now
  });

  const paginationHelpers = {
    markerClass(name: PdfMarkerName) {
      return MARKER_CLASS_MAP[name] ?? "";
    },
    markers: {
      ...MARKER_CLASS_MAP
    }
  };

  for (const elementName of PDF_TEMPLATE_ELEMENT_NAMES) {
    const definition = pdfElements[elementName];
    if (!definition) {
      continue;
    }

    const resolvedElement: ResolvedTemplatePdfElements[PdfTemplateElementName] = {
      template:
        typeof definition.template === "string" &&
        definition.template.trim().length > 0
          ? definition.template
          : undefined
    };

    const renderElement = definition.render;
    if (typeof renderElement === "function") {
      resolvedElement.render = async (
        runtime?: TemplatePdfElementRenderRuntime
      ) => {
        const elementContext: TemplatePdfElementContext = {
          element: elementName,
          runId: options.renderContext.runId,
          mode: options.renderContext.mode,
          profile: options.renderContext.profile,
          now: options.renderContext.now,
          templateId: options.template.id,
          template: options.template.meta,
          payload: options.payload,
          features: options.features,
          headings: runtime?.headings ?? [],
          tokens: tokenHelpers,
          pagination: paginationHelpers
        };

        const output = await renderElement(elementContext);
        if (typeof output === "undefined" || output === null) {
          return undefined;
        }
        if (typeof output === "string") {
          return output;
        }
        return options.adapter.renderFragment({
          template: options.template,
          value: output
        });
      };
    }

    elements[elementName] = resolvedElement;
  }

  return { elements, capabilities };
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

  async getTemplateSource(templateId: string): Promise<TemplateSourceManifest> {
    const template = this.getTemplate(templateId);
    const sourceManifest = await collectTemplateSourceFiles({
      rootDir: template.directory,
      entryFilePath: template.filePath,
      maxFileBytes: DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES
    });

    return {
      templateId,
      root: path.relative(this.cwd, template.directory).split(path.sep).join("/"),
      entryFile: sourceManifest.entryFile,
      files: sourceManifest.files
    };
  }

  getTemplatePdfConfig(templateId: string): PdfTemplateConfig {
    const template = this.getTemplate(templateId);
    return mergePdfTemplateConfig(template.module.pdf, undefined);
  }

  getTemplateElementCapabilities(templateId: string): TemplatePdfElementCapabilities {
    const template = this.getTemplate(templateId);
    return createTemplatePdfElementCapabilities(template.module.pdfElements);
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
    const { elements: templatePdfElements, capabilities: templatePdfElementCapabilities } =
      createResolvedTemplatePdfElements({
        template,
        adapter,
        payload: parsedPayload.data,
        renderContext,
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
      templatePdfConfig: features,
      templatePdfElements,
      templatePdfElementCapabilities
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
