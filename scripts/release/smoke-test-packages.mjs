import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { releaseOutputDir } from "./published-packages.mjs";

const summaryPath = path.resolve(releaseOutputDir, "pack-summary.json");

function run(command, args, options = {}) {
  const { env: extraEnv = {}, ...spawnOptions } = options;
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: "pipe",
    ...spawnOptions,
    env: {
      ...process.env,
      PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: "1",
      ...extraEnv
    }
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

async function readSummary() {
  const raw = await fs.readFile(summaryPath, "utf8");
  return JSON.parse(raw);
}

function getTarballSpec(tarballPath) {
  return `file:${tarballPath}`;
}

async function createTempProject(prefix, manifest) {
  const tempDir = await fs.mkdtemp(path.resolve(os.tmpdir(), prefix));
  await fs.writeFile(
    path.resolve(tempDir, "package.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  return tempDir;
}

function createPackageManagerEnv(projectDir) {
  const cacheDir = path.resolve(projectDir, ".cache");

  return {
    HOME: projectDir,
    npm_config_cache: path.resolve(cacheDir, "npm"),
    pnpm_config_store_dir: path.resolve(cacheDir, "pnpm-store"),
    YARN_CACHE_FOLDER: path.resolve(cacheDir, "yarn")
  };
}

async function assertReleaseInstall(projectDir, env) {
  const coreImport = run(
    "node",
    ["--input-type=module", "-e", "import('@dfactory/core').then(() => console.log('core-ok'))"],
    { cwd: projectDir, env }
  );

  if (!coreImport.stdout.includes("core-ok")) {
    throw new Error("Failed to import @dfactory/core from smoke install.");
  }

  const uiImport = run(
    "node",
    [
      "--input-type=module",
      "-e",
      "import('@dfactory/ui/node').then((mod) => console.log(typeof mod.buildUiAssets === 'function' ? 'ui-ok' : 'ui-missing'))"
    ],
    { cwd: projectDir, env }
  );

  if (!uiImport.stdout.includes("ui-ok")) {
    throw new Error("Failed to import @dfactory/ui/node from smoke install.");
  }

  run(path.resolve(projectDir, "node_modules/.bin/dfactory"), ["build", "--ui-out-dir", ".dfactory/ui"], {
    cwd: projectDir,
    env
  });

  await fs.access(path.resolve(projectDir, ".dfactory/ui/index.html"));
}

const { packed } = await readSummary();
const tarballSpecs = Object.fromEntries(packed.map((entry) => [entry.name, getTarballSpec(entry.tarballPath)]));
const representativePackages = ["@dfactory/cli", "@dfactory/core", "@dfactory/ui", "create-dfactory"];
const representativeDependencies = Object.fromEntries(
  representativePackages.map((packageName) => {
    const tarballSpec = tarballSpecs[packageName];

    if (!tarballSpec) {
      throw new Error(`Missing representative release tarball for ${packageName}.`);
    }

    return [packageName, tarballSpec];
  })
);

const baseManifest = {
  name: "dfactory-release-smoke",
  private: true,
  dependencies: representativeDependencies,
  overrides: tarballSpecs,
  pnpm: {
    overrides: tarballSpecs
  },
  resolutions: tarballSpecs
};

const managers = [
  {
    name: "npm",
    install(projectDir, env) {
      run("npm", ["install", "--prefer-offline", "--ignore-scripts"], { cwd: projectDir, env });
    }
  },
  {
    name: "pnpm",
    install(projectDir, env) {
      run("pnpm", ["install", "--prefer-offline", "--ignore-scripts"], { cwd: projectDir, env });
    }
  },
  {
    name: "yarn",
    install(projectDir, env) {
      run("corepack", ["yarn", "install", "--mode=skip-build"], { cwd: projectDir, env });
    }
  }
];

for (const manager of managers) {
  const projectDir = await createTempProject(`dfactory-smoke-${manager.name}-`, baseManifest);
  const env = createPackageManagerEnv(projectDir);

  try {
    manager.install(projectDir, env);
    await assertReleaseInstall(projectDir, env);
    console.log(`Smoke test passed with ${manager.name}.`);
  } finally {
    await fs.rm(projectDir, { force: true, recursive: true });
  }
}
