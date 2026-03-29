import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();
const docsRoot = path.resolve(cwd, "apps/docs/content/docs");

async function collectMdxFiles(root) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectMdxFiles(fullPath)));
      continue;
    }
    if (fullPath.endsWith(".mdx") || fullPath.endsWith(".md")) {
      files.push(fullPath);
    }
  }

  return files;
}

const files = await collectMdxFiles(docsRoot);
const failures = [];

for (const filePath of files) {
  const content = await fs.readFile(filePath, "utf8");

  if (!content.startsWith("---\n")) {
    failures.push(`${path.relative(cwd, filePath)}: missing frontmatter block`);
    continue;
  }

  const end = content.indexOf("\n---\n", 4);
  if (end === -1) {
    failures.push(`${path.relative(cwd, filePath)}: unterminated frontmatter block`);
    continue;
  }

  const frontmatter = content.slice(4, end);
  if (!/^title:\s*.+$/m.test(frontmatter)) {
    failures.push(`${path.relative(cwd, filePath)}: missing frontmatter title`);
  }
  if (!/^description:\s*.+$/m.test(frontmatter)) {
    failures.push(`${path.relative(cwd, filePath)}: missing frontmatter description`);
  }
}

if (failures.length > 0) {
  console.error("Frontmatter validation failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Validated frontmatter in ${files.length} docs files.`);
