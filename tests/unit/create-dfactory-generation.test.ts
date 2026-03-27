import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { runCreateDFactory } from "../../packages/create-dfactory/src/index.ts";

const originalArgv = [...process.argv];
const originalCwd = process.cwd();

afterEach(async () => {
  process.argv = [...originalArgv];
  process.chdir(originalCwd);
});

describe("create-dfactory generation", () => {
  it("scaffolds react plugin config and template files", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-create-react-"));
    await fs.writeFile(
      path.join(cwd, "package.json"),
      JSON.stringify(
        {
          name: "react-app",
          version: "1.0.0",
          dependencies: {
            react: "^19.1.1"
          }
        },
        null,
        2
      )
    );

    process.chdir(cwd);
    process.argv = ["node", "create-dfactory"];
    await runCreateDFactory();

    const config = await fs.readFile(path.join(cwd, "dfactory.config.ts"), "utf8");
    const template = await fs.readFile(path.join(cwd, "src/templates/invoice/template.tsx"), "utf8");
    const packageJson = JSON.parse(await fs.readFile(path.join(cwd, "package.json"), "utf8")) as {
      devDependencies?: Record<string, string>;
    };

    expect(config).toContain("\"@dfactory/framework-react\"");
    expect(config).toContain("\"@dfactory/module-loader-bundle\"");
    expect(template).toContain("framework: \"react\"");
    expect(packageJson.devDependencies?.["@dfactory/framework-react"]).toBe("latest");
    expect(packageJson.devDependencies?.["@dfactory/module-loader-bundle"]).toBe("latest");
    expect(packageJson.devDependencies?.["@dfactory/framework-vue"]).toBeUndefined();
  });

  it("scaffolds vue plugin config and template files", async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-create-vue-"));
    await fs.writeFile(
      path.join(cwd, "package.json"),
      JSON.stringify(
        {
          name: "vue-app",
          version: "1.0.0",
          dependencies: {
            vue: "^3.5.21"
          }
        },
        null,
        2
      )
    );

    process.chdir(cwd);
    process.argv = ["node", "create-dfactory"];
    await runCreateDFactory();

    const config = await fs.readFile(path.join(cwd, "dfactory.config.ts"), "utf8");
    const template = await fs.readFile(path.join(cwd, "src/templates/invoice/template.ts"), "utf8");
    const sfc = await fs.readFile(path.join(cwd, "src/templates/invoice/InvoiceTemplate.vue"), "utf8");
    const packageJson = JSON.parse(await fs.readFile(path.join(cwd, "package.json"), "utf8")) as {
      devDependencies?: Record<string, string>;
    };

    expect(config).toContain("\"@dfactory/framework-vue\"");
    expect(config).toContain("\"@dfactory/module-loader-vite\"");
    expect(template).toContain("framework: \"vue\"");
    expect(sfc).toContain("<template>");
    expect(packageJson.devDependencies?.["@dfactory/framework-vue"]).toBe("latest");
    expect(packageJson.devDependencies?.["@dfactory/module-loader-vite"]).toBe("latest");
  });
});
