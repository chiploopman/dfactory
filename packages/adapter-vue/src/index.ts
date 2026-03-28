import path from "node:path";
import { createRequire } from "node:module";

import { renderToString } from "@vue/server-renderer";
import vue from "@vitejs/plugin-vue";
import { createSSRApp, h, isVNode, type Component, type VNode } from "vue";

import type {
  DFactoryFrameworkPlugin,
  ModuleTransformConfig
} from "@dfactory/core";

const require = createRequire(import.meta.url);
const vuePackageRoot = path.dirname(require.resolve("vue/package.json"));
const vueServerRendererPackageRoot = path.dirname(require.resolve("@vue/server-renderer/package.json"));

type RenderedOutput = VNode | Component | string | number | boolean | null | undefined;

function isComponent(value: unknown): value is Component {
  if (!value) {
    return false;
  }

  return typeof value === "function" || typeof value === "object";
}

function normalizeRenderedOutput(value: RenderedOutput): VNode {
  if (isVNode(value)) {
    return value;
  }

  if (isComponent(value)) {
    return h(value);
  }

  if (value === null || typeof value === "undefined") {
    return h("main");
  }

  return h("main", String(value));
}

function createVueTransformConfig(): ModuleTransformConfig {
  return {
    aliases: [
      {
        find: /^vue$/,
        replacement: path.resolve(vuePackageRoot, "dist/vue.runtime.esm-bundler.js")
      },
      {
        find: /^vue\/server-renderer$/,
        replacement: path.resolve(vueServerRendererPackageRoot, "dist/server-renderer.esm-bundler.js")
      }
    ],
    vitePlugins: [vue()]
  };
}

export const frameworkVuePlugin: DFactoryFrameworkPlugin = {
  id: "@dfactory/framework-vue",
  framework: "vue",
  async createAdapter() {
    return {
      framework: "vue",
      async renderHtml({ template, payload, renderContext }) {
        const rendered = (await template.module.render(payload, renderContext)) as RenderedOutput;

        const app = createSSRApp({
          render: () => normalizeRenderedOutput(rendered)
        });

        const html = await renderToString(app);
        return `<!doctype html><html><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /></head><body>${html}</body></html>`;
      }
    };
  },
  requiresModuleTransforms: true,
  createModuleTransformConfig: createVueTransformConfig
};

export default frameworkVuePlugin;
