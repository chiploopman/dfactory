import path from "node:path";
import { bundleRequire } from "bundle-require";
import { z } from "zod";

import { COMPAT_TEMPLATE_GLOB, DEFAULT_CONFIG } from "./defaults";
import type { DFactoryConfig } from "./types";
import { fileExists } from "./utils";

const configSchema = z.object({
  templates: z
    .object({
      globs: z.array(z.string()).optional(),
      ignore: z.array(z.string()).optional(),
      compatibilityGlobEnabled: z.boolean().optional()
    })
    .optional(),
  plugins: z.array(z.string()).optional(),
  moduleLoader: z.string().optional(),
  auth: z
    .object({
      mode: z.literal("apiKey").optional(),
      apiKeys: z.array(z.string()).optional(),
      hookModule: z.string().optional()
    })
    .optional(),
  ui: z
    .object({
      exposeInProd: z.boolean().optional(),
      sourceInProd: z.boolean().optional(),
      playgroundInProd: z.boolean().optional()
    })
    .optional(),
  renderer: z
    .object({
      engine: z.literal("playwright").optional(),
      poolSize: z.number().int().positive().optional(),
      timeoutMs: z.number().int().positive().optional()
    })
    .optional()
});

const CONFIG_FILE_CANDIDATES = [
  "dfactory.config.ts",
  "dfactory.config.mts",
  "dfactory.config.js",
  "dfactory.config.mjs"
];

async function resolveConfigPath(cwd: string, provided?: string): Promise<string | undefined> {
  if (provided) {
    return path.isAbsolute(provided) ? provided : path.resolve(cwd, provided);
  }

  for (const candidate of CONFIG_FILE_CANDIDATES) {
    const fullPath = path.resolve(cwd, candidate);
    if (await fileExists(fullPath)) {
      return fullPath;
    }
  }

  return undefined;
}

export async function loadDFactoryConfig(
  cwd: string,
  providedPath?: string
): Promise<{ config: DFactoryConfig; resolvedPath?: string }> {
  const resolvedPath = await resolveConfigPath(cwd, providedPath);
  if (!resolvedPath) {
    return {
      config: {
        ...DEFAULT_CONFIG,
        templates: {
          ...DEFAULT_CONFIG.templates,
          globs: [...DEFAULT_CONFIG.templates.globs],
          ignore: [...(DEFAULT_CONFIG.templates.ignore ?? [])]
        },
        plugins: [...DEFAULT_CONFIG.plugins],
        moduleLoader: DEFAULT_CONFIG.moduleLoader,
        auth: { ...DEFAULT_CONFIG.auth, apiKeys: [...(DEFAULT_CONFIG.auth.apiKeys ?? [])] },
        ui: { ...DEFAULT_CONFIG.ui },
        renderer: { ...DEFAULT_CONFIG.renderer }
      }
    };
  }

  const loaded = await bundleRequire<{ default?: unknown } | unknown>({
    filepath: resolvedPath,
    cwd,
    format: "esm"
  });

  const raw =
    (loaded.mod as { default?: unknown }).default ??
    (loaded.mod as unknown as Record<string, unknown>);

  const parsed = configSchema.parse(raw ?? {});

  const config: DFactoryConfig = {
    templates: {
      globs: parsed.templates?.globs ?? [...DEFAULT_CONFIG.templates.globs],
      ignore: parsed.templates?.ignore ?? [...(DEFAULT_CONFIG.templates.ignore ?? [])],
      compatibilityGlobEnabled:
        parsed.templates?.compatibilityGlobEnabled ?? DEFAULT_CONFIG.templates.compatibilityGlobEnabled
    },
    plugins: parsed.plugins ?? [...DEFAULT_CONFIG.plugins],
    moduleLoader: parsed.moduleLoader ?? DEFAULT_CONFIG.moduleLoader,
    auth: {
      mode: parsed.auth?.mode ?? DEFAULT_CONFIG.auth.mode,
      apiKeys: parsed.auth?.apiKeys ?? [...(DEFAULT_CONFIG.auth.apiKeys ?? [])],
      hookModule: parsed.auth?.hookModule ?? DEFAULT_CONFIG.auth.hookModule
    },
    ui: {
      exposeInProd: parsed.ui?.exposeInProd ?? DEFAULT_CONFIG.ui.exposeInProd,
      sourceInProd: parsed.ui?.sourceInProd ?? DEFAULT_CONFIG.ui.sourceInProd,
      playgroundInProd: parsed.ui?.playgroundInProd ?? DEFAULT_CONFIG.ui.playgroundInProd
    },
    renderer: {
      engine: parsed.renderer?.engine ?? DEFAULT_CONFIG.renderer.engine,
      poolSize: parsed.renderer?.poolSize ?? DEFAULT_CONFIG.renderer.poolSize,
      timeoutMs: parsed.renderer?.timeoutMs ?? DEFAULT_CONFIG.renderer.timeoutMs
    }
  };

  if (config.templates.compatibilityGlobEnabled) {
    config.templates.globs = [...config.templates.globs, COMPAT_TEMPLATE_GLOB];
  }

  return { config, resolvedPath };
}
