import path from "node:path";

import { bundleRequire } from "bundle-require";
import type { FastifyReply, FastifyRequest } from "fastify";

import type { DFactoryRegistry } from "@dfactory/core";
import type { AuthHook } from "./types";

const authHookCache = new Map<string, AuthHook>();

export async function loadAuthHook(cwd: string, hookModule?: string): Promise<AuthHook | undefined> {
  if (!hookModule) {
    return undefined;
  }

  const cacheKey = `${cwd}:${hookModule}`;
  const cached = authHookCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const resolved = hookModule.startsWith(".") ? path.resolve(cwd, hookModule) : hookModule;
  const loaded = await bundleRequire<{ default?: unknown } | unknown>({
    filepath: resolved,
    cwd,
    format: "esm"
  });

  const hook =
    (loaded.mod as { default?: unknown }).default ??
    (loaded.mod as unknown as Record<string, unknown>).authHook;

  if (typeof hook !== "function") {
    throw new Error(`Auth hook module '${hookModule}' must export a function.`);
  }

  authHookCache.set(cacheKey, hook as AuthHook);
  return hook as AuthHook;
}

export async function authorizeRequest(options: {
  request: FastifyRequest;
  reply: FastifyReply;
  registry: DFactoryRegistry;
  cwd: string;
}): Promise<boolean> {
  const config = options.registry.getConfig();
  const apiKeys = config.auth.apiKeys ?? [];

  if (apiKeys.length > 0) {
    const incoming = options.request.headers["x-dfactory-key"];
    if (typeof incoming !== "string" || !apiKeys.includes(incoming)) {
      await options.reply.code(401).send({
        error: "Unauthorized",
        message: "Missing or invalid x-dfactory-key header."
      });
      return false;
    }
  }

  const hook = await loadAuthHook(options.cwd, config.auth.hookModule);
  if (hook) {
    await hook({ request: options.request, registry: options.registry });
  }

  return true;
}
