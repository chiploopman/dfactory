import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "tsdown";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceTsconfig = path.resolve(repoRoot, "tsconfig.workspace.base.json");

export function definePackageConfig(options) {
  return defineConfig({
    clean: true,
    dts: {
      tsconfig: workspaceTsconfig
    },
    fixedExtension: false,
    format: ["esm"],
    sourcemap: false,
    ...options
  });
}
