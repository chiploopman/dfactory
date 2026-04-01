import {
  createCleanRoomCheckout,
  initializeGitBaseline,
  removeTempRoot,
  runStep,
} from "./shared.mjs";

const currentNodeMajor = Number.parseInt(process.versions.node.split(".")[0], 10);

if (currentNodeMajor !== 20) {
  throw new Error(
    "verify:clean-room mirrors the Node 20 docs and e2e jobs. Run `nvm use 20` before invoking it.",
  );
}

let tempRoot;
let checkoutDir;

try {
  ({ tempRoot, checkoutDir } = await createCleanRoomCheckout("dfactory-clean-room-"));
  initializeGitBaseline(checkoutDir);

  const stepOptions = {
    cwd: checkoutDir,
    env: {
      ...process.env,
      CI: "1",
    },
  };

  runStep("[clean-room] Install dependencies", "pnpm", ["install", "--frozen-lockfile"], stepOptions);
  runStep("[clean-room] Build example fixtures", "pnpm", ["build:examples"], stepOptions);
  runStep("[clean-room] Run docs CI", "pnpm", ["docs:ci"], stepOptions);
  runStep("[clean-room] Run E2E", "pnpm", ["test:e2e"], stepOptions);

  await removeTempRoot(tempRoot);
  console.log("\n[clean-room] Verification passed.");
} catch (error) {
  console.error(`\n[clean-room] Verification failed. Preserving workspace at ${checkoutDir}`);
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(String(error));
  }
  process.exit(1);
}
