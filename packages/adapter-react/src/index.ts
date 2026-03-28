import {
  createElement,
  isValidElement,
  type ElementType,
  type ReactElement
} from "react";
import { renderToStaticMarkup } from "react-dom/server";

import type { DFactoryFrameworkPlugin } from "@dfactory/core";

function renderReactFragment(value: unknown): string {
  if (value === null || typeof value === "undefined" || typeof value === "boolean") {
    return "";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (isValidElement(value)) {
    return renderToStaticMarkup(value as ReactElement);
  }

  if (typeof value === "function" || typeof value === "object") {
    return renderToStaticMarkup(createElement(value as ElementType));
  }

  return String(value);
}

export const frameworkReactPlugin: DFactoryFrameworkPlugin = {
  id: "@dfactory/framework-react",
  framework: "react",
  async createAdapter() {
    return {
      framework: "react",
      async renderHtml({ template, payload, renderContext }) {
        const element = await template.module.render(payload, renderContext);
        const html = renderReactFragment(element);
        return `<!doctype html><html><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /></head><body>${html}</body></html>`;
      },
      async renderFragment({ value }) {
        return renderReactFragment(value);
      }
    };
  },
  requiresModuleTransforms: false
};

export default frameworkReactPlugin;
