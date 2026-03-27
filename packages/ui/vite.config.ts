import path from "node:path";

import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    }
  },
  css: {
    postcss: path.resolve(__dirname, "postcss.config.cjs")
  },
  server: {
    port: Number(process.env.DFACTORY_UI_PORT ?? 3211),
    host: "0.0.0.0"
  }
});
