import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@dfactory/core": path.resolve(__dirname, "packages/core/src/index.ts"),
      "@dfactory/framework-react": path.resolve(__dirname, "packages/adapter-react/src/index.ts"),
      "@dfactory/framework-vue": path.resolve(__dirname, "packages/adapter-vue/src/index.ts"),
      "@dfactory/pdf-feature-standard": path.resolve(__dirname, "packages/pdf-feature-standard/src/index.ts"),
      "@dfactory/pdf-feature-pagedjs": path.resolve(__dirname, "packages/pdf-feature-pagedjs/src/index.ts"),
      "@dfactory/pdf-feature-pdf-lib": path.resolve(__dirname, "packages/pdf-feature-pdf-lib/src/index.ts"),
      "@dfactory/module-loader-bundle": path.resolve(__dirname, "packages/module-loader-bundle/src/index.ts"),
      "@dfactory/module-loader-vite": path.resolve(__dirname, "packages/module-loader-vite/src/index.ts"),
      "@dfactory/renderer-playwright": path.resolve(__dirname, "packages/renderer-playwright/src/index.ts"),
      "@dfactory/server": path.resolve(__dirname, "packages/server/src/index.ts"),
      "@dfactory/template-kit": path.resolve(__dirname, "packages/template-kit/src/index.ts"),
      "@dfactory/ui/node": path.resolve(__dirname, "packages/ui/node/index.js")
    }
  },
  test: {
    include: ["tests/unit/**/*.test.ts", "tests/integration/**/*.test.ts"],
    environment: "node",
    fileParallelism: false
  }
});
