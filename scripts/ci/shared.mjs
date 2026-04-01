import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

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

export async function createCleanRoomCheckout(prefix) {
  const tempRoot = await fs.mkdtemp(path.resolve(os.tmpdir(), prefix));
  const checkoutDir = path.resolve(tempRoot, "repo");

  await fs.cp(repoRoot, checkoutDir, {
    recursive: true,
    filter: (sourcePath) => shouldCopy(sourcePath),
  });

  return { tempRoot, checkoutDir };
}

export function runStep(label, command, args, options = {}) {
  console.log(`\n${label}`);

  const result = spawnSync(command, args, {
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw new Error(`${label} failed: ${result.error.message}`);
  }

  if (result.status !== 0) {
    throw new Error(`${label} failed: ${command} ${args.join(" ")}`);
  }
}

export function initializeGitBaseline(checkoutDir) {
  runStep("[clean-room] Initialize git baseline", "git", ["init", "-b", "main"], {
    cwd: checkoutDir,
  });
  runStep("[clean-room] Configure git user", "git", ["config", "user.name", "clean-room"], {
    cwd: checkoutDir,
  });
  runStep(
    "[clean-room] Configure git email",
    "git",
    ["config", "user.email", "clean-room@example.invalid"],
    {
      cwd: checkoutDir,
    },
  );
  runStep("[clean-room] Stage baseline", "git", ["add", "-A"], {
    cwd: checkoutDir,
  });
  runStep("[clean-room] Commit baseline", "git", ["commit", "-m", "clean-room baseline"], {
    cwd: checkoutDir,
  });
}

export async function removeTempRoot(tempRoot) {
  await fs.rm(tempRoot, { force: true, recursive: true });
}
