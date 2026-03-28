import type { DFactoryConfig } from "@dfactory/core";

const config: DFactoryConfig = {
  templates: {
    globs: ["examples/react-starter/src/templates/*/template.{ts,tsx,js,jsx,mts,mtsx}"],
    compatibilityGlobEnabled: false
  },
  plugins: ["@dfactory/framework-react"],
  moduleLoader: "@dfactory/module-loader-bundle",
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
    timeoutMs: 30000,
    pdfPlugins: ["@dfactory/pdf-feature-standard"],
    defaults: {
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
      outline: true
    }
  }
};

export default config;
