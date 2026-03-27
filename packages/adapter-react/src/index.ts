import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

import type { TemplateAdapter } from "@dfactory/core";

export const reactAdapter: TemplateAdapter = {
  framework: "react",
  async renderHtml({ template, payload }) {
    const element = await template.module.render(payload);
    const html = renderToStaticMarkup(element as ReactElement);
    return `<!doctype html><html><head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /></head><body>${html}</body></html>`;
  }
};

export default reactAdapter;
