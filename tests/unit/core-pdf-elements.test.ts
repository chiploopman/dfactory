import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createRegistry } from "../../packages/core/src/index.ts";
import type {
  DFactoryFrameworkPlugin,
  DFactoryModuleLoaderFactory
} from "../../packages/core/src/types.ts";

const cleanupDirectories: string[] = [];

afterEach(async () => {
  while (cleanupDirectories.length > 0) {
    const directory = cleanupDirectories.pop();
    if (directory) {
      await fs.rm(directory, { recursive: true, force: true });
    }
  }
});

describe("core pdf elements", () => {
  it("binds first-class pdf element renderers with runtime metadata injection", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-core-elements-"));
    cleanupDirectories.push(cwd);

    const templatePath = path.join(cwd, "src/templates/invoice-reference/template.ts");
    await fs.mkdir(path.dirname(templatePath), { recursive: true });
    await fs.writeFile(templatePath, "export const placeholder = true;\n");

    const frameworkPlugin: DFactoryFrameworkPlugin = {
      id: "@dfactory/framework-react",
      framework: "react",
      createAdapter() {
        return {
          framework: "react",
          async renderHtml({ payload, renderContext }) {
            return `<!doctype html><html><head></head><body><h1>Invoice</h1><article data-marker="${renderContext.helpers.markerClass("avoidBreak")}">Hello ${(payload as { name: string }).name}</article></body></html>`;
          },
          async renderFragment({ template, value }) {
            return `fragment:${template.id}:${JSON.stringify(value)}`;
          }
        };
      }
    };

    const moduleLoaderFactory: DFactoryModuleLoaderFactory = {
      id: "@dfactory/module-loader-bundle",
      supportsModuleTransforms: false,
      async create() {
        return {
          id: "@dfactory/module-loader-bundle",
          async load(filePath: string) {
            if (filePath !== templatePath) {
              throw new Error(`Unexpected load path: ${filePath}`);
            }

            return {
              meta: {
                id: "invoice-reference",
                title: "Invoice Reference",
                framework: "react",
                version: "1.0.0"
              },
              schema: {
                safeParse(payload: unknown) {
                  if (
                    typeof payload === "object" &&
                    payload !== null &&
                    "name" in payload &&
                    typeof (payload as { name: unknown }).name === "string"
                  ) {
                    return { success: true, data: payload };
                  }
                  return {
                    success: false,
                    error: { message: "name is required" }
                  };
                }
              },
              pdf: {
                toc: { enabled: true, maxDepth: 2, title: "Contents" },
                pagination: { mode: "css" }
              },
              pdfElements: {
                toc: {
                  render(context: {
                    headings: Array<{ text: string }>;
                    tokens: { pageNumber: string };
                    templateId: string;
                  }) {
                    return `<nav data-headings="${context.headings.length}" data-token="${context.tokens.pageNumber}" data-template="${context.templateId}">${context.headings[0]?.text ?? ""}</nav>`;
                  }
                },
                header: {
                  render(context: {
                    runId: string;
                    profile?: string;
                    pagination: { markerClass: (name: "pageBreakBefore") => string };
                    tokens: { totalPages: string };
                  }) {
                    return {
                      type: "header",
                      runId: context.runId,
                      profile: context.profile ?? "",
                      marker: context.pagination.markerClass("pageBreakBefore"),
                      token: context.tokens.totalPages
                    };
                  }
                },
                footer: {
                  template: "<footer>{{pageNumber}} / {{totalPages}}</footer>"
                },
                watermark: {
                  render(context: { template: { title: string } }) {
                    return `<div>${context.template.title}</div>`;
                  }
                },
                pagination: {
                  template: "<div>{{pageNumber}} of {{totalPages}}</div>"
                },
                background: {
                  template: "<div class='bg-layer'>Background Layer</div>"
                },
                foreground: {
                  render() {
                    return "<div class='fg-layer'>Foreground Layer</div>";
                  }
                },
                bookmarks: {
                  template: "[{\"title\":\"Intro\",\"target\":\"#intro\"}]"
                },
                pageRules: {
                  render(context: { tokens: { pageXofY: string } }) {
                    return `@page { @bottom-center { content: \"${context.tokens.pageXofY}\"; } }`;
                  }
                }
              },
              async render(payload: { name: string }) {
                return `<main>Hello ${payload.name}</main>`;
              }
            };
          },
          async close() {}
        };
      }
    };

    const registry = await createRegistry({
      cwd,
      plugins: [frameworkPlugin],
      moduleLoaderFactory
    });

    const rendered = await registry.renderTemplate(
      "invoice-reference",
      { name: "Alice" },
      {
        mode: "pdf",
        profile: "enterprise",
        runId: "run-123"
      }
    );

    expect(rendered.html).toContain("Hello Alice");
    expect(rendered.templatePdfElementCapabilities?.header.defined).toBe(true);
    expect(rendered.templatePdfElementCapabilities?.header.hasRender).toBe(true);
    expect(rendered.templatePdfElementCapabilities?.footer.hasTemplate).toBe(true);
    expect(rendered.templatePdfElementCapabilities?.background.hasTemplate).toBe(true);
    expect(rendered.templatePdfElementCapabilities?.foreground.hasRender).toBe(true);
    expect(rendered.templatePdfElementCapabilities?.bookmarks.hasTemplate).toBe(true);
    expect(rendered.templatePdfElementCapabilities?.pageRules.hasRender).toBe(true);
    expect(rendered.templatePdfElements?.footer?.template).toContain("{{pageNumber}}");
    expect(rendered.templatePdfElements?.background?.template).toContain("Background Layer");
    expect(rendered.templatePdfElements?.bookmarks?.template).toContain("\"Intro\"");

    const tocMarkup = await rendered.templatePdfElements?.toc?.render?.({
      headings: [{ id: "intro", level: 1, text: "Introduction" }]
    });
    expect(tocMarkup).toContain("Introduction");
    expect(tocMarkup).toContain("{{pageNumber}}");
    expect(tocMarkup).toContain("invoice-reference");

    const headerMarkup = await rendered.templatePdfElements?.header?.render?.();
    expect(headerMarkup).toContain("fragment:invoice-reference");
    expect(headerMarkup).toContain("\"runId\":\"run-123\"");
    expect(headerMarkup).toContain("\"marker\":\"df-page-break-before\"");

    const pageRulesMarkup = await rendered.templatePdfElements?.pageRules?.render?.();
    expect(pageRulesMarkup).toContain("{{pageXofY}}");

    const foregroundMarkup = await rendered.templatePdfElements?.foreground?.render?.();
    expect(foregroundMarkup).toContain("Foreground Layer");

    await registry.close();
  });
});
