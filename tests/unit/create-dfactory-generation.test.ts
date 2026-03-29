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
    const referenceTemplate = await fs.readFile(
      path.join(cwd, "src/templates/invoice-reference/template.tsx"),
      "utf8"
    );
    const packageJson = JSON.parse(await fs.readFile(path.join(cwd, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(config).toContain("\"@dfactory/framework-react\"");
    expect(config).toContain("\"@dfactory/module-loader-bundle\"");
    expect(config).toContain("\"@dfactory/pdf-feature-standard\"");
    expect(template).toContain("framework: \"react\"");
    expect(template).toContain("defineTemplate");
    expect(referenceTemplate).toContain("id: \"invoice-reference\"");
    expect(referenceTemplate).toContain("pdfElements");
    expect(packageJson.dependencies?.["@dfactory/framework-react"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/module-loader-bundle"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-primitives-core"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-primitives-react"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-feature-standard"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/template-kit"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/framework-vue"]).toBeUndefined();
    expect(packageJson.dependencies?.["@dfactory/pdf-primitives-vue"]).toBeUndefined();
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
    const referenceTemplate = await fs.readFile(
      path.join(cwd, "src/templates/invoice-reference/template.ts"),
      "utf8"
    );
    const sfc = await fs.readFile(path.join(cwd, "src/templates/invoice/InvoiceTemplate.vue"), "utf8");
    const referenceSfc = await fs.readFile(
      path.join(cwd, "src/templates/invoice-reference/components/InvoiceReferenceDocument.vue"),
      "utf8"
    );
    const packageJson = JSON.parse(await fs.readFile(path.join(cwd, "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
    };

    expect(config).toContain("\"@dfactory/framework-vue\"");
    expect(config).toContain("\"@dfactory/module-loader-vite\"");
    expect(config).toContain("\"@dfactory/pdf-feature-standard\"");
    expect(template).toContain("framework: \"vue\"");
    expect(template).toContain("defineTemplate");
    expect(referenceTemplate).toContain("id: \"invoice-reference\"");
    expect(referenceTemplate).toContain("pdfElements");
    expect(sfc).toContain("<template>");
    expect(referenceSfc).toContain("<template>");
    expect(packageJson.dependencies?.["@dfactory/framework-vue"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/module-loader-vite"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-primitives-core"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-primitives-vue"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-feature-standard"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/template-kit"]).toBe("latest");
    expect(packageJson.dependencies?.["@dfactory/pdf-primitives-react"]).toBeUndefined();
  });
});
