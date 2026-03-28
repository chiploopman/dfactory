import type { DFactoryConfig } from "./types";

export const PRIMARY_TEMPLATE_GLOB = "src/templates/*/template.{ts,tsx,js,jsx,mts,mtsx}";
export const COMPAT_TEMPLATE_GLOB = "src/template/*/template.{ts,tsx,js,jsx,mts,mtsx}";

export const DEFAULT_CONFIG: DFactoryConfig = {
  templates: {
    globs: [PRIMARY_TEMPLATE_GLOB],
    ignore: ["**/node_modules/**", "**/dist/**"],
    compatibilityGlobEnabled: false
  },
  plugins: ["@dfactory/framework-react"],
  moduleLoader: undefined,
  auth: {
    mode: "apiKey",
    apiKeys: [],
    hookModule: undefined
  },
  ui: {
    exposeInProd: true,
    sourceInProd: false,
    playgroundInProd: false
  },
  renderer: {
    engine: "playwright",
    poolSize: 4,
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
