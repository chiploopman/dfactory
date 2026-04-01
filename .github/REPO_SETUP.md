# Repository Setup

This repository is already past its first npm bootstrap publish.

From this point forward, the normal release path is:

1. contributors add changesets
2. `main` updates trigger [`release.yml`](./workflows/release.yml)
3. Changesets opens or updates the automated release PR
4. merging that PR publishes packages to npm through npm trusted publishing and GitHub OIDC

## Active Workflows

- [`ci.yml`](./workflows/ci.yml): required quality, docs, e2e, and `packages` tarball validation
- [`dependency-review.yml`](./workflows/dependency-review.yml): dependency risk review on pull requests
- [`release.yml`](./workflows/release.yml): release PR creation and npm publish

There is no day-to-day bootstrap workflow anymore. If you still have an old `NPM_TOKEN` secret from the first publish, delete it.

## Public Package Set

The publish set is defined in [`../.changeset/config.json`](../.changeset/config.json):

- `@dfactory/cli`
- `@dfactory/core`
- `@dfactory/framework-react`
- `@dfactory/framework-vue`
- `@dfactory/module-loader-bundle`
- `@dfactory/module-loader-vite`
- `@dfactory/pdf-feature-pagedjs`
- `@dfactory/pdf-feature-pdf-lib`
- `@dfactory/pdf-feature-standard`
- `@dfactory/pdf-primitives-core`
- `@dfactory/pdf-primitives-react`
- `@dfactory/pdf-primitives-vue`
- `@dfactory/renderer-playwright`
- `@dfactory/server`
- `@dfactory/template-kit`
- `@dfactory/ui`
- `create-dfactory`

## Required GitHub Settings

Open:

`Repository -> Settings`

### 1. Actions

Go to:

`Settings -> Actions -> General`

Set:

1. GitHub Actions enabled
2. Actions and reusable workflows allowed for this repository
3. `Workflow permissions` set to `Read and write permissions`
4. `Allow GitHub Actions to create and approve pull requests` enabled

Why this matters:

- `release.yml` needs to create and update the automated release PR
- npm trusted publishing needs GitHub-hosted runners

### 2. Branch protection

Protect `main` and require these checks before merge:

- `quality`
- `docs`
- `packages`
- `e2e`

Recommended:

- require pull requests before merging
- prefer squash merges
- restrict direct pushes to `main`

### 3. Code scanning

Enable GitHub Code Scanning default setup.

Open:

`Settings -> Security -> Code security and analysis`

Then enable `Code scanning` default setup.

This repository uses JavaScript and TypeScript, and GitHub recommends default setup for eligible repositories because it is lower maintenance than a custom CodeQL workflow.

### 4. Dependency graph and dependency review

Open:

`Settings -> Security -> Code security and analysis`

Then enable:

- `Dependency graph`
- `Dependabot alerts`

Why this matters:

- [`dependency-review.yml`](./workflows/dependency-review.yml) depends on GitHub dependency graph support
- pull requests will otherwise fail with a repository-settings error even if the workflow file is correct

## Required npm Setup

### 1. Keep the `@dfactory` scope and `create-dfactory` ownership healthy

- `@dfactory/*` packages must remain publishable by the npm org or user that owns the `dfactory` scope
- `create-dfactory` must remain owned by an npm user that the maintainers control

### 2. Configure trusted publishing for every public package

This is the steady-state publish path. Do this for each package listed above.

Open npm and go to the package settings page:

`npmjs.com -> Packages -> <package-name> -> Settings -> Trusted publishing`

Use:

- Provider: `GitHub Actions`
- Organization or user: `chiploopman`
- Repository: `dfactory`
- Workflow filename: `release.yml`
- Environment name: leave empty unless you later protect releases with a GitHub Environment

Important:

- configure the trusted publisher on every public package
- use the filename only: `release.yml`
- do not enter the full path
- keep releases on GitHub-hosted runners

### 3. Remove old bootstrap token secrets

After the first publish, the repository should not rely on long-lived npm publish tokens anymore.

Open:

`Repository -> Settings -> Secrets and variables -> Actions`

Then:

1. delete `NPM_TOKEN` if it still exists
2. do not create a `GITHUB_TOKEN` secret; GitHub provides that automatically

## How Releases Work

### Contributor flow

1. Make code changes
2. If a public package changes, run:

```bash
pnpm changeset
```

3. Commit the generated file in `.changeset/`
4. Open and merge the pull request into `main`

### Maintainer flow

1. Wait for `release.yml` to open or update the release PR
2. Review the version bumps and changelog entries
3. Merge the release PR
4. GitHub Actions publishes the packages to npm

The publish command already runs the repo’s pack and smoke verification before `changeset publish`.

## Post-Release Verification

After a real publish:

1. Open the package on npm and confirm the new version exists
2. Verify the package page shows trusted publishing metadata
3. Verify provenance is present for the release
4. Spot-check one or two packages with:

```bash
npm view @dfactory/core version
npm view create-dfactory version
```

## Archived Bootstrap Guidance

This is only for the future case where you introduce a brand-new npm package name that does not yet exist on npm.

Because npm trusted publishers are configured per package after the package exists, a brand-new package name needs a one-time bootstrap publish before it can switch to OIDC.

Use this only if you add a new public package name later:

1. create a short-lived granular npm token with write access from the account that owns the target package name
2. store it temporarily as `NPM_TOKEN` in GitHub Actions secrets
3. perform the one-time bootstrap publish from a tightly controlled branch or manual temporary workflow
4. configure trusted publishing for the new package
5. delete the GitHub secret
6. revoke the npm token

This archived procedure is not part of normal releases for the current package set.

## Operational Notes

- The pnpm version is pinned in [`../package.json`](../package.json) via `packageManager`
- workflows intentionally do not pass a second pnpm version to `pnpm/action-setup`
- published library packages use `tsdown` for builds; `@dfactory/ui` continues to use Vite
- Playwright CI boots the React and Vue example workspaces directly instead of root wrapper configs
- trusted publishing automatically generates npm provenance for GitHub Actions releases
- self-hosted runners are not supported for npm trusted publishing

## Official References

- Changesets action: https://github.com/changesets/action
- npm trusted publishing: https://docs.npmjs.com/trusted-publishers/
- GitHub Node package publishing: https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages
- GitHub Actions hardening: https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- GitHub code scanning default setup: https://docs.github.com/code-security/code-scanning/automatically-scanning-your-code-for-vulnerabilities-and-errors/setting-up-code-scanning-for-a-repository
