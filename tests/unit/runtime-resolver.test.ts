import { describe, expect, it } from "vitest";

import { resolveModuleLoaderFactory } from "../../packages/core/src/runtime-resolver.ts";
import type {
  DFactoryConfig,
  DFactoryFrameworkPlugin,
  DFactoryModuleLoaderFactory,
  TemplateAdapter
} from "../../packages/core/src/types.ts";

const dummyAdapter: TemplateAdapter = {
  framework: "react",
  async renderHtml() {
    return "";
  }
};

function configWith(overrides: Partial<DFactoryConfig>): DFactoryConfig {
  return {
    templates: { globs: [], ignore: [], compatibilityGlobEnabled: false },
    plugins: [],
    moduleLoader: undefined,
    auth: { mode: "apiKey", apiKeys: [] },
    ui: { exposeInProd: true, sourceInProd: false, playgroundInProd: false },
    renderer: { engine: "playwright", poolSize: 1, timeoutMs: 1000 },
    ...overrides
  };
}

describe("runtime resolver", () => {
  it("auto-selects bundle loader when no plugin requires transforms", async () => {
    const plugin: DFactoryFrameworkPlugin = {
      id: "@dfactory/framework-react",
      framework: "react",
      async createAdapter() {
        return dummyAdapter;
      }
    };

    const preloadedFactory: DFactoryModuleLoaderFactory = {
      id: "@dfactory/module-loader-bundle",
      supportsModuleTransforms: false,
      async create() {
        return { id: "bundle", async load() { return {}; }, async close() {} };
      }
    };

    const resolved = await resolveModuleLoaderFactory({
      cwd: process.cwd(),
      config: configWith({ plugins: [plugin.id] }),
      plugins: [plugin],
      preloaded: preloadedFactory
    });

    expect(resolved.reference).toBe("@dfactory/module-loader-bundle");
    expect(resolved.factory.id).toBe("@dfactory/module-loader-bundle");
  });

  it("requires transform-capable loader for transform plugins", async () => {
    const plugin: DFactoryFrameworkPlugin = {
      id: "@dfactory/framework-vue",
      framework: "vue",
      requiresModuleTransforms: true,
      async createAdapter() {
        return { ...dummyAdapter, framework: "vue" };
      }
    };

    const preloadedFactory: DFactoryModuleLoaderFactory = {
      id: "@dfactory/module-loader-bundle",
      supportsModuleTransforms: false,
      async create() {
        return { id: "bundle", async load() { return {}; }, async close() {} };
      }
    };

    await expect(
      resolveModuleLoaderFactory({
        cwd: process.cwd(),
        config: configWith({
          plugins: [plugin.id],
          moduleLoader: "@dfactory/module-loader-bundle"
        }),
        plugins: [plugin],
        preloaded: preloadedFactory
      })
    ).rejects.toThrow("does not support module transforms");
  });
});

