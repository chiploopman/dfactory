import { describe, expect, it } from "vitest";

import { frameworkReactPlugin } from "../../packages/adapter-react/src/index.ts";
import { frameworkVuePlugin } from "../../packages/adapter-vue/src/index.ts";

describe("framework plugin conformance", () => {
  it("react plugin shape is valid", async () => {
    expect(frameworkReactPlugin.id).toBe("@dfactory/framework-react");
    expect(frameworkReactPlugin.framework).toBe("react");
    expect(frameworkReactPlugin.requiresModuleTransforms).toBe(false);

    const adapter = await frameworkReactPlugin.createAdapter();
    expect(adapter.framework).toBe("react");
    expect(typeof adapter.renderHtml).toBe("function");
    expect(typeof adapter.renderFragment).toBe("function");
  });

  it("vue plugin shape is valid", async () => {
    expect(frameworkVuePlugin.id).toBe("@dfactory/framework-vue");
    expect(frameworkVuePlugin.framework).toBe("vue");
    expect(frameworkVuePlugin.requiresModuleTransforms).toBe(true);
    expect(typeof frameworkVuePlugin.createModuleTransformConfig).toBe("function");

    const adapter = await frameworkVuePlugin.createAdapter();
    expect(adapter.framework).toBe("vue");
    expect(typeof adapter.renderHtml).toBe("function");
    expect(typeof adapter.renderFragment).toBe("function");
  });
});
