import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const releaseOutputDir = path.resolve(repoRoot, ".release-pack");

const workspaceRoots = ["packages", "apps", "examples"];
const changesetConfigPath = path.resolve(repoRoot, ".changeset/config.json");

async function readJson(jsonPath) {
  return JSON.parse(await fs.readFile(jsonPath, "utf8"));
}

async function getWorkspacePackages() {
  const packages = [];

  for (const workspaceRoot of workspaceRoots) {
    const absoluteRoot = path.resolve(repoRoot, workspaceRoot);
    let entries = [];

    try {
      entries = await fs.readdir(absoluteRoot, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const manifestPath = path.resolve(absoluteRoot, entry.name, "package.json");

      try {
        const manifest = await readJson(manifestPath);
        packages.push({
          name: manifest.name,
          dir: path.relative(repoRoot, path.dirname(manifestPath)),
          private: Boolean(manifest.private)
        });
      } catch {
        continue;
      }
    }
  }

  return packages;
}

async function resolvePublishedPackages() {
  const changesetConfig = await readJson(changesetConfigPath);
  const configuredPackages = new Set(changesetConfig.fixed.flat());
  const ignoredPackages = new Set(changesetConfig.ignore ?? []);
  const packageMap = new Map(workspacePackages.map((pkg) => [pkg.name, pkg]));

  const published = [];

  for (const packageName of configuredPackages) {
    if (ignoredPackages.has(packageName)) {
      throw new Error(`Changesets config cannot both publish and ignore ${packageName}.`);
    }

    const pkg = packageMap.get(packageName);
    if (!pkg) {
      throw new Error(`Unable to resolve workspace package for ${packageName}.`);
    }

    if (pkg.private) {
      throw new Error(`Published package ${packageName} is marked private.`);
    }

    published.push({
      name: pkg.name,
      dir: pkg.dir
    });
  }

  return published.sort((left, right) => left.name.localeCompare(right.name));
}

export const workspacePackages = await getWorkspacePackages();
export const publishedPackages = await resolvePublishedPackages();
