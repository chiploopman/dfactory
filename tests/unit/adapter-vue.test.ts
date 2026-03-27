import { describe, expect, it } from "vitest";

import { frameworkVuePlugin } from "../../packages/adapter-vue/src/index.ts";

describe("vue framework plugin", () => {
  it("exposes expected plugin metadata", async () => {
    expect(frameworkVuePlugin.id).toBe("@dfactory/framework-vue");
    expect(frameworkVuePlugin.framework).toBe("vue");
    expect(frameworkVuePlugin.requiresModuleTransforms).toBe(true);
  });

  it("creates adapter that renders full html document", async () => {
    const adapter = await frameworkVuePlugin.createAdapter();
    const html = await adapter.renderHtml({
      template: {
        module: {
          async render(payload: { customerName: string }) {
            return `Hello ${payload.customerName}`;
          }
        }
      } as never,
      payload: { customerName: "Alice" }
    });

    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("<main>Hello Alice</main>");
  });
});

