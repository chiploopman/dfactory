import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { frameworkReactPlugin } from "../../packages/adapter-react/src/index.ts";
import { frameworkVuePlugin } from "../../packages/adapter-vue/src/index.ts";
import { moduleLoader as bundleLoader } from "../../packages/module-loader-bundle/src/index.ts";
import { moduleLoader as viteLoader } from "../../packages/module-loader-vite/src/index.ts";
import type { TemplateModuleLoader } from "../../packages/core/src/index.ts";

const openLoaders: TemplateModuleLoader[] = [];

afterEach(async () => {
  while (openLoaders.length > 0) {
    const loader = openLoaders.pop();
    if (loader) {
      await loader.close();
    }
  }
});

describe("module loaders", () => {
  it("bundle loader handles plain ts templates", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-loader-bundle-"));
    const modulePath = path.join(cwd, "template.ts");

    await fs.writeFile(modulePath, `export const value = 42;\n`);

    const loader = await bundleLoader.create({
      cwd,
      config: {} as never,
      plugins: []
    });
    openLoaders.push(loader);

    const mod = (await loader.load(modulePath)) as { value: number };
    expect(mod.value).toBe(42);
  });

  it("bundle loader respects nearest tsconfig for react tsx templates", async () => {
    const loader = await bundleLoader.create({
      cwd: process.cwd(),
      config: {} as never,
      plugins: []
    });
    openLoaders.push(loader);

    const modulePath = path.join(
      process.cwd(),
      "examples/react-starter/src/templates/invoice-reference/template.tsx"
    );
    const mod = (await loader.load(modulePath)) as {
      examples?: Array<{ payload: unknown }>;
      render: (
        payload: unknown,
        context?: { helpers: { markerClass: (name: string) => string } }
      ) => unknown | Promise<unknown>;
    };

    const payload = mod.examples?.[0]?.payload;
    expect(payload).toBeTruthy();

    const element = await mod.render(payload, {
      helpers: {
        markerClass: () => ""
      }
    });

    const adapter = await frameworkReactPlugin.createAdapter();
    const html = await adapter.renderFragment({ value: element });
    expect(html).toContain("Invoice");
  });

  it("vite loader resolves vue single-file component imports", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-loader-vue-"));
    const componentPath = path.join(cwd, "InvoiceTemplate.vue");
    const entryPath = path.join(cwd, "template.ts");

    await fs.writeFile(componentPath, `<template><main>Hello Vue</main></template>\n`);
    await fs.writeFile(
      entryPath,
      `import InvoiceTemplate from "./InvoiceTemplate.vue";
export const component = InvoiceTemplate;
`
    );

    const loader = await viteLoader.create({
      cwd,
      config: {} as never,
      plugins: [frameworkVuePlugin]
    });
    openLoaders.push(loader);

    const mod = (await loader.load(entryPath)) as { component: unknown };
    expect(mod.component).toBeTruthy();
  });
});
