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
      path.join(cwd, "src/templates/invoice/template.ts"),
      `import { h } from "vue";

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
export const pdf = {
  toc: { enabled: true, maxDepth: 2, title: "Contents" }
};
export const pdfElements = {
  header: {
    template: "<div>Header {{title}}</div>"
  },
  footer: {
    render(context: { tokens: { pageNumber: string; totalPages: string } }) {
      return "<div>Footer " + context.tokens.pageNumber + " / " + context.tokens.totalPages + "</div>";
    }
  }
};

export function render(payload: { customerName: string }) {
  return h("main", null, "Hello " + payload.customerName);
}
`
    );
    await fs.writeFile(
      path.join(cwd, "src/templates/invoice/InvoiceTemplate.vue"),
      `<template><article class="invoice-shell">Invoice Vue Shell</article></template>
<style scoped>
.invoice-shell { color: #334155; }
</style>
`
    );

    app = await createDFactoryServer({
      cwd,
      configPath: "dfactory.config.ts",
      isProduction: true
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
    expect(body.html).toContain("font-family: var(--df-pdf-font-family)");
    expect(body.html).toContain("--df-pdf-font-family:");
  });

  it("generates transformed html output for vue template", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/document/generate",
      payload: {
        templateId: "invoice",
        payload: { customerName: "Alice" },
        mode: "html"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as { html: string };
    expect(body.html).toContain("Hello Alice");
    expect(body.html).toContain("font-family: var(--df-pdf-font-family)");
    expect(body.html).toContain("--df-pdf-font-family:");
  });

  it("returns source manifest for vue template folder", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/templates/invoice/source"
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      entryFile: string;
      files: Array<{
        path: string;
        status: "ready" | "skipped";
      }>;
    };
    expect(body.entryFile).toBe("template.ts");
    expect(body.files.find((file) => file.path === "template.ts")?.status).toBe(
      "ready"
    );
    expect(
      body.files.find((file) => file.path === "InvoiceTemplate.vue")?.status
    ).toBe("ready");
  });

  it("returns template features for vue template", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/templates/invoice/features"
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      features: {
        toc?: {
          enabled?: boolean;
        };
      };
      elementCapabilities: Record<
        string,
        { defined: boolean; hasRender: boolean; hasTemplate: boolean }
      >;
    };

    expect(body.features.toc?.enabled).toBe(true);
    expect(body.elementCapabilities.header.hasTemplate).toBe(true);
    expect(body.elementCapabilities.footer.hasRender).toBe(true);
  });

  it("runs preflight for vue template", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/document/preflight",
      payload: {
        templateId: "invoice",
        payload: { customerName: "Alice" },
        mode: "pdf"
      }
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      ok: boolean;
      diagnostics: {
        features: Array<{
          level?: "info" | "warn" | "error";
        }>;
      };
    };
    expect(body.ok).toBe(true);
    expect(
      body.diagnostics.features.filter((diagnostic) => diagnostic.level === "warn")
        .length
    ).toBe(0);
    expect(
      body.diagnostics.features.filter((diagnostic) => diagnostic.level === "error")
        .length
    ).toBe(0);
  });
});
