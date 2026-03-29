#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pc from "picocolors";

type SupportedFramework = "react" | "vue";

interface PackageJson {
  name?: string;
  version?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface FrameworkTemplateSpec {
  framework: SupportedFramework;
  frameworkPluginPackage: "@dfactory/framework-react" | "@dfactory/framework-vue";
  moduleLoaderPackage: "@dfactory/module-loader-bundle" | "@dfactory/module-loader-vite";
  primitivesPackage: "@dfactory/pdf-primitives-react" | "@dfactory/pdf-primitives-vue";
  templateDirectory: string;
}

const COMMON_SCRIPTS = {
  "dfactory:dev": "dfactory dev",
  "dfactory:build": "dfactory build",
  "dfactory:serve": "dfactory serve",
  "dfactory:index": "dfactory index",
  "dfactory:doctor": "dfactory doctor"
} as const;

const PACKAGE_DIR = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_BASE_DIR = path.resolve(PACKAGE_DIR, "../templates");

const FRAMEWORK_SPECS: Record<SupportedFramework, FrameworkTemplateSpec> = {
  react: {
    framework: "react",
    frameworkPluginPackage: "@dfactory/framework-react",
    moduleLoaderPackage: "@dfactory/module-loader-bundle",
    primitivesPackage: "@dfactory/pdf-primitives-react",
    templateDirectory: "react"
  },
  vue: {
    framework: "vue",
    frameworkPluginPackage: "@dfactory/framework-vue",
    moduleLoaderPackage: "@dfactory/module-loader-vite",
    primitivesPackage: "@dfactory/pdf-primitives-vue",
    templateDirectory: "vue"
  }
};

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

function hasDependency(packageJson: PackageJson | undefined, names: string[]): boolean {
  if (!packageJson) {
    return false;
  }

  const allDependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {})
  };

  return names.some((name) => Boolean(allDependencies[name]));
}

export function detectFrameworkFromPackageJson(packageJson: PackageJson | undefined): SupportedFramework {
  if (hasDependency(packageJson, ["vue", "nuxt"])) {
    return "vue";
  }

  if (hasDependency(packageJson, ["react", "next"])) {
    return "react";
  }

  return "react";
}

function renderTokens(content: string, tokens: Record<string, string>): string {
  let rendered = content;
  for (const [key, value] of Object.entries(tokens)) {
    rendered = rendered.replaceAll(`{{${key}}}`, value);
  }
  return rendered;
}

async function copyTemplateTree(options: {
  sourceRoot: string;
  targetRoot: string;
  tokens: Record<string, string>;
}): Promise<void> {
  const entries = await fs.readdir(options.sourceRoot, { withFileTypes: true });
  for (const entry of entries) {
    const sourcePath = path.resolve(options.sourceRoot, entry.name);
    const targetPath = path.resolve(options.targetRoot, entry.name);

    if (entry.isDirectory()) {
      await fs.mkdir(targetPath, { recursive: true });
      await copyTemplateTree({
        sourceRoot: sourcePath,
        targetRoot: targetPath,
        tokens: options.tokens
      });
      continue;
    }

    try {
      await fs.access(targetPath);
      continue;
    } catch {
      const sourceContent = await fs.readFile(sourcePath, "utf8");
      const rendered = renderTokens(sourceContent, options.tokens);
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, rendered);
    }
  }
}

function applyPackageUpdates(existing: PackageJson, frameworkSpec: FrameworkTemplateSpec): PackageJson {
  const nextDependencies = {
    ...(existing.dependencies ?? {}),
    "@dfactory/cli": "latest",
    "@dfactory/core": "latest",
    "@dfactory/template-kit": "latest",
    "@dfactory/pdf-feature-standard": "latest",
    "@dfactory/pdf-primitives-core": "latest",
    [frameworkSpec.primitivesPackage]: "latest",
    [frameworkSpec.frameworkPluginPackage]: "latest",
    [frameworkSpec.moduleLoaderPackage]: "latest"
  };
  if (!nextDependencies.zod) {
    nextDependencies.zod = "latest";
  }

  return {
    ...existing,
    scripts: {
      ...existing.scripts,
      ...COMMON_SCRIPTS
    },
    dependencies: nextDependencies,
    devDependencies: {
      ...existing.devDependencies
    }
  };
}

export async function runCreateDFactory() {
  const targetArg = process.argv[2];
  const cwd = targetArg ? path.resolve(process.cwd(), targetArg) : process.cwd();

  await fs.mkdir(cwd, { recursive: true });

  const packageJsonPath = path.resolve(cwd, "package.json");
  const existing = (await readJson<PackageJson>(packageJsonPath)) ?? {
    name: path.basename(cwd),
    version: "0.1.0"
  };

  const framework = detectFrameworkFromPackageJson(existing);
  const frameworkSpec = FRAMEWORK_SPECS[framework];

  const nextPackageJson = applyPackageUpdates(existing, frameworkSpec);
  await writeJson(packageJsonPath, nextPackageJson);

  const tokens = {
    frameworkPluginPackage: frameworkSpec.frameworkPluginPackage,
    moduleLoaderPackage: frameworkSpec.moduleLoaderPackage
  };

  await copyTemplateTree({
    sourceRoot: path.resolve(TEMPLATE_BASE_DIR, "base"),
    targetRoot: cwd,
    tokens
  });

  await copyTemplateTree({
    sourceRoot: path.resolve(TEMPLATE_BASE_DIR, frameworkSpec.templateDirectory),
    targetRoot: cwd,
    tokens
  });

  const packageManager = detectPackageManager();
  const installCmd =
    packageManager === "pnpm"
      ? "pnpm install"
      : packageManager === "yarn"
        ? "yarn"
        : "npm install";

  console.log(pc.green("\nDFactory initialized successfully."));
  console.log(pc.cyan(`Detected framework: ${framework}`));
  console.log(pc.cyan("\nNext steps:"));
  console.log(`1. ${installCmd}`);
  console.log(`2. ${packageManager} run dfactory:dev`);
  console.log("3. Open http://127.0.0.1:3211");
}

const isMainModule = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isMainModule) {
  runCreateDFactory().catch((error) => {
    console.error(pc.red(`Failed to initialize DFactory: ${error instanceof Error ? error.message : String(error)}`));
    process.exit(1);
  });
}
