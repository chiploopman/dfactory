import type { TemplateAdapter } from "./types";

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
