import path from "node:path";

import type {
  DFactoryConfig,
  DFactoryFrameworkPlugin,
  DFactoryModuleLoaderFactory
} from "./types";

function resolveModuleReference(cwd: string, moduleRef: string): string {
  if (moduleRef.startsWith(".")) {
    return path.resolve(cwd, moduleRef);
  }

  return moduleRef;
}

function assertFrameworkPlugin(moduleRef: string, plugin: unknown): asserts plugin is DFactoryFrameworkPlugin {
  if (!plugin || typeof plugin !== "object") {
    throw new Error(`Plugin '${moduleRef}' does not export a valid framework plugin object.`);
  }

  const candidate = plugin as Partial<DFactoryFrameworkPlugin>;
  if (!candidate.id || typeof candidate.id !== "string") {
    throw new Error(`Plugin '${moduleRef}' is missing string 'id'.`);
  }
  if (!candidate.framework || typeof candidate.framework !== "string") {
    throw new Error(`Plugin '${moduleRef}' is missing string 'framework'.`);
  }
  if (typeof candidate.createAdapter !== "function") {
    throw new Error(`Plugin '${moduleRef}' is missing function 'createAdapter'.`);
  }
}

function assertModuleLoaderFactory(moduleRef: string, factory: unknown): asserts factory is DFactoryModuleLoaderFactory {
  if (!factory || typeof factory !== "object") {
    throw new Error(`Module loader '${moduleRef}' does not export a valid loader factory object.`);
  }

  const candidate = factory as Partial<DFactoryModuleLoaderFactory>;
  if (!candidate.id || typeof candidate.id !== "string") {
    throw new Error(`Module loader '${moduleRef}' is missing string 'id'.`);
  }
  if (typeof candidate.supportsModuleTransforms !== "boolean") {
    throw new Error(`Module loader '${moduleRef}' is missing boolean 'supportsModuleTransforms'.`);
  }
  if (typeof candidate.create !== "function") {
    throw new Error(`Module loader '${moduleRef}' is missing function 'create'.`);
  }
}

async function importFrameworkPlugin(moduleRef: string): Promise<DFactoryFrameworkPlugin> {
  let imported: Record<string, unknown>;
  try {
    imported = await import(moduleRef);
  } catch (error) {
    throw new Error(
      `Failed to load framework plugin '${moduleRef}'. Install it and ensure it is resolvable from this project. Cause: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const plugin =
    imported.default ??
    imported.frameworkPlugin ??
    imported.reactFrameworkPlugin ??
    imported.vueFrameworkPlugin;

  assertFrameworkPlugin(moduleRef, plugin);
  return plugin;
}

async function importModuleLoaderFactory(moduleRef: string): Promise<DFactoryModuleLoaderFactory> {
  let imported: Record<string, unknown>;
  try {
    imported = await import(moduleRef);
  } catch (error) {
    throw new Error(
      `Failed to load module loader '${moduleRef}'. Install it and ensure it is resolvable from this project. Cause: ${error instanceof Error ? error.message : String(error)}`
    );
  }
  const factory =
    imported.default ??
    imported.moduleLoader ??
    imported.moduleLoaderFactory;

  assertModuleLoaderFactory(moduleRef, factory);
  return factory;
}

export async function loadFrameworkPlugins(options: {
  cwd: string;
  config: DFactoryConfig;
  preloaded?: DFactoryFrameworkPlugin[];
}): Promise<DFactoryFrameworkPlugin[]> {
  const plugins: DFactoryFrameworkPlugin[] = [];
  const preloadedById = new Map((options.preloaded ?? []).map((plugin) => [plugin.id, plugin]));

  for (const pluginRef of options.config.plugins) {
    const preloaded = preloadedById.get(pluginRef);
    const plugin = preloaded ?? (await importFrameworkPlugin(resolveModuleReference(options.cwd, pluginRef)));

    const hasPluginId = plugins.some((candidate) => candidate.id === plugin.id);
    if (hasPluginId) {
      continue;
    }

    const duplicateFramework = plugins.find((candidate) => candidate.framework === plugin.framework);
    if (duplicateFramework) {
      throw new Error(
        `Framework '${plugin.framework}' is provided by both '${duplicateFramework.id}' and '${plugin.id}'.`
      );
    }

    plugins.push(plugin);
  }

  return plugins;
}

function chooseModuleLoaderReference(config: DFactoryConfig, plugins: DFactoryFrameworkPlugin[]): string {
  if (config.moduleLoader) {
    return config.moduleLoader;
  }

  const needsTransforms = plugins.some((plugin) => plugin.requiresModuleTransforms);
  return needsTransforms ? "@dfactory/module-loader-vite" : "@dfactory/module-loader-bundle";
}

export async function resolveModuleLoaderFactory(options: {
  cwd: string;
  config: DFactoryConfig;
  plugins: DFactoryFrameworkPlugin[];
  preloaded?: DFactoryModuleLoaderFactory;
}): Promise<{ factory: DFactoryModuleLoaderFactory; reference: string }> {
  const reference = chooseModuleLoaderReference(options.config, options.plugins);
  const explicit = options.config.moduleLoader;

  const factory = options.preloaded?.id === reference
    ? options.preloaded
    : await importModuleLoaderFactory(resolveModuleReference(options.cwd, reference));

  const needsTransforms = options.plugins.some((plugin) => plugin.requiresModuleTransforms);
  if (needsTransforms && !factory.supportsModuleTransforms) {
    const suffix = explicit
      ? `Configured module loader '${reference}' does not support module transforms required by plugin(s).`
      : `Auto-selected module loader '${reference}' does not support module transforms required by plugin(s).`;
    throw new Error(`${suffix} Use '@dfactory/module-loader-vite' or another transform-capable loader.`);
  }

  return { factory, reference };
}
