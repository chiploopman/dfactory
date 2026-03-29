import fs from "node:fs/promises";
import path from "node:path";

import { bundleRequire } from "bundle-require";

import type { DFactoryModuleLoaderFactory, TemplateModuleLoader } from "@dfactory/core";

async function resolveNearestTsconfig(filePath: string): Promise<string | undefined> {
  let directory = path.dirname(path.resolve(filePath));
  const filesystemRoot = path.parse(directory).root;

  while (true) {
    const candidate = path.join(directory, "tsconfig.json");
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // keep traversing until filesystem root
    }

    if (directory === filesystemRoot) {
      return undefined;
    }

    directory = path.dirname(directory);
  }
}

class BundleTemplateModuleLoader implements TemplateModuleLoader {
  readonly id = "@dfactory/module-loader-bundle";

  constructor(private readonly cwd: string) {}

  async load(filePath: string): Promise<unknown> {
    const tsconfig = await resolveNearestTsconfig(filePath);
    const loaded = await bundleRequire({
      filepath: filePath,
      cwd: this.cwd,
      format: "esm",
      tsconfig
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
