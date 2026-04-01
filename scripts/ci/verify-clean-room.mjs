import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tempRoot = await fs.mkdtemp(path.resolve(os.tmpdir(), "dfactory-clean-room-"));
const checkoutDir = path.resolve(tempRoot, "repo");
const excludedBasenames = new Set([
  ".dfactory",
  ".git",
  ".next",
  ".source",
  ".release-pack",
  ".turbo",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);

function shouldCopy(sourcePath) {
  const relativePath = path.relative(repoRoot, sourcePath);

  if (!relativePath || relativePath.startsWith("..")) {
    return true;
  }

  return !excludedBasenames.has(path.basename(sourcePath));
}

function runStep(label, command, args) {
  console.log(`\n[clean-room] ${label}`);

  const result = spawnSync(command, args, {
    cwd: checkoutDir,
    env: {
      ...process.env,
      CI: "1",
    },
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error(`Clean-room step failed: ${command} ${args.join(" ")}`);
  }
}

try {
  await fs.cp(repoRoot, checkoutDir, {
    recursive: true,
    filter: (sourcePath) => shouldCopy(sourcePath),
  });

  runStep("Initialize git baseline", "git", ["init", "-b", "main"]);
  runStep("Configure git user", "git", ["config", "user.name", "clean-room"]);
  runStep("Configure git email", "git", ["config", "user.email", "clean-room@example.invalid"]);
  runStep("Stage baseline", "git", ["add", "-A"]);
  runStep("Commit baseline", "git", ["commit", "-m", "clean-room baseline"]);

  runStep("Install dependencies", "pnpm", ["install", "--frozen-lockfile"]);
  runStep("Build example fixtures", "pnpm", ["build:examples"]);
  runStep("Run docs CI", "pnpm", ["docs:ci"]);
  runStep("Run E2E", "pnpm", ["test:e2e"]);

  await fs.rm(tempRoot, { force: true, recursive: true });
  console.log("\n[clean-room] Verification passed.");
} catch (error) {
  console.error(
    `\n[clean-room] Verification failed. Preserving workspace at ${checkoutDir}`,
  );
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
