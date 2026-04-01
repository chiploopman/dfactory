# Changesets Workflow

Use Changesets for every pull request that changes a published package.

## Add a changeset

```bash
pnpm changeset
```

Choose the affected public package, describe the user-facing change, and commit the generated markdown file.

## Release flow

1. Merge changesets into `main`.
2. GitHub Actions opens or updates the release PR.
3. Merge the release PR to publish the lockstep package suite to npm.

Private workspace packages such as `@dfactory/docs` and the example apps are excluded from publishing.
