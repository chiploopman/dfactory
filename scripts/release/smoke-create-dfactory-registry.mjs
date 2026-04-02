import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const frameworks = ["react", "vue"];
const managers = [
  {
    name: "npm",
    runCreate(projectDir, env) {
      run("npm", ["create", "dfactory@latest", "--", "--package-manager", "npm"], {
        cwd: projectDir,
        env
      });
    }
  },
  {
    name: "pnpm",
    runCreate(projectDir, env) {
      run("pnpm", ["create", "dfactory@latest", "--package-manager", "pnpm"], {
        cwd: projectDir,
        env
      });
    }
  },
  {
    name: "yarn",
    runCreate(projectDir, env) {
      run("corepack", ["yarn", "create", "dfactory", "--package-manager", "yarn"], {
        cwd: projectDir,
        env
      });
    }
  }
];

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
    CI: "1",
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

function createFrameworkManifest(framework) {
  return {
    name: `dfactory-registry-${framework}-smoke`,
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

async function assertScaffold(projectDir, framework) {
  const packageJson = await readJson(path.resolve(projectDir, "package.json"));
  const config = await fs.readFile(path.resolve(projectDir, "dfactory.config.ts"), "utf8");

  if (packageJson.dependencies?.["@dfactory/core"] !== "latest") {
    throw new Error("Expected @dfactory/core to be added with the latest version range.");
  }

  if (framework === "react") {
    await fs.access(path.resolve(projectDir, "src/templates/invoice/template.tsx"));
    if (!config.includes("\"@dfactory/framework-react\"")) {
      throw new Error("Expected the generated config to register @dfactory/framework-react.");
    }
  } else {
    await fs.access(path.resolve(projectDir, "src/templates/invoice/template.ts"));
    await fs.access(path.resolve(projectDir, "src/templates/invoice/InvoiceTemplate.vue"));
    if (!config.includes("\"@dfactory/framework-vue\"")) {
      throw new Error("Expected the generated config to register @dfactory/framework-vue.");
    }
  }
}

async function runWithRetry(label, action, attempts = 6) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await action();
      return;
    } catch (error) {
      lastError = error;

      if (attempt === attempts) {
        break;
      }

      console.warn(`${label} failed on attempt ${attempt}/${attempts}. Retrying in 10 seconds...`);
      await delay(10_000);
    }
  }

  throw lastError;
}

async function runFrameworkSmoke(manager, framework) {
  const projectDir = await fs.mkdtemp(path.resolve(os.tmpdir(), `dfactory-registry-${manager.name}-${framework}-`));
  const env = createPackageManagerEnv(projectDir);
  let completed = false;

  try {
    await writeJson(path.resolve(projectDir, "package.json"), createFrameworkManifest(framework));

    await runWithRetry(`[registry:${manager.name}] ${framework} create`, async () => {
      manager.runCreate(projectDir, env);
      await assertScaffold(projectDir, framework);
    });

    completed = true;
    console.log(`[registry:${manager.name}] ${framework} create smoke passed.`);
  } finally {
    if (completed) {
      await fs.rm(projectDir, { force: true, recursive: true });
    } else {
      console.error(`Preserving failed registry smoke workspace at ${projectDir}`);
    }
  }
}

for (const manager of managers) {
  for (const framework of frameworks) {
    await runFrameworkSmoke(manager, framework);
  }
}

console.log("\nRegistry-backed create-dfactory smoke passed.");
