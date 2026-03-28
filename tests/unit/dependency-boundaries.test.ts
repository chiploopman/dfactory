import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

interface PackageJson {
  dependencies?: Record<string, string>;
}

async function readPackageJson(relativePath: string): Promise<PackageJson> {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const content = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(content) as PackageJson;
}

function dependencyNames(packageJson: PackageJson): string[] {
  return Object.keys(packageJson.dependencies ?? {});
}

describe("dependency boundaries", () => {
  it("core package stays framework-agnostic", async () => {
    const packageJson = await readPackageJson("packages/core/package.json");
    const dependencies = dependencyNames(packageJson);

    expect(dependencies).not.toContain("vue");
    expect(dependencies).not.toContain("@vue/server-renderer");
    expect(dependencies).not.toContain("@vitejs/plugin-vue");
    expect(dependencies).not.toContain("vite");
    expect(dependencies).not.toContain("@dfactory/framework-react");
    expect(dependencies).not.toContain("@dfactory/framework-vue");
    expect(dependencies).not.toContain("pagedjs");
    expect(dependencies).not.toContain("pdf-lib");
  });

  it("server package does not hard-depend on framework plugins", async () => {
    const packageJson = await readPackageJson("packages/server/package.json");
    const dependencies = dependencyNames(packageJson);

    expect(dependencies).not.toContain("@dfactory/framework-react");
    expect(dependencies).not.toContain("@dfactory/framework-vue");
    expect(dependencies).not.toContain("pagedjs");
  });

  it("react starter does not include vue runtime dependencies", async () => {
    const packageJson = await readPackageJson("examples/react-starter/package.json");
    const dependencies = dependencyNames(packageJson);

    expect(dependencies).not.toContain("vue");
    expect(dependencies).not.toContain("@vue/server-renderer");
    expect(dependencies).not.toContain("@dfactory/framework-vue");
  });
});
