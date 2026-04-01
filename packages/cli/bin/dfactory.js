#!/usr/bin/env node

import { constants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const entryPath = path.resolve(packageRoot, "dist/index.js");

try {
  await access(entryPath, constants.R_OK);
} catch {
  console.error(
    "The @dfactory/cli runtime entrypoint is missing. Rebuild the package or reinstall dependencies so dist/index.js is available.",
  );
  process.exit(1);
}

await import(pathToFileURL(entryPath).href);
