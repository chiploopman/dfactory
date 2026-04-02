# DFactory

Framework-agnostic PDF template catalog, preview, and generation platform for React and Vue.

DFactory helps teams build document workflows with:

- typed template discovery and payload validation
- a local catalog UI for previewing templates in HTML and PDF
- production API and static UI serving
- extensible rendering, framework, and PDF feature plugins

## Purpose

DFactory gives teams a consistent way to discover, preview, validate, and generate PDF-oriented templates from application code.

## Why DFactory

- Build templates as code, not as opaque documents.
- Preview and generate documents from the same runtime.
- Support both React and Vue template ecosystems.
- Keep authoring, operations, and deployment on one toolchain.

## Choose Your Path

- Bootstrap DFactory into an existing React or Vue app with [`create-dfactory`](./packages/create-dfactory/README.md).
- Run and operate DFactory with [`@dfactory/cli`](./packages/cli/README.md).
- Compose the lower-level packages directly if you are building custom tooling or platform integrations.

## Usage

### Quick Start

### 1. Scaffold into an existing React or Vue project

Run the initializer from the root of an existing app:

```bash
npm create dfactory@latest
# or
pnpm create dfactory@latest
# or
yarn create dfactory
```

Optional package-manager override:

```bash
pnpm create dfactory@latest --package-manager yarn
# npm create requires an extra separator before forwarded args
npm create dfactory@latest -- --package-manager yarn
```

What the generator adds:

- `dfactory.config.ts`
- starter templates under `src/templates/invoice` and `src/templates/invoice-reference`
- `dfactory:*` package scripts for dev, build, serve, index, and diagnostics
- the framework adapter, loader, primitives, template-kit, and PDF feature packages your app needs

### 2. Install dependencies and start DFactory

```bash
pnpm install
pnpm run dfactory:dev
```

Default local endpoints:

- API: `http://127.0.0.1:3210`
- UI: `http://127.0.0.1:3211`

### 3. Run your first workflow

1. Open `http://127.0.0.1:3211`.
2. Choose `invoice` or `invoice-reference`.
3. Edit the payload in the bottom panel.
4. Preview in HTML mode.
5. Switch to PDF mode and preview again.
6. Generate a document.

If PDF preview or generation is not available, run `pnpm run dfactory:doctor` and verify your Playwright/Chromium prerequisites.

## Install Into an Existing Project Manually

Use this path if you do not want the generator to modify your project for you.

### React

```bash
pnpm add @dfactory/cli @dfactory/core @dfactory/framework-react @dfactory/module-loader-bundle @dfactory/pdf-primitives-core @dfactory/pdf-primitives-react @dfactory/pdf-feature-standard @dfactory/template-kit zod
```

### Vue

```bash
pnpm add @dfactory/cli @dfactory/core @dfactory/framework-vue @dfactory/module-loader-vite @dfactory/pdf-primitives-core @dfactory/pdf-primitives-vue @dfactory/pdf-feature-standard @dfactory/template-kit zod
```

Then add scripts like:

```json
{
  "scripts": {
    "dfactory:dev": "dfactory dev --config dfactory.config.ts",
    "dfactory:build": "dfactory build",
    "dfactory:serve": "dfactory serve --config dfactory.config.ts",
    "dfactory:index": "dfactory index --config dfactory.config.ts",
    "dfactory:doctor": "dfactory doctor --config dfactory.config.ts"
  }
}
```

For the full setup flow, see:

- [Getting Started](./apps/docs/content/docs/getting-started.mdx)
- [Installation](./apps/docs/content/docs/installation.mdx)
- [CLI](./apps/docs/content/docs/cli.mdx)

## CLI Workflow

`@dfactory/cli` provides the operational commands most consumers use:

```bash
dfactory dev --config dfactory.config.ts
dfactory build
dfactory serve --config dfactory.config.ts
dfactory index --config dfactory.config.ts --output .dfactory/templates.index.json
dfactory doctor --config dfactory.config.ts
```

Use these commands to:

- run API and UI locally in development
- build static UI assets into `.dfactory/ui`
- serve API and built UI in production mode
- generate a template index snapshot
- diagnose plugin, loader, and Playwright issues

Full command reference: [CLI docs](./apps/docs/content/docs/cli.mdx)

## Template Authoring

The recommended authoring API is [`@dfactory/template-kit`](./packages/template-kit/README.md):

```ts
import { z } from "zod";
import { defineTemplate } from "@dfactory/template-kit";

const template = defineTemplate({
  meta: {
    id: "invoice",
    title: "Invoice",
    framework: "react",
    version: "1.0.0",
  },
  schema: z.object({
    customerName: z.string(),
  }),
  examples: [
    {
      name: "default",
      payload: { customerName: "Acme Corp" },
    },
  ],
  render(payload) {
    return `<main>Hello ${payload.customerName}</main>`;
  },
});
```

Learn more:

- [Template Authoring](./apps/docs/content/docs/template-authoring.mdx)
- [React framework guide](./apps/docs/content/docs/frameworks/react.mdx)
- [Vue framework guide](./apps/docs/content/docs/frameworks/vue.mdx)

## Package Overview

### Bootstrap and operations

- [`create-dfactory`](./packages/create-dfactory/README.md): project bootstrap generator
- [`@dfactory/cli`](./packages/cli/README.md): `dev`, `build`, `serve`, `index`, and `doctor`

### Core runtime and server

- [`@dfactory/core`](./packages/core/README.md): config, discovery, registry, and shared contracts
- [`@dfactory/server`](./packages/server/README.md): Fastify API, OpenAPI, and static UI serving
- [`@dfactory/ui`](./packages/ui/README.md): manager UI assets and `@dfactory/ui/node` integration helpers

### Framework adapters and loaders

- [`@dfactory/framework-react`](./packages/adapter-react/README.md)
- [`@dfactory/framework-vue`](./packages/adapter-vue/README.md)
- [`@dfactory/module-loader-bundle`](./packages/module-loader-bundle/README.md)
- [`@dfactory/module-loader-vite`](./packages/module-loader-vite/README.md)

### Rendering and PDF features

- [`@dfactory/renderer-playwright`](./packages/renderer-playwright/README.md)
- [`@dfactory/pdf-feature-standard`](./packages/pdf-feature-standard/README.md)
- [`@dfactory/pdf-feature-pagedjs`](./packages/pdf-feature-pagedjs/README.md)
- [`@dfactory/pdf-feature-pdf-lib`](./packages/pdf-feature-pdf-lib/README.md)

### Template authoring and primitives

- [`@dfactory/template-kit`](./packages/template-kit/README.md)
- [`@dfactory/pdf-primitives-core`](./packages/pdf-primitives-core/README.md)
- [`@dfactory/pdf-primitives-react`](./packages/pdf-primitives-react/README.md)
- [`@dfactory/pdf-primitives-vue`](./packages/pdf-primitives-vue/README.md)

## Troubleshooting

- No templates found: check `templates.globs` in `dfactory.config.ts`.
- PDF preview or generation fails: run `dfactory doctor` and verify Playwright availability.
- API and UI are not reachable: free ports `3210` and `3211`, then restart `dfactory dev`.
- Production serve mode is missing UI: run `dfactory build` before `dfactory serve`.
- Health checks:

```bash
curl http://127.0.0.1:3210/api/health
curl http://127.0.0.1:3210/api/ready
```

## Development

The root README is consumer-focused. If you are contributing to the monorepo, start here:

- [Contributing guide](./CONTRIBUTING.md)
- [GitHub and release setup](./.github/REPO_SETUP.md)

Minimum contributor validation:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Related Documentation

- [React starter](./examples/react-starter/README.md)
- [Vue starter](./examples/vue-starter/README.md)
- [Docs app](./apps/docs/README.md)
- [Docs home](./apps/docs/content/docs/index.mdx)
- [Getting Started](./apps/docs/content/docs/getting-started.mdx)
- [Installation](./apps/docs/content/docs/installation.mdx)
- [CLI](./apps/docs/content/docs/cli.mdx)
- [Template Authoring](./apps/docs/content/docs/template-authoring.mdx)
- [Deployment guide](./apps/docs/content/docs/deployment.mdx)
- [API reference](./apps/docs/content/docs/api-reference.mdx)

## License

[MIT](./LICENSE)
