import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import { repoRoot } from "./shared.mjs";

const frameworks = ["react", "vue"];
const supportedManagers = new Set(["npm", "pnpm"]);

function parseArgs(argv) {
  let manager = "npm";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--") {
      continue;
    }

    if (arg === "--manager") {
      manager = argv[index + 1] ?? "";
      index += 1;
      continue;
    }

    if (arg.startsWith("--manager=")) {
      manager = arg.split("=", 2)[1] ?? "";
      continue;
    }

    throw new Error(`Unknown option "${arg}". Supported options: --manager <npm|pnpm>.`);
  }

  if (!supportedManagers.has(manager)) {
    throw new Error("Expected --manager to be one of: npm, pnpm.");
  }

  return { manager };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    ...options
  });

  if (result.status !== 0) {
    throw new Error(
      [
        `Command failed: ${command} ${args.join(" ")}`,
        result.stdout?.trim(),
        result.stderr?.trim()
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  return result;
}

function createPackageManagerEnv(projectDir) {
  const cacheDir = path.resolve(projectDir, ".cache");

  return {
    ...process.env,
    HOME: projectDir,
    USERPROFILE: projectDir,
    npm_config_cache: path.resolve(cacheDir, "npm"),
    pnpm_config_store_dir: path.resolve(cacheDir, "pnpm-store"),
    YARN_CACHE_FOLDER: path.resolve(cacheDir, "yarn")
  };
}

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function packCreateDFactory() {
  const packDir = await fs.mkdtemp(path.resolve(os.tmpdir(), "dfactory-create-pack-"));
  const packageDir = path.resolve(repoRoot, "packages/create-dfactory");

  run("pnpm", ["pack", "--pack-destination", packDir], {
    cwd: packageDir,
    stdio: "inherit"
  });

  const entries = (await fs.readdir(packDir)).filter((entry) => entry.endsWith(".tgz")).sort();

  if (entries.length !== 1) {
    throw new Error(`Expected exactly one create-dfactory tarball in ${packDir}.`);
  }

  return {
    packDir,
    tarballPath: path.resolve(packDir, entries[0])
  };
}

function createFrameworkManifest(framework) {
  return {
    name: `dfactory-${framework}-initializer-smoke`,
    private: true,
    version: "0.0.0",
    dependencies:
      framework === "react"
        ? {
            react: "^19.1.1",
            "react-dom": "^19.1.1"
          }
        : {
            vue: "^3.5.21"
          }
  };
}

function getManager(manager) {
  if (manager === "npm") {
    return {
      name: manager,
      execInitializer(projectDir, env, packageSpec) {
        run(
          "npm",
          ["exec", "--yes", "--package", packageSpec, "create-dfactory", "--", "--package-manager", "npm"],
          { cwd: projectDir, env }
        );
      }
    };
  }

  if (manager === "pnpm") {
    return {
      name: manager,
      execInitializer(projectDir, env, packageSpec) {
        run("pnpm", ["dlx", packageSpec, "--package-manager", "pnpm"], { cwd: projectDir, env });
      }
    };
  }

  throw new Error(`Unsupported packaged initializer manager: ${manager}`);
}

async function assertScaffold(projectDir, framework) {
  const packageJson = await readJson(path.resolve(projectDir, "package.json"));
  const config = await fs.readFile(path.resolve(projectDir, "dfactory.config.ts"), "utf8");

  for (const scriptName of [
    "dfactory:dev",
    "dfactory:build",
    "dfactory:serve",
    "dfactory:index",
    "dfactory:doctor"
  ]) {
    if (!packageJson.scripts?.[scriptName]) {
      throw new Error(`Expected generated package.json to include script ${scriptName}.`);
    }
  }

  if (packageJson.dependencies?.["@dfactory/core"] !== "latest") {
    throw new Error("Expected @dfactory/core to be added with the latest version range.");
  }

  if (packageJson.dependencies?.["@dfactory/template-kit"] !== "latest") {
    throw new Error("Expected @dfactory/template-kit to be added with the latest version range.");
  }

  if (framework === "react") {
    await fs.access(path.resolve(projectDir, "src/templates/invoice/template.tsx"));
    await fs.access(path.resolve(projectDir, "src/templates/invoice-reference/template.tsx"));

    if (!config.includes("\"@dfactory/framework-react\"")) {
      throw new Error("Expected the generated config to register @dfactory/framework-react.");
    }

    if (packageJson.dependencies?.["@dfactory/framework-react"] !== "latest") {
      throw new Error("Expected @dfactory/framework-react to be added with the latest version range.");
    }
  } else {
    await fs.access(path.resolve(projectDir, "src/templates/invoice/template.ts"));
    await fs.access(path.resolve(projectDir, "src/templates/invoice/InvoiceTemplate.vue"));
    await fs.access(path.resolve(projectDir, "src/templates/invoice-reference/template.ts"));

    if (!config.includes("\"@dfactory/framework-vue\"")) {
      throw new Error("Expected the generated config to register @dfactory/framework-vue.");
    }

    if (packageJson.dependencies?.["@dfactory/framework-vue"] !== "latest") {
      throw new Error("Expected @dfactory/framework-vue to be added with the latest version range.");
    }
  }
}

async function runFrameworkSmoke(manager, packageSpec, framework) {
  const projectDir = await fs.mkdtemp(path.resolve(os.tmpdir(), `dfactory-${manager.name}-${framework}-`));
  const env = createPackageManagerEnv(projectDir);
  let completed = false;

  try {
    await writeJson(path.resolve(projectDir, "package.json"), createFrameworkManifest(framework));
    manager.execInitializer(projectDir, env, packageSpec);
    await assertScaffold(projectDir, framework);
    completed = true;
    console.log(`[initializer:${manager.name}] ${framework} scaffold smoke passed.`);
  } finally {
    if (completed) {
      await fs.rm(projectDir, { force: true, recursive: true });
    } else {
      console.error(`Preserving failed initializer workspace at ${projectDir}`);
    }
  }
}

const { manager: managerName } = parseArgs(process.argv.slice(2));
const manager = getManager(managerName);

let packDir;

try {
  const packed = await packCreateDFactory();
  packDir = packed.packDir;
  const packageSpec = pathToFileURL(packed.tarballPath).href;

  for (const framework of frameworks) {
    await runFrameworkSmoke(manager, packageSpec, framework);
  }

  await fs.rm(packDir, { force: true, recursive: true });
  console.log(`\n[initializer:${manager.name}] Packaged initializer smoke passed.`);
} catch (error) {
  if (packDir) {
    console.error(`Preserving packed initializer artifacts at ${packDir}`);
  }

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }

  process.exit(1);
}
