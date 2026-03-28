import { describe, expect, it } from "vitest";

import {
  createPlaywrightPdfRenderer,
  loadPdfFeaturePlugins
} from "@dfactory/renderer-playwright";

describe("renderer feature pipeline", () => {
  it("loads configured pdf feature plugins", async () => {
    const plugins = await loadPdfFeaturePlugins({
      cwd: process.cwd(),
      pluginRefs: ["@dfactory/pdf-feature-standard", "@dfactory/pdf-feature-pdf-lib"]
    });

    expect(plugins.map((plugin) => plugin.id)).toContain("@dfactory/pdf-feature-standard");
    expect(plugins.map((plugin) => plugin.id)).toContain("@dfactory/pdf-feature-pdf-lib");
  });

  it("merges template features with request overrides", async () => {
    const renderer = createPlaywrightPdfRenderer({
      plugins: []
    });

    const resolved = renderer.resolveFeatures({
      templateFeatures: {
        page: {
          size: "A4",
          marginsMm: {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
          }
        },
        pagination: {
          mode: "css"
        }
      },
      featuresOverride: {
        page: {
          orientation: "landscape"
        },
        pagination: {
          mode: "pagedjs"
        }
      }
    });

    expect(resolved.page?.size).toBe("A4");
    expect(resolved.page?.orientation).toBe("landscape");
    expect(resolved.pagination?.mode).toBe("pagedjs");
    await renderer.close();
  });
});
