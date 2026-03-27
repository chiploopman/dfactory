import { createDFactoryServer } from "./app";

export * from "./app";
export * from "./types";

export async function startDFactoryServer(options: {
  cwd: string;
  configPath?: string;
  port: number;
  host?: string;
  isProduction?: boolean;
  uiDistDir?: string;
  corsOrigins?: string[];
}) {
  const app = await createDFactoryServer({
    cwd: options.cwd,
    configPath: options.configPath,
    port: options.port,
    host: options.host,
    isProduction: options.isProduction,
    uiDistDir: options.uiDistDir,
    corsOrigins: options.corsOrigins
  });

  await app.listen({
    port: options.port,
    host: options.host ?? "0.0.0.0"
  });

  return app;
}
