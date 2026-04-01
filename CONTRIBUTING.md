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

Full monorepo builds and example-runtime builds are intentionally separate:

```bash
pnpm build
pnpm build:examples
```

Use `pnpm build` to validate the whole repo, and `pnpm build:examples` to exercise the React and Vue runtime fixtures used by e2e and packaging verification.

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
