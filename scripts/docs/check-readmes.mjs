import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();

const requiredPaths = [
  "README.md",
  "apps/docs/README.md",
  "examples/react-starter/README.md",
  "examples/vue-starter/README.md",
  "packages/adapter-react/README.md",
  "packages/adapter-vue/README.md",
  "packages/cli/README.md",
  "packages/core/README.md",
  "packages/create-dfactory/README.md",
  "packages/module-loader-bundle/README.md",
  "packages/module-loader-vite/README.md",
  "packages/pdf-feature-pagedjs/README.md",
  "packages/pdf-feature-pdf-lib/README.md",
  "packages/pdf-feature-standard/README.md",
  "packages/renderer-playwright/README.md",
  "packages/server/README.md",
  "packages/template-kit/README.md",
  "packages/ui/README.md",
];

const requiredSections = [
  "## Purpose",
  "## Usage",
  "## Development",
  "## Troubleshooting",
  "## Related Documentation",
];

const failures = [];

for (const relativePath of requiredPaths) {
  const absolutePath = path.resolve(cwd, relativePath);

  let content;
  try {
    content = await fs.readFile(absolutePath, "utf8");
  } catch {
    failures.push(`${relativePath}: missing file`);
    continue;
  }

  if (content.trim().length < 120) {
    failures.push(`${relativePath}: too short to be comprehensive`);
  }

  for (const section of requiredSections) {
    if (!content.includes(section)) {
      failures.push(`${relativePath}: missing required section '${section}'`);
    }
  }
}

if (failures.length > 0) {
  console.error("README governance checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated README coverage and sections for ${requiredPaths.length} files.`);
