import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDFactoryServer } from "../../packages/server/src/index.ts";

let app: Awaited<ReturnType<typeof createDFactoryServer>>;
let cwd: string;

describe("server api", () => {
  beforeAll(async () => {
    cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-server-test-"));
    await fs.mkdir(path.join(cwd, "src/templates/invoice"), { recursive: true });

    await fs.writeFile(
      path.join(cwd, "dfactory.config.ts"),
      `import type { DFactoryConfig } from "@dfactory/core";

const config: DFactoryConfig = {
  templates: { globs: ["src/templates/*/template.{ts,tsx}"] },
  plugins: ["@dfactory/framework-react"],
  moduleLoader: "@dfactory/module-loader-bundle",
  auth: { mode: "apiKey", apiKeys: [] },
  ui: { exposeInProd: true, sourceInProd: true, playgroundInProd: true },
  renderer: { engine: "playwright", poolSize: 1, timeoutMs: 30000 }
};

export default config;
`
    );

    await fs.writeFile(
      path.join(cwd, "src/templates/invoice/template.tsx"),
      `export const meta = { id: "invoice", title: "Invoice", framework: "react", version: "1.0.0" } as const;
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
  },
  toc: {
    render(context: { headings: Array<{ text: string }> }) {
      return "<nav data-first-class-toc='true'>" + (context.headings[0]?.text ?? "") + "</nav>";
    }
  }
};
export function render(payload: { customerName: string }) {
  return "Hello " + payload.customerName;
}
`
    );
    await fs.mkdir(path.join(cwd, "src/templates/invoice/partials"), {
      recursive: true
    });
    await fs.mkdir(path.join(cwd, "src/templates/invoice/assets"), {
      recursive: true
    });
    await fs.writeFile(
      path.join(cwd, "src/templates/invoice/partials/summary.ts"),
      `export const summaryTitle = "Invoice Summary";\n`
    );
    await fs.writeFile(
      path.join(cwd, "src/templates/invoice/assets/logo.bin"),
      Buffer.from([0, 159, 146, 150, 0, 255, 1, 2, 3])
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

  it("lists templates", async () => {
    const response = await app.inject({ method: "GET", url: "/api/templates" });
    expect(response.statusCode).toBe(200);

    const body = response.json() as { templates: Array<{ id: string }> };
    expect(body.templates.some((template) => template.id === "invoice")).toBe(true);
  });

  it("renders html preview", async () => {
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

  it("generates transformed html output", async () => {
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

  it("returns recursive source manifest with skipped binary files", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/templates/invoice/source"
    });

    expect(response.statusCode).toBe(200);
    const body = response.json() as {
      templateId: string;
      entryFile: string;
      files: Array<{
        path: string;
        status: "ready" | "skipped";
        skipReason?: "binary" | "tooLarge" | "unreadable";
      }>;
    };

    expect(body.templateId).toBe("invoice");
    expect(body.entryFile).toBe("template.tsx");
    expect(body.files.some((file) => file.path === "template.tsx")).toBe(true);
    expect(body.files.some((file) => file.path === "partials/summary.ts")).toBe(true);
    expect(body.files.find((file) => file.path === "template.tsx")?.status).toBe("ready");
    expect(body.files.find((file) => file.path === "assets/logo.bin")?.status).toBe("skipped");
    expect(body.files.find((file) => file.path === "assets/logo.bin")?.skipReason).toBe("binary");
  });

  it("returns template feature capabilities", async () => {
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
      plugins: string[];
    };

    expect(body.features.toc?.enabled).toBe(true);
    expect(body.elementCapabilities.header.hasTemplate).toBe(true);
    expect(body.elementCapabilities.footer.hasRender).toBe(true);
    expect(body.elementCapabilities.toc.defined).toBe(true);
    expect(body.plugins).toContain("@dfactory/pdf-feature-standard");
  });

  it("runs preflight for valid payload", async () => {
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
      resolvedFeatures: {
        toc?: { enabled?: boolean };
      };
    };
    expect(body.ok).toBe(true);
    expect(body.resolvedFeatures.toc?.enabled).toBe(true);
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
