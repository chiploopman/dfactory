import path from "node:path";
import { fileURLToPath } from "node:url";

import { build as viteBuild, createServer as createViteServer, mergeConfig } from "vite";

function uiRootFromNodeEntry() {
  const nodeDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(nodeDir, "..");
}

function createUiViteConfig(options) {
  const uiRoot = uiRootFromNodeEntry();

  process.env.DFACTORY_UI_PORT = String(options.uiPort);
  process.env.VITE_DFACTORY_API_URL = options.apiUrl;

  return {
    configFile: path.resolve(uiRoot, "vite.config.ts"),
    root: uiRoot,
    server: {
      host: options.host,
      port: options.uiPort,
      strictPort: true
    }
  };
}

export async function startUiDevServer(options) {
  const vite = await createViteServer(createUiViteConfig(options));
  await vite.listen();
  return vite;
}

export async function buildUiAssets(options) {
  const uiRoot = uiRootFromNodeEntry();
  await viteBuild(
    mergeConfig(
      {
        configFile: path.resolve(uiRoot, "vite.config.ts"),
        root: uiRoot
      },
      {
        build: {
          outDir: options.outDir,
          emptyOutDir: true
        }
      }
    )
  );
}
