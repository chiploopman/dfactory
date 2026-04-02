import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { publishedPackages, releaseOutputDir } from "./published-packages.mjs";

const summaryPath = path.resolve(releaseOutputDir, "pack-summary.json");
const libraryImportTargets = publishedPackages
  .map((pkg) => pkg.name)
  .filter((packageName) => !["@dfactory/cli", "@dfactory/ui", "create-dfactory"].includes(packageName));

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

async function writeJson(filePath, value) {
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

async function createTempProject(prefix, manifest) {
  const tempDir = await fs.mkdtemp(path.resolve(os.tmpdir(), prefix));
  await writeJson(path.resolve(tempDir, "package.json"), manifest);
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

function createManifest(name, dependencies, tarballSpecs) {
  return {
    name,
    private: true,
    type: "module",
    dependencies,
    overrides: tarballSpecs,
    pnpm: {
      overrides: tarballSpecs
    },
    resolutions: tarballSpecs
  };
}

async function assertLibraryImports(projectDir, env) {
  const importCheck = run(
    "node",
    [
      "--input-type=module",
      "-e",
      `
const importTargets = ${JSON.stringify(libraryImportTargets)};
for (const name of importTargets) {
  await import(name);
}
const ui = await import("@dfactory/ui/node");
if (typeof ui.buildUiAssets !== "function" || typeof ui.startUiDevServer !== "function") {
  throw new Error("ui-node-missing");
}
console.log("imports-ok");
`
    ],
    { cwd: projectDir, env }
  );

  if (!importCheck.stdout.includes("imports-ok")) {
    throw new Error("Failed to import all public library packages from smoke install.");
  }
}

async function assertCliBuild(projectDir, env) {
  run(path.resolve(projectDir, "node_modules/.bin/dfactory"), ["build", "--ui-out-dir", ".dfactory/ui"], {
    cwd: projectDir,
    env
  });

  await fs.access(path.resolve(projectDir, ".dfactory/ui/index.html"));
}

async function writeTypeScriptConfig(projectDir, framework) {
  const compilerOptions =
    framework === "react"
      ? {
          jsx: "react-jsx",
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2022"
        }
      : {
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2022"
        };

  await writeJson(path.resolve(projectDir, "tsconfig.json"), {
    compilerOptions
  });
}

async function pinScaffoldedDependenciesToTarballs(projectDir, tarballSpecs) {
  const packageJsonPath = path.resolve(projectDir, "package.json");
  const packageJson = await readJson(packageJsonPath);
  const dependencies = { ...(packageJson.dependencies ?? {}) };

  for (const [packageName, currentVersion] of Object.entries(dependencies)) {
    if (typeof currentVersion !== "string") {
      continue;
    }

    const tarballSpec = tarballSpecs[packageName];
    if (tarballSpec) {
      dependencies[packageName] = tarballSpec;
    }
  }

  packageJson.dependencies = dependencies;
  await writeJson(packageJsonPath, packageJson);
}

async function assertScaffoldedProject(projectDir, env, expectedTemplateId) {
  run(path.resolve(projectDir, "node_modules/.bin/dfactory"), ["build", "--ui-out-dir", ".dfactory/ui"], {
    cwd: projectDir,
    env
  });
  run(path.resolve(projectDir, "node_modules/.bin/dfactory"), ["index"], {
    cwd: projectDir,
    env
  });

  await fs.access(path.resolve(projectDir, ".dfactory/ui/index.html"));
  const indexRaw = await fs.readFile(path.resolve(projectDir, ".dfactory/templates.index.json"), "utf8");
  const indexJson = JSON.parse(indexRaw);
  const templateIds = new Set((indexJson.templates ?? []).map((template) => template.id));

  if (!templateIds.has(expectedTemplateId)) {
    throw new Error(`Expected scaffolded project to expose template ${expectedTemplateId}.`);
  }
}

async function runManagerSmoke(manager, tarballSpecs) {
  const projectDir = await createTempProject(
    `dfactory-smoke-${manager.name}-`,
    createManifest("dfactory-release-smoke", tarballSpecs, tarballSpecs)
  );
  const env = createPackageManagerEnv(projectDir);
  let completed = false;

  try {
    console.log(`[${manager.name}] installing release tarballs...`);
    manager.install(projectDir, env);
    console.log(`[${manager.name}] validating imports...`);
    await assertLibraryImports(projectDir, env);
    console.log(`[${manager.name}] running CLI build smoke...`);
    await assertCliBuild(projectDir, env);
    completed = true;
    console.log(`Smoke test passed with ${manager.name}.`);
  } finally {
    if (completed) {
      await fs.rm(projectDir, { force: true, recursive: true });
    } else {
      console.error(`Preserving failed smoke workspace at ${projectDir}`);
    }
  }
}

async function runCreateDFactorySmoke(manager, framework, tarballSpecs) {
  const frameworkDependencies =
    framework === "react"
      ? {
          react: "^19.1.1",
          "react-dom": "^19.1.1"
        }
      : {
          vue: "^3.5.21"
        };
  const projectDir = await createTempProject(
    `dfactory-create-${manager.name}-${framework}-`,
    createManifest(`dfactory-create-${framework}-app`, frameworkDependencies, tarballSpecs)
  );
  const env = createPackageManagerEnv(projectDir);
  let completed = false;

  try {
    await writeTypeScriptConfig(projectDir, framework);
    console.log(`[create-dfactory:${framework}] generating scaffold...`);
    manager.execInitializer(projectDir, env, tarballSpecs["create-dfactory"], [
      "--package-manager",
      manager.name
    ]);
    await pinScaffoldedDependenciesToTarballs(projectDir, tarballSpecs);
    console.log(`[create-dfactory:${framework}] installing scaffolded dependencies...`);
    manager.install(projectDir, env);
    console.log(`[create-dfactory:${framework}] validating scaffold...`);
    await assertScaffoldedProject(projectDir, env, "invoice");
    completed = true;
    console.log(`create-dfactory smoke test passed for ${framework} with ${manager.name}.`);
  } finally {
    if (completed) {
      await fs.rm(projectDir, { force: true, recursive: true });
    } else {
      console.error(`Preserving failed scaffold workspace at ${projectDir}`);
    }
  }
}

const { packed } = await readSummary();
const tarballSpecs = Object.fromEntries(packed.map((entry) => [entry.name, getTarballSpec(entry.tarballPath)]));

const managers = [
  {
    name: "npm",
    install(projectDir, env) {
      run("npm", ["install", "--prefer-offline", "--ignore-scripts"], { cwd: projectDir, env });
    },
    execInitializer(projectDir, env, packageSpec, args) {
      run(
        "npm",
        ["exec", "--yes", "--package", packageSpec, "create-dfactory", "--", ...args],
        { cwd: projectDir, env }
      );
    }
  },
  {
    name: "pnpm",
    install(projectDir, env) {
      run("pnpm", ["install", "--prefer-offline", "--ignore-scripts"], { cwd: projectDir, env });
    },
    execInitializer(projectDir, env, packageSpec, args) {
      run("pnpm", ["dlx", packageSpec, ...args], { cwd: projectDir, env });
    }
  },
  {
    name: "yarn",
    install(projectDir, env) {
      run("corepack", ["yarn", "install", "--mode=skip-build"], { cwd: projectDir, env });
    },
    execInitializer(projectDir, env, packageSpec, args) {
      run("corepack", ["yarn", "dlx", "--package", `create-dfactory@${packageSpec}`, "create-dfactory", ...args], {
        cwd: projectDir,
        env
      });
    }
  }
];

for (const manager of managers) {
  await runManagerSmoke(manager, tarballSpecs);
}

for (const manager of managers.filter((entry) => entry.name !== "yarn")) {
  await runCreateDFactorySmoke(manager, "react", tarballSpecs);
  await runCreateDFactorySmoke(manager, "vue", tarballSpecs);
}
