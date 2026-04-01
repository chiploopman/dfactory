import { publishedPackages, workspacePackages } from "./published-packages.mjs";

const publishedPackageNames = new Set(publishedPackages.map((pkg) => pkg.name));
const violations = [];

for (const pkg of workspacePackages) {
  if (publishedPackageNames.has(pkg.name) && pkg.private) {
    violations.push(`Published package ${pkg.name} is incorrectly marked private.`);
  }

  if (!publishedPackageNames.has(pkg.name) && !pkg.private) {
    violations.push(
      `Workspace package ${pkg.name} must either be private or included in .changeset/config.json.`
    );
  }
}

if (violations.length > 0) {
  throw new Error(violations.join("\n"));
}

console.log(
  `Publish governance passed for ${publishedPackages.length} public packages and ${workspacePackages.length - publishedPackages.length} private workspace packages.`
);
