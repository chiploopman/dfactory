# DFactory

Storybook-inspired PDF template catalog, preview, and generation platform for React and Vue ecosystems.

## Purpose

DFactory provides a production-ready workflow for:

- discovering templates from source code
- validating payloads with schemas
- previewing in HTML/PDF
- generating documents through a plugin-extensible rendering pipeline

It is designed for both product teams shipping document workflows and contributors building framework/runtime extensions.

## Usage

### Quick Start (Monorepo)

```bash
nvm use
pnpm install
pnpm dev
```

Default endpoints:

- API: `http://127.0.0.1:3210`
- UI: `http://127.0.0.1:3211`

### Core Commands

```bash
pnpm dev
pnpm dev:vue
pnpm build
pnpm build:examples
pnpm serve
pnpm serve:vue
pnpm index
pnpm index:vue
pnpm doctor
pnpm doctor:vue
pnpm test
pnpm test:e2e
pnpm verify:clean-room
```

### Official Docs App

```bash
pnpm docs:dev
```

Docs app default URL: `http://127.0.0.1:3333/docs`

## Development

### Required Validation Before Merge

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm docs:ci
```

The React and Vue example workspaces are internal runtime fixtures. They intentionally exercise the same `dfactory` CLI contract that published consumers use.

If you change CI, release, packaging, or fixture plumbing, also run:

```bash
pnpm verify:clean-room
```

### Docs Maintenance Commands

```bash
pnpm docs:sync-openapi
pnpm docs:check-links
pnpm docs:validate-frontmatter
pnpm docs:check-readmes
```

### Releases

Published package changes should include a changeset:

```bash
pnpm changeset
```

Additional maintainer docs:

- Contribution guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- GitHub and release setup: [.github/REPO_SETUP.md](./.github/REPO_SETUP.md)

## Troubleshooting

- Templates not loading: validate `templates.globs` in `dfactory.config.ts`.
- PDF preview/generation fails: run `pnpm doctor` and verify Playwright availability.
- UI/API port conflicts: free ports `3210` and `3211`, then restart dev.
- Docs build errors: use Node `20` via `.nvmrc`, run `pnpm --filter @dfactory/docs typecheck`, and regenerate `.source` via docs postinstall.

## Related Documentation

- Official docs site: [/docs](/docs)
- Docs app package: [apps/docs/README.md](./apps/docs/README.md)
- Architecture guardrails: [docs/architecture-guardrails.md](./docs/architecture-guardrails.md)
- Deployment manifests: `deploy/`
