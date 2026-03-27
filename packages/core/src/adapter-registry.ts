import path from "node:path";

import type { DFactoryConfig, TemplateAdapter } from "./types";

export class AdapterRegistry {
  private readonly byFramework = new Map<string, TemplateAdapter>();

  constructor(adapters: TemplateAdapter[]) {
    for (const adapter of adapters) {
      this.byFramework.set(adapter.framework, adapter);
    }
  }

  get(framework: string): TemplateAdapter | undefined {
    return this.byFramework.get(framework);
  }

  list(): TemplateAdapter[] {
    return [...this.byFramework.values()];
  }
}

export async function loadAdaptersFromConfig(
  cwd: string,
  config: DFactoryConfig,
  preloaded: TemplateAdapter[] = []
): Promise<TemplateAdapter[]> {
  const adapters = [...preloaded];

  for (const adapterRef of config.adapters) {
    const isLoaded = adapters.some((adapter) => adapter.framework === adapterRef || adapterRef.includes(adapter.framework));
    if (isLoaded) {
      continue;
    }

    const resolved = adapterRef.startsWith(".")
      ? path.resolve(cwd, adapterRef)
      : adapterRef;

    const imported = await import(resolved);
    const adapter: TemplateAdapter | undefined =
      imported.default ?? imported.adapter ?? imported.reactAdapter;

    if (!adapter) {
      throw new Error(`Adapter '${adapterRef}' does not export a TemplateAdapter.`);
    }

    adapters.push(adapter);
  }

  return adapters;
}
