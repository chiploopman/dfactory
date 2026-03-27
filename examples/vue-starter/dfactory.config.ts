import type { DFactoryConfig } from "@dfactory/core";

const config: DFactoryConfig = {
  templates: {
    globs: ["src/templates/*/template.{ts,tsx,js,jsx,mts,mtsx}"],
    compatibilityGlobEnabled: false
  },
  plugins: ["@dfactory/framework-vue"],
  moduleLoader: "@dfactory/module-loader-vite",
  auth: {
    mode: "apiKey",
    apiKeys: []
  },
  ui: {
    exposeInProd: true,
    sourceInProd: false,
    playgroundInProd: false
  },
  renderer: {
    engine: "playwright",
    poolSize: 2,
    timeoutMs: 30000
  }
};

export default config;
