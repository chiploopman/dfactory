import { bundleRequire } from "bundle-require";

import type { DFactoryModuleLoaderFactory, TemplateModuleLoader } from "@dfactory/core";

class BundleTemplateModuleLoader implements TemplateModuleLoader {
  readonly id = "@dfactory/module-loader-bundle";

  constructor(private readonly cwd: string) {}

  async load(filePath: string): Promise<unknown> {
    const loaded = await bundleRequire({
      filepath: filePath,
      cwd: this.cwd,
      format: "esm"
    });

    return loaded.mod;
  }

  async close(): Promise<void> {
    return Promise.resolve();
  }
}

export const moduleLoader: DFactoryModuleLoaderFactory = {
  id: "@dfactory/module-loader-bundle",
  supportsModuleTransforms: false,
  async create(options) {
    return new BundleTemplateModuleLoader(options.cwd);
  }
};

export default moduleLoader;
