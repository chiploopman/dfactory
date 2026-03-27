import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@dfactory/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@dfactory/adapter-react": path.resolve(__dirname, "packages/adapter-react/src/index.ts"),
      "@dfactory/renderer-playwright": path.resolve(__dirname, "packages/renderer-playwright/src/index.ts"),
      "@dfactory/server": path.resolve(__dirname, "packages/server/src/index.ts")
    }
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node"
  }
});
