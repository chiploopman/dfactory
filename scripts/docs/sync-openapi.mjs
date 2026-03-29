import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createDFactoryServer } from "@dfactory/server";

const cwd = process.cwd();
const outputPath = path.resolve(
  cwd,
  "apps/docs/content/openapi/dfactory.openapi.json",
);
const configPath = path.resolve(cwd, process.env.DFACTORY_DOCS_CONFIG ?? "dfactory.config.ts");

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortJson(nested)]),
    );
  }

  return value;
}

const app = await createDFactoryServer({
  cwd,
  configPath,
  port: 0,
  host: "127.0.0.1",
  isProduction: true,
  uiDistDir: path.resolve(cwd, ".dfactory/ui"),
});

try {
  await app.ready();
  const spec = app.swagger();
  const sorted = sortJson(spec);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");

  console.log(`OpenAPI snapshot written to ${outputPath}`);
} finally {
  await app.close();
}
