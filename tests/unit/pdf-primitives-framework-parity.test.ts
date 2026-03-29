import { createElement } from "react";
import { h } from "vue";
import { describe, expect, it } from "vitest";

import { frameworkReactPlugin } from "../../packages/adapter-react/src/index.ts";
import { frameworkVuePlugin } from "../../packages/adapter-vue/src/index.ts";
import {
  KeepWithNext as ReactKeepWithNext,
  PageXofY as ReactPageXofY,
  PreviewOnly as ReactPreviewOnly
} from "../../packages/pdf-primitives-react/src/index.tsx";
import {
  KeepWithNext as VueKeepWithNext,
  PageXofY as VuePageXofY,
  PreviewOnly as VuePreviewOnly
} from "../../packages/pdf-primitives-vue/src/index.ts";

describe("pdf primitives framework parity", () => {
  it("renders the same keep-with-next marker class for react and vue", async () => {
    const reactAdapter = await frameworkReactPlugin.createAdapter();
    const vueAdapter = await frameworkVuePlugin.createAdapter();

    const reactHtml = await reactAdapter.renderFragment({
      template: {} as never,
      value: createElement(
        ReactKeepWithNext,
        {
          as: "section"
        },
        "React block"
      )
    });

    const vueHtml = await vueAdapter.renderFragment({
      template: {} as never,
      value: h(
        VueKeepWithNext,
        {
          as: "section"
        },
        {
          default: () => "Vue block"
        }
      )
    });

    expect(reactHtml).toContain("df-keep-with-next");
    expect(vueHtml).toContain("df-keep-with-next");
    expect(reactHtml).toContain('data-df-primitive="keep-with-next"');
    expect(vueHtml).toContain('data-df-primitive="keep-with-next"');
  });

  it("renders consistent token placeholders and preview-only semantics", async () => {
    const reactAdapter = await frameworkReactPlugin.createAdapter();
    const vueAdapter = await frameworkVuePlugin.createAdapter();

    const reactHtml = await reactAdapter.renderFragment({
      template: {} as never,
      value: createElement(
        ReactPreviewOnly,
        null,
        createElement(ReactPageXofY, null)
      )
    });

    const vueHtml = await vueAdapter.renderFragment({
      template: {} as never,
      value: h(
        VuePreviewOnly,
        null,
        {
          default: () => h(VuePageXofY)
        }
      )
    });

    expect(reactHtml).toContain("df-preview-only");
    expect(vueHtml).toContain("df-preview-only");
    expect(reactHtml).toContain("{{pageNumber}} / {{totalPages}}");
    expect(vueHtml).toContain("{{pageNumber}} / {{totalPages}}");
  });
});
