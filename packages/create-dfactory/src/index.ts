#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

import pc from "picocolors";

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

async function readJson<T>(filePath: string): Promise<T | undefined> {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  } catch {
    return undefined;
  }
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function detectPackageManager(): "pnpm" | "yarn" | "npm" {
  const userAgent = process.env.npm_config_user_agent ?? "";
  if (userAgent.includes("pnpm")) {
    return "pnpm";
  }
  if (userAgent.includes("yarn")) {
    return "yarn";
  }
  return "npm";
}

async function ensureFile(filePath: string, contents: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contents);
  }
}

async function run() {
  const targetArg = process.argv[2];
  const cwd = targetArg ? path.resolve(process.cwd(), targetArg) : process.cwd();

  await fs.mkdir(cwd, { recursive: true });

  const packageJsonPath = path.resolve(cwd, "package.json");
  const existing = (await readJson<PackageJson>(packageJsonPath)) ?? {
    name: path.basename(cwd),
    version: "0.1.0"
  };

  const next: PackageJson = {
    ...existing,
    scripts: {
      ...existing.scripts,
      "dfactory:dev": "dfactory dev",
      "dfactory:build": "dfactory build",
      "dfactory:serve": "dfactory serve",
      "dfactory:index": "dfactory index",
      "dfactory:doctor": "dfactory doctor"
    },
    devDependencies: {
      ...existing.devDependencies,
      "@dfactory/cli": "latest",
      "@dfactory/core": "latest",
      "@dfactory/adapter-react": "latest"
    }
  };

  await writeJson(packageJsonPath, next);

  await ensureFile(
    path.resolve(cwd, "dfactory.config.ts"),
    `import type { DFactoryConfig } from "@dfactory/core";

const config: DFactoryConfig = {
  templates: {
    globs: ["src/templates/*/template.{ts,tsx,js,jsx,mts,mtsx}"],
    compatibilityGlobEnabled: false
  },
  adapters: ["@dfactory/adapter-react"],
  auth: {
    mode: "apiKey",
    apiKeys: []
  },
  ui: {
    exposeInProd: true,
    sourceInProd: false,
    playgroundInProd: false
  },
  renderer: {
    engine: "playwright",
    poolSize: 4,
    timeoutMs: 30000
  }
};

export default config;
`
  );

  await ensureFile(
    path.resolve(cwd, "src/templates/invoice/template.tsx"),
    `import * as React from "react";
import { z } from "zod";

export const meta = {
  id: "invoice",
  title: "Invoice",
  description: "Default starter invoice template",
  framework: "react",
  version: "1.0.0",
  tags: ["billing", "starter"]
} as const;

export const schema = z.object({
  invoiceNumber: z.string(),
  customerName: z.string(),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number(),
      price: z.number()
    })
  )
});

type Payload = z.infer<typeof schema>;

export function render(payload: Payload): React.ReactElement {
  const total = payload.items.reduce((sum, item) => sum + item.qty * item.price, 0);

  return (
    <main style={{ fontFamily: "Inter, sans-serif", padding: "24px" }}>
      <h1 style={{ marginBottom: "8px" }}>Invoice {payload.invoiceNumber}</h1>
      <p style={{ color: "#555", marginTop: 0 }}>Customer: {payload.customerName}</p>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "20px" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "8px" }}>Item</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Qty</th>
            <th style={{ textAlign: "right", borderBottom: "1px solid #ddd", padding: "8px" }}>Price</th>
          </tr>
        </thead>
        <tbody>
          {payload.items.map((item) => (
            <tr key={item.name}>
              <td style={{ borderBottom: "1px solid #eee", padding: "8px" }}>{item.name}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "8px" }}>{item.qty}</td>
              <td style={{ textAlign: "right", borderBottom: "1px solid #eee", padding: "8px" }}>
                \${(item.price * item.qty).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p style={{ textAlign: "right", marginTop: "16px", fontWeight: 700 }}>Total: \${total.toFixed(2)}</p>
    </main>
  );
}
`
  );

  const packageManager = detectPackageManager();
  const installCmd =
    packageManager === "pnpm"
      ? "pnpm install"
      : packageManager === "yarn"
        ? "yarn"
        : "npm install";

  console.log(pc.green("\nDFactory initialized successfully."));
  console.log(pc.cyan(`\nNext steps:`));
  console.log(`1. ${installCmd}`);
  console.log(`2. ${packageManager === "npm" ? "npx" : packageManager} dfactory dev`);
  console.log(`3. Open http://127.0.0.1:3211`);
}

run().catch((error) => {
  console.error(pc.red(`Failed to initialize DFactory: ${error instanceof Error ? error.message : String(error)}`));
  process.exit(1);
});
