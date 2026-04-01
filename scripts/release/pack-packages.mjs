import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { publishedPackages, releaseOutputDir, repoRoot } from "./published-packages.mjs";

const summaryPath = path.resolve(releaseOutputDir, "pack-summary.json");

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

  if (pkg.name === "@dfactory/ui") {
    const nodeEntry = path.resolve(packageDir, "node/index.js");
    try {
      await fs.access(nodeEntry);
    } catch {
      throw new Error("Packed @dfactory/ui tarball is missing the @dfactory/ui/node entrypoint.");
    }
  }

  packed.push({
    ...pkg,
    tarballPath
  });
}

await fs.writeFile(`${summaryPath}`, `${JSON.stringify({ packed }, null, 2)}\n`);
console.log(`Packed ${packed.length} publishable packages into ${releaseOutputDir}.`);
