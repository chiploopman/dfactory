import path from "node:path";

import { createServer, normalizePath, type Alias, type PluginOption, type ViteDevServer } from "vite";

import type {
  DFactoryFrameworkPlugin,
  DFactoryModuleLoaderFactory,
  ModuleTransformAlias,
  ModuleTransformConfig,
  TemplateModuleLoader
} from "@dfactory/core";

class ViteTemplateModuleLoader implements TemplateModuleLoader {
  readonly id = "@dfactory/module-loader-vite";

  private constructor(private readonly viteServer: ViteDevServer) {}

  static async create(options: {
    cwd: string;
    plugins: DFactoryFrameworkPlugin[];
  }): Promise<ViteTemplateModuleLoader> {
    const transformConfig = await collectTransformConfig(options.plugins);

    const viteServer = await createServer({
      root: options.cwd,
      appType: "custom",
      configFile: false,
      logLevel: "error",
      optimizeDeps: {
        noDiscovery: true,
        entries: []
      },
      server: {
        middlewareMode: true,
        hmr: false,
        ws: false,
        watch: {
          ignored: ["**/*"]
        }
      },
      resolve: {
        alias: transformConfig.aliases.map(mapAlias)
      },
      plugins: transformConfig.vitePlugins as PluginOption[]
    });

    return new ViteTemplateModuleLoader(viteServer);
  }

  async load(filePath: string): Promise<unknown> {
    const id = normalizePath(path.resolve(filePath));
    const staleModule = this.viteServer.moduleGraph.getModuleById(id);
    if (staleModule) {
      this.viteServer.moduleGraph.invalidateModule(staleModule);
    }

    const loaded = await this.viteServer.ssrLoadModule(id);
    return (loaded as { default?: unknown }).default ?? loaded;
  }

  async close(): Promise<void> {
    await this.viteServer.close();
  }
}

function mapAlias(alias: ModuleTransformAlias): Alias {
  return {
    find: alias.find,
    replacement: alias.replacement
  };
}

async function collectTransformConfig(plugins: DFactoryFrameworkPlugin[]): Promise<Required<ModuleTransformConfig>> {
  const aliases: ModuleTransformAlias[] = [];
  const vitePlugins: unknown[] = [];

  for (const plugin of plugins) {
    if (!plugin.createModuleTransformConfig) {
      continue;
    }

    const config = await plugin.createModuleTransformConfig();
    if (config.aliases) {
      aliases.push(...config.aliases);
    }
    if (config.vitePlugins) {
      vitePlugins.push(...config.vitePlugins);
    }
  }

  return {
    aliases,
    vitePlugins
  };
}

export const moduleLoader: DFactoryModuleLoaderFactory = {
  id: "@dfactory/module-loader-vite",
  supportsModuleTransforms: true,
  async create(options) {
    return ViteTemplateModuleLoader.create({
      cwd: options.cwd,
      plugins: options.plugins
    });
  }
};

export default moduleLoader;
