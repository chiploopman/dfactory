import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_CONFIG, loadDFactoryConfig } from "../../packages/core/src/index.ts";

describe("core config", () => {
  it("loads defaults when config file is missing", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-config-test-"));
    const { config } = await loadDFactoryConfig(cwd);

    expect(config.templates.globs).toEqual(DEFAULT_CONFIG.templates.globs);
    expect(config.plugins).toContain("@dfactory/framework-react");
    expect(config.plugins).not.toContain("@dfactory/framework-vue");
    expect(config.moduleLoader).toBeUndefined();
    expect(config.renderer.engine).toBe("playwright");
    expect(config.renderer.pdfPlugins).toContain("@dfactory/pdf-feature-standard");
    expect(config.renderer.defaults?.format).toBe("A4");
  });
});
