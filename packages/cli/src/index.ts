#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { createRegistry } from "@dfactory/core";
import { startDFactoryServer } from "@dfactory/server";
import { buildUiAssets, startUiDevServer } from "@dfactory/ui/node";
import { Command } from "commander";
import { chromium } from "playwright";

function normalizeHost(host: string): string {
  if (host === "0.0.0.0") {
    return "127.0.0.1";
  }
  return host;
}

async function runDev(options: {
  port: number;
  uiPort: number;
  host: string;
  config?: string;
  cwd: string;
}) {
  const apiHost = normalizeHost(options.host);

  const app = await startDFactoryServer({
    cwd: options.cwd,
    configPath: options.config,
    port: options.port,
    host: options.host,
    isProduction: false,
    corsOrigins: [`http://${apiHost}:${options.uiPort}`]
  });

  const vite = await startUiDevServer({
    host: options.host,
    uiPort: options.uiPort,
    apiUrl: `http://${apiHost}:${options.port}/api`
  });

  console.log(`\nDFactory API:  http://${apiHost}:${options.port}`);
  console.log(`DFactory UI:   http://${apiHost}:${options.uiPort}`);

  const close = async () => {
    await vite.close();
    await app.close();
    process.exit(0);
  };

  process.on("SIGINT", close);
  process.on("SIGTERM", close);
}

async function runBuild(options: { cwd: string; uiOutDir?: string }) {
  const outDir = options.uiOutDir ?? path.resolve(options.cwd, ".dfactory/ui");

  await fs.mkdir(path.dirname(outDir), { recursive: true });

  await buildUiAssets({ outDir });

  const manifestPath = path.resolve(options.cwd, ".dfactory/build.json");
  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.writeFile(
    manifestPath,
    JSON.stringify(
      {
        builtAt: new Date().toISOString(),
        uiOutDir: outDir
      },
      null,
      2
    )
  );

  console.log(`DFactory UI built to ${outDir}`);
}

async function runServe(options: {
  port: number;
  host: string;
  config?: string;
  cwd: string;
  uiDistDir?: string;
}) {
  await startDFactoryServer({
    cwd: options.cwd,
    configPath: options.config,
    port: options.port,
    host: options.host,
    isProduction: true,
    uiDistDir: options.uiDistDir ?? path.resolve(options.cwd, ".dfactory/ui")
  });

  const host = normalizeHost(options.host);
  console.log(`DFactory server running at http://${host}:${options.port}`);
}

async function runIndex(options: { cwd: string; config?: string; output?: string }) {
  const registry = await createRegistry({
    cwd: options.cwd,
    configPath: options.config
  });

  try {
    const index = await registry.buildIndex();
    const outputPath = options.output ? path.resolve(options.cwd, options.output) : path.resolve(options.cwd, ".dfactory/templates.index.json");

    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(index, null, 2));

    console.log(`Template index written to ${outputPath}`);
  } finally {
    await registry.close();
  }
}

async function runDoctor(options: { cwd: string; config?: string }) {
  const checks: Array<{ name: string; ok: boolean; message: string }> = [];

  const major = Number(process.versions.node.split(".")[0]);
  checks.push({
    name: "Node.js version",
    ok: major >= 20,
    message: `Detected ${process.versions.node}; required >= 20`
  });

  try {
    const registry = await createRegistry({
      cwd: options.cwd,
      configPath: options.config
    });

    try {
      checks.push({
        name: "Template discovery",
        ok: registry.listTemplates().length > 0,
        message: `Discovered ${registry.listTemplates().length} template(s)`
      });

      checks.push({
        name: "Plugin loading",
        ok: true,
        message: `Loaded plugins: ${registry.getRuntimeInfo().pluginIds.join(", ")}`
      });

      checks.push({
        name: "Module loader",
        ok: true,
        message: `Resolved module loader: ${registry.getRuntimeInfo().moduleLoader}`
      });

      const pluginChecks = await registry.runPluginDoctorChecks();
      checks.push(...pluginChecks);
    } finally {
      await registry.close();
    }
  } catch (error) {
    checks.push({
      name: "Template discovery",
      ok: false,
      message: error instanceof Error ? error.message : "Unknown discovery error"
    });
  }

  try {
    const executable = chromium.executablePath();
    checks.push({
      name: "Playwright browser",
      ok: Boolean(executable),
      message: executable ? `Chromium executable: ${executable}` : "Chromium executable not found"
    });
  } catch (error) {
    checks.push({
      name: "Playwright browser",
      ok: false,
      message: error instanceof Error ? error.message : "Failed to resolve Playwright browser"
    });
  }

  for (const check of checks) {
    const marker = check.ok ? "[ok]" : "[fail]";
    console.log(`${marker} ${check.name}: ${check.message}`);
  }

  if (checks.some((check) => !check.ok)) {
    process.exitCode = 1;
  }
}

const program = new Command();
program.name("dfactory").description("DFactory CLI").version("0.1.0");

program
  .command("dev")
  .description("Run API server and UI in development mode")
  .option("--port <port>", "API port", "3210")
  .option("--ui-port <port>", "UI port", "3211")
  .option("--host <host>", "Bind host", "0.0.0.0")
  .option("--config <path>", "Path to dfactory config")
  .action(async (opts) => {
    await runDev({
      cwd: process.cwd(),
      config: opts.config,
      host: String(opts.host),
      port: Number(opts.port),
      uiPort: Number(opts.uiPort)
    });
  });

program
  .command("build")
  .description("Build DFactory UI assets for production")
  .option("--ui-out-dir <path>", "Output directory for built UI")
  .action(async (opts) => {
    await runBuild({
      cwd: process.cwd(),
      uiOutDir: opts.uiOutDir ? path.resolve(process.cwd(), String(opts.uiOutDir)) : undefined
    });
  });

program
  .command("serve")
  .description("Serve DFactory API and static UI in production mode")
  .option("--port <port>", "Server port", "3210")
  .option("--host <host>", "Bind host", "0.0.0.0")
  .option("--config <path>", "Path to dfactory config")
  .option("--ui-dist-dir <path>", "Path to built UI assets")
  .action(async (opts) => {
    await runServe({
      cwd: process.cwd(),
      config: opts.config,
      host: String(opts.host),
      port: Number(opts.port),
      uiDistDir: opts.uiDistDir ? path.resolve(process.cwd(), String(opts.uiDistDir)) : undefined
    });
  });

program
  .command("index")
  .description("Generate template index JSON")
  .option("--config <path>", "Path to dfactory config")
  .option("--output <path>", "Output path", ".dfactory/templates.index.json")
  .action(async (opts) => {
    await runIndex({
      cwd: process.cwd(),
      config: opts.config,
      output: opts.output
    });
  });

program
  .command("doctor")
  .description("Check local DFactory runtime prerequisites")
  .option("--config <path>", "Path to dfactory config")
  .action(async (opts) => {
    await runDoctor({
      cwd: process.cwd(),
      config: opts.config
    });
  });

await program.parseAsync(process.argv);
