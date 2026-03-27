import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDFactoryServer } from "../../packages/server/src/index.ts";

let app: Awaited<ReturnType<typeof createDFactoryServer>>;
let cwd: string;

describe("server api (vue)", () => {
  beforeAll(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-server-vue-test-"));
    await fs.mkdir(path.join(cwd, "src/templates/invoice"), { recursive: true });

    await fs.writeFile(
      path.join(cwd, "dfactory.config.ts"),
      `import type { DFactoryConfig } from "@dfactory/core";

const config: DFactoryConfig = {
  templates: { globs: ["src/templates/*/template.{ts,tsx}"] },
  plugins: ["@dfactory/framework-vue"],
  moduleLoader: "@dfactory/module-loader-vite",
  auth: { mode: "apiKey", apiKeys: [] },
  ui: { exposeInProd: true, sourceInProd: true, playgroundInProd: true },
  renderer: { engine: "playwright", poolSize: 1, timeoutMs: 30000 }
};

export default config;
`
    );

    await fs.writeFile(
      path.join(cwd, "src/templates/invoice/InvoiceTemplate.vue"),
      `<script setup lang="ts">
defineProps<{
  payload: {
    customerName: string;
  };
}>();
</script>

<template>
  <main>Hello {{ payload.customerName }}</main>
</template>
`
    );

    await fs.writeFile(
      path.join(cwd, "src/templates/invoice/template.ts"),
      `import { h } from "vue";
import InvoiceTemplate from "./InvoiceTemplate.vue";

export const meta = { id: "invoice", title: "Invoice", framework: "vue", version: "1.0.0" } as const;
export const schema = {
  safeParse(value: unknown) {
    if (
      typeof value === "object" &&
      value !== null &&
      "customerName" in value &&
      typeof (value as { customerName: unknown }).customerName === "string"
    ) {
      return { success: true, data: value };
    }
    return { success: false, error: { message: "customerName is required" } };
  }
};

export function render(payload: { customerName: string }) {
  return h(InvoiceTemplate, { payload });
}
`
    );

    app = await createDFactoryServer({
      cwd,
      configPath: "dfactory.config.ts",
      isProduction: false
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it("lists vue templates", async () => {
    const response = await app.inject({ method: "GET", url: "/api/templates" });
    expect(response.statusCode).toBe(200);

    const body = response.json() as { templates: Array<{ id: string; framework: string }> };
    const template = body.templates.find((item) => item.id === "invoice");
    expect(template).toBeTruthy();
    expect(template?.framework).toBe("vue");
  });

  it("renders html preview for vue template", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/document/preview",
      payload: {
        templateId: "invoice",
        payload: { customerName: "Alice" },
        mode: "html"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { html: string };
    expect(body.html).toContain("Hello Alice");
  });

  it("returns source for vue template", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/templates/invoice/source"
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { source: string };
    expect(body.source).toContain("InvoiceTemplate.vue");
  });
});
