# Contributing

## Development

Install dependencies and start the workspace:

```bash
pnpm install
pnpm dev
```

Required validation before merge:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm docs:ci
```

GitHub CI responsibilities are intentionally split:

- `quality` covers the publishable/runtime workspace on Node 20 and Node 24.
- `docs` owns the private Next/Fumadocs docs app on Node 20.
- `packages` validates publishable tarballs.
- `e2e` verifies the React and Vue runtime fixtures on Node 20.

The docs app is intentionally not part of the Node 24 compatibility promise.

Full monorepo builds and example-runtime builds are intentionally separate:

```bash
pnpm build
pnpm build:examples
```

Use `pnpm build` to validate the whole repo, and `pnpm build:examples` to exercise the React and Vue runtime fixtures used by e2e and packaging verification.

The example workspaces are internal runtime fixtures and intentionally use the same `dfactory` CLI contract as published consumers.

If your change touches CI, release, packaging, or runtime-fixture plumbing, also run:

```bash
nvm use 20
pnpm verify:clean-room
pnpm verify:quality-node24
```

`pnpm verify:quality-node24` runs the `quality` path inside the official Linux `node:24-bookworm` Docker image, so Docker must be available locally. It uses Turbo's documented `--concurrency` flag for the package-test phase to keep the local container run stable on typical Docker Desktop memory limits while exercising the same checks as CI.

## Changesets

If your pull request changes any published package, add a changeset:

```bash
pnpm changeset
```

The release PR is the only place where package versions should change on `main`.

## Review checklist

- Keep public API contracts compatible unless the changeset clearly documents a breaking change.
- Avoid reverting unrelated work in the repository.
- Include tests when changing runtime behavior, packaging, or CI automation.
