import type { ViteDevServer } from "vite";

export interface StartUiDevServerOptions {
  host: string;
  uiPort: number;
  apiUrl: string;
}

export interface BuildUiAssetsOptions {
  outDir: string;
}

export declare function startUiDevServer(options: StartUiDevServerOptions): Promise<ViteDevServer>;
export declare function buildUiAssets(options: BuildUiAssetsOptions): Promise<void>;
