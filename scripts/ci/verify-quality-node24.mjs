import fs from "node:fs/promises";
import path from "node:path";

import {
  createCleanRoomCheckout,
  removeTempRoot,
  repoRoot,
  runStep,
} from "./shared.mjs";

const rootPackageJson = JSON.parse(
  await fs.readFile(path.resolve(repoRoot, "package.json"), "utf8"),
);
const packageManager = rootPackageJson.packageManager;

if (!packageManager?.startsWith("pnpm@")) {
  throw new Error(
    `Expected package.json packageManager to pin pnpm, received ${String(packageManager)}`,
  );
}

let tempRoot;
let checkoutDir;

try {
  ({ tempRoot, checkoutDir } = await createCleanRoomCheckout("dfactory-node24-quality-"));

  const dockerArgs = [
    "run",
    "--rm",
    "-e",
    "CI=1",
    "-v",
    `${checkoutDir}:/source:ro`,
    "-w",
    "/tmp",
    "node:24-bookworm",
    "bash",
    "-lc",
    [
      "mkdir -p /workspace",
      "cp -R /source/. /workspace",
      "cd /workspace",
      "corepack enable",
      `corepack prepare ${packageManager} --activate`,
      "pnpm install --frozen-lockfile",
      "pnpm release:check-governance",
      "pnpm lint",
      "pnpm typecheck:quality",
      "pnpm test:repo",
      "pnpm exec turbo run test --concurrency=2",
    ].join(" && "),
  ];

  runStep("[node24-quality] Run Linux Node 24 parity check", "docker", dockerArgs);

  await removeTempRoot(tempRoot);
  console.log("\n[node24-quality] Verification passed.");
} catch (error) {
  console.error(`\n[node24-quality] Verification failed. Preserving workspace at ${checkoutDir}`);
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
