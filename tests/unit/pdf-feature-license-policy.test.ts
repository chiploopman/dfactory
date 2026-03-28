import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

import { describe, expect, it } from "vitest";

const PERMISSIVE_LICENSES = new Set([
  "0BSD",
  "Apache-2.0",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "CC0-1.0",
  "ISC",
  "MIT",
  "Unlicense"
]);

const PDF_FEATURE_PACKAGES = [
  "packages/pdf-feature-standard/package.json",
  "packages/pdf-feature-pagedjs/package.json",
  "packages/pdf-feature-pdf-lib/package.json"
] as const;

interface PackageJson {
  name?: string;
  dependencies?: Record<string, string>;
  license?: unknown;
  licenses?: unknown;
}

function normalizeLicense(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value && typeof value === "object" && "type" in value) {
    const maybeType = (value as { type?: unknown }).type;
    if (typeof maybeType === "string") {
      return maybeType;
    }
  }
  return "";
}

function parseSpdxTokens(expression: string): string[] {
  const matches = expression.match(/[A-Za-z0-9.-]+(?:\+[A-Za-z0-9.-]+)?/g) ?? [];
  return matches.filter((token) => !["AND", "OR", "WITH"].includes(token.toUpperCase()));
}

async function readPackageJson(relativePath: string): Promise<PackageJson> {
  const absolutePath = path.resolve(process.cwd(), relativePath);
  const raw = await fs.readFile(absolutePath, "utf8");
  return JSON.parse(raw) as PackageJson;
}

async function findPackageJsonForDependency(resolveFromPackage: NodeRequire, dependencyName: string): Promise<string> {
  const entryPath = resolveFromPackage.resolve(dependencyName);
  let cursor = path.dirname(entryPath);
  let firstCandidate: string | undefined;

  while (true) {
    const candidate = path.join(cursor, "package.json");
    try {
      await fs.access(candidate);
      firstCandidate ??= candidate;
      const raw = await fs.readFile(candidate, "utf8");
      const parsed = JSON.parse(raw) as PackageJson;
      if (parsed.name === dependencyName) {
        return candidate;
      }
    } catch {
    }

    const parent = path.dirname(cursor);
    if (parent === cursor) {
      break;
    }
    cursor = parent;
  }

  if (firstCandidate) {
    return firstCandidate;
  }

  throw new Error(`Unable to locate package.json for dependency '${dependencyName}' from '${entryPath}'.`);
}

describe("pdf feature license policy", () => {
  it("allows only permissive SPDX runtime dependency licenses in first-party pdf feature plugins", async () => {
    const violations: string[] = [];

    for (const packagePath of PDF_FEATURE_PACKAGES) {
      const packageJson = await readPackageJson(packagePath);
      const packageDir = path.dirname(path.resolve(process.cwd(), packagePath));
      const resolveFromPackage = createRequire(path.join(packageDir, "package.json"));
      const dependencies = Object.keys(packageJson.dependencies ?? {});

      for (const dependencyName of dependencies) {
        if (dependencyName.startsWith("@dfactory/")) {
          continue;
        }

        const dependencyPackageJsonPath = await findPackageJsonForDependency(resolveFromPackage, dependencyName);
        const dependencyPackageJson = (await readPackageJson(
          path.relative(process.cwd(), dependencyPackageJsonPath)
        )) as PackageJson;

        const license = normalizeLicense(dependencyPackageJson.license || dependencyPackageJson.licenses);
        if (!license) {
          violations.push(
            `${packageJson.name ?? packagePath} -> ${dependencyName}: missing license field in dependency package.json`
          );
          continue;
        }

        const tokens = parseSpdxTokens(license);
        if (tokens.length === 0) {
          violations.push(
            `${packageJson.name ?? packagePath} -> ${dependencyName}: could not parse SPDX license '${license}'`
          );
          continue;
        }

        const nonPermissive = tokens.filter((token) => !PERMISSIVE_LICENSES.has(token));
        if (nonPermissive.length > 0) {
          violations.push(
            `${packageJson.name ?? packagePath} -> ${dependencyName}: non-permissive SPDX token(s) ${nonPermissive.join(
              ", "
            )} in '${license}'`
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
