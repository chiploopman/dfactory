import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { publishedPackages, releaseOutputDir, repoRoot } from "./published-packages.mjs";

const summaryPath = path.resolve(releaseOutputDir, "pack-summary.json");
const archiveDocFiles = new Set(["package.json", "README.md", "CHANGELOG.md", "LICENSE"]);

function isAllowedLibraryPackageFile(filePath) {
  return (
    archiveDocFiles.has(filePath) ||
    filePath === "dist/index.js" ||
    filePath === "dist/index.d.ts"
  );
}

function isAllowedCliFile(filePath) {
  return (
    archiveDocFiles.has(filePath) ||
    filePath === "bin/dfactory.js" ||
    filePath === "dist/index.js" ||
    filePath === "dist/index.d.ts"
  );
}

function isAllowedUiFile(filePath) {
  return (
    archiveDocFiles.has(filePath) ||
    filePath === "components.json" ||
    filePath === "index.html" ||
    filePath === "vite.config.ts" ||
    filePath === "node/index.js" ||
    filePath === "node/index.d.ts" ||
    filePath === "dist/index.html" ||
    filePath.startsWith("dist/assets/") ||
    filePath.startsWith("src/")
  );
}

function isAllowedCreateDFactoryFile(filePath) {
  return (
    archiveDocFiles.has(filePath) ||
    filePath === "bin/create-dfactory.cjs" ||
    filePath === "dist/index.js" ||
    filePath === "dist/index.d.ts" ||
    filePath.startsWith("templates/")
  );
}

function getAllowedFileMatcher(packageName) {
  if (packageName === "@dfactory/cli") {
    return isAllowedCliFile;
  }

  if (packageName === "@dfactory/ui") {
    return isAllowedUiFile;
  }

  if (packageName === "create-dfactory") {
    return isAllowedCreateDFactoryFile;
  }

  return isAllowedLibraryPackageFile;
}

function getRequiredFiles(packageName) {
  if (packageName === "@dfactory/cli") {
    return ["bin/dfactory.js", "dist/index.js", "dist/index.d.ts"];
  }

  if (packageName === "@dfactory/ui") {
    return ["dist/index.html", "index.html", "node/index.js", "node/index.d.ts", "vite.config.ts"];
  }

  if (packageName === "create-dfactory") {
    return ["bin/create-dfactory.cjs", "dist/index.js", "dist/index.d.ts", "templates/base/dfactory.config.ts"];
  }

  return ["dist/index.js", "dist/index.d.ts"];
}

function shouldRunAttw(packageName) {
  return !["@dfactory/cli", "@dfactory/ui", "create-dfactory"].includes(packageName);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
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

function validateTarball(packageName, tarballPath) {
  run("pnpm", ["exec", "publint", "run", tarballPath, "--strict", "--level", "warning"]);

  if (shouldRunAttw(packageName)) {
    run("pnpm", ["exec", "attw", tarballPath, "--profile", "esm-only"]);
  }
}

async function listTarballs() {
  const entries = await fs.readdir(releaseOutputDir);
  return entries.filter((entry) => entry.endsWith(".tgz")).sort();
}

async function extractPackage(tarballPath, targetDir) {
  await fs.rm(targetDir, { force: true, recursive: true });
  await fs.mkdir(targetDir, { recursive: true });
  run("tar", ["-xzf", tarballPath, "-C", targetDir]);
  return path.resolve(targetDir, "package");
}

async function listPackageFiles(currentDir, prefix = "") {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolutePath = path.resolve(currentDir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listPackageFiles(absolutePath, relativePath)));
      continue;
    }

    files.push(relativePath);
  }

  return files.sort();
}

await fs.rm(releaseOutputDir, { force: true, recursive: true });
await fs.mkdir(releaseOutputDir, { recursive: true });

const packed = [];

for (const pkg of publishedPackages) {
  console.log(`Packing ${pkg.name}...`);
  const before = new Set(await listTarballs());

  run(
    "pnpm",
    ["pack", "--pack-destination", releaseOutputDir],
    {
      cwd: path.resolve(repoRoot, pkg.dir),
      stdio: "inherit"
    }
  );

  const after = await listTarballs();
  const newTarball = after.find((entry) => !before.has(entry));

  if (!newTarball) {
    throw new Error(`Failed to locate packed tarball for ${pkg.name}.`);
  }

  const tarballPath = path.resolve(releaseOutputDir, newTarball);
  validateTarball(pkg.name, tarballPath);
  const extractedDir = path.resolve(releaseOutputDir, `.extract-${newTarball.replace(/\.tgz$/, "")}`);
  const packageDir = await extractPackage(tarballPath, extractedDir);
  const packageJsonPath = path.resolve(packageDir, "package.json");
  const packageJsonRaw = await fs.readFile(packageJsonPath, "utf8");
  const packageJson = JSON.parse(packageJsonRaw);

  if (packageJson.name !== pkg.name) {
    throw new Error(`Packed manifest name mismatch for ${pkg.name}.`);
  }

  if (packageJson.private) {
    throw new Error(`Private package leaked into publish set: ${pkg.name}.`);
  }

  if (packageJsonRaw.includes("workspace:")) {
    throw new Error(`Packed manifest still contains workspace protocol: ${pkg.name}.`);
  }

  if (pkg.name === "@dfactory/cli" && packageJson.bin?.dfactory !== "bin/dfactory.js") {
    throw new Error("Packed @dfactory/cli manifest has an unexpected bin mapping.");
  }

  if (pkg.name === "create-dfactory" && packageJson.bin?.["create-dfactory"] !== "bin/create-dfactory.cjs") {
    throw new Error("Packed create-dfactory manifest has an unexpected bin mapping.");
  }

  const packageFiles = await listPackageFiles(packageDir);
  const allowFile = getAllowedFileMatcher(pkg.name);
  const requiredFiles = getRequiredFiles(pkg.name);
  const unexpectedFiles = packageFiles.filter((filePath) => !allowFile(filePath));
  const missingFiles = requiredFiles.filter((filePath) => !packageFiles.includes(filePath));

  if (unexpectedFiles.length > 0) {
    throw new Error(
      `Packed ${pkg.name} tarball contains unexpected files:\n${unexpectedFiles
        .map((filePath) => `- ${filePath}`)
        .join("\n")}`
    );
  }

  if (missingFiles.length > 0) {
    throw new Error(
      `Packed ${pkg.name} tarball is missing required files:\n${missingFiles
        .map((filePath) => `- ${filePath}`)
        .join("\n")}`
    );
  }

  packed.push({
    ...pkg,
    tarballPath
  });
}

await fs.writeFile(`${summaryPath}`, `${JSON.stringify({ packed }, null, 2)}\n`);
console.log(`Packed ${packed.length} publishable packages into ${releaseOutputDir}.`);
