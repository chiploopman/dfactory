import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import type { DFactoryFrameworkPlugin } from "@dfactory/core";

export const frameworkReactPlugin: DFactoryFrameworkPlugin = {
  id: "@dfactory/framework-react",
  framework: "react",
  async createAdapter() {
    return {
      framework: "react",
      async renderHtml({ template, payload, renderContext }) {
        const element = await template.module.render(payload, renderContext);
        const html = renderToStaticMarkup(element as ReactElement);
        return `<!doctype html><html><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /></head><body>${html}</body></html>`;
      }
    };
  },
  requiresModuleTransforms: false
};

export default frameworkReactPlugin;
