import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const cwd = process.cwd();

const markdownFiles = [
  path.resolve(cwd, "README.md"),
  path.resolve(cwd, "apps/docs/README.md"),
];

async function collectFiles(root, matcher) {
  const entries = await fs.readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath, matcher)));
      continue;
    }
    if (matcher(fullPath)) {
      files.push(fullPath);
    }
  }

  return files;
}

markdownFiles.push(
  ...(await collectFiles(path.resolve(cwd, "packages"), (file) =>
    file.endsWith("README.md"),
  )),
  ...(await collectFiles(path.resolve(cwd, "examples"), (file) =>
    file.endsWith("README.md"),
  )),
  ...(await collectFiles(path.resolve(cwd, "apps/docs/content/docs"), (file) =>
    file.endsWith(".mdx") || file.endsWith(".md"),
  )),
);

const broken = [];
const markdownLinkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

function resolveDocsRoute(routePath) {
  const clean = routePath.replace(/^\/docs\/?/, "");
  const candidates = [
    path.resolve(cwd, "apps/docs/content/docs", `${clean}.mdx`),
    path.resolve(cwd, "apps/docs/content/docs", `${clean}.md`),
    path.resolve(cwd, "apps/docs/content/docs", clean, "index.mdx"),
    path.resolve(cwd, "apps/docs/content/docs", clean, "index.md"),
  ];

  if (clean.length === 0) {
    candidates.unshift(path.resolve(cwd, "apps/docs/content/docs/index.mdx"));
  }

  return candidates;
}

for (const filePath of markdownFiles) {
  const content = await fs.readFile(filePath, "utf8");
  const links = [...content.matchAll(markdownLinkPattern)].map((match) => match[1]);

  for (const link of links) {
    if (!link || link.startsWith("#")) {
      continue;
    }

    if (/^(https?:|mailto:|tel:)/i.test(link)) {
      continue;
    }

    const [rawTarget] = link.split("#");
    if (!rawTarget) {
      continue;
    }

    if (rawTarget.startsWith("/docs")) {
      const candidates = resolveDocsRoute(rawTarget);
      const exists = await Promise.any(
        candidates.map(async (candidate) => {
          await fs.access(candidate);
          return true;
        }),
      ).catch(() => false);

      if (!exists) {
        broken.push({ filePath, link });
      }
      continue;
    }

    if (rawTarget.startsWith("/")) {
      const absolute = path.resolve(cwd, `.${rawTarget}`);
      try {
        await fs.access(absolute);
      } catch {
        broken.push({ filePath, link });
      }
      continue;
    }

    const absolute = path.resolve(path.dirname(filePath), rawTarget);
    try {
      await fs.access(absolute);
    } catch {
      broken.push({ filePath, link });
    }
  }
}

if (broken.length > 0) {
  console.error("Broken local links found:");
  for (const issue of broken) {
    console.error(`- ${path.relative(cwd, issue.filePath)} -> ${issue.link}`);
  }
  process.exit(1);
}

console.log(`Checked ${markdownFiles.length} markdown files: no broken local links.`);
