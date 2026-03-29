# @dfactory/server

## Purpose

`@dfactory/server` is the Fastify API layer for dFactory.

It provides:

- template metadata/schema/features/source endpoints
- preflight/preview/generate document endpoints
- OpenAPI + Swagger UI endpoints
- optional static serving of built manager UI

## Usage

Programmatic startup:

```ts
import { startDFactoryServer } from "@dfactory/server";

await startDFactoryServer({
  cwd: process.cwd(),
  configPath: "dfactory.config.ts",
  port: 3210,
  host: "0.0.0.0",
  isProduction: true,
});
```

Health endpoints:

```bash
curl http://127.0.0.1:3210/api/health
curl http://127.0.0.1:3210/api/ready
```

## Development

```bash
pnpm --filter @dfactory/server typecheck
pnpm --filter @dfactory/server test
pnpm --filter @dfactory/server build
```

Keep route contract changes synchronized with OpenAPI snapshot via `pnpm docs:sync-openapi`.

## Troubleshooting

- 403 responses in prod: verify auth mode/API key settings.
- source endpoint disabled in prod: check `ui.sourceInProd` config.
- UI static fallback missing: ensure `.dfactory/ui` exists before serve.

## Related Documentation

- [API Reference](/docs/api-reference)
- [Deployment](/docs/deployment)
