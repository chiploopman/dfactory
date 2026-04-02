#!/usr/bin/env node

import process from "node:process";

try {
  await import("@dfactory/cli");
} catch (error) {
  if (error instanceof Error && (error.message.includes("Cannot find module") || error.message.includes("ERR_MODULE_NOT_FOUND"))) {
    console.error(
      "The @dfactory/cli runtime entrypoint is missing. Rebuild the package or reinstall dependencies so the published dist files are available.",
    );
    process.exit(1);
  }

  throw error;
}
