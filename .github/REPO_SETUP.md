# Repository Setup

This repository uses two release paths:

- One-time bootstrap publish: [`release-bootstrap.yml`](./workflows/release-bootstrap.yml)
- Steady-state releases after bootstrap: [`release.yml`](./workflows/release.yml)

The bootstrap workflow uses a temporary npm token only once. The long-term workflow uses npm trusted publishing with GitHub OIDC and does not require a long-lived npm token.

## Before You Start

Make sure all of the following are true before you try to publish anything:

1. GitHub Actions is enabled for this repository.
2. The workflow files are already on the default branch.
3. Your npm account has publish rights for the `@dfactory` scope and the `create-dfactory` package name.
4. You plan to run release jobs on GitHub-hosted runners. npm trusted publishing does not support self-hosted runners.

Public packages for this repo are defined in [`../.changeset/config.json`](../.changeset/config.json). At the time of writing, that publish set is:

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

## How To Set Up npm Publish Rights

This repo publishes two kinds of package names:

- scoped packages under `@dfactory/*`
- one unscoped package: `create-dfactory`

These are configured differently on npm.

### `@dfactory/*` scope

The clean setup is to use an npm organization named `dfactory`.

1. Sign in to npm with the account that should control the scope.
2. Create an organization named `dfactory`.
   - On npm, the organization name becomes the scope, so `dfactory` becomes `@dfactory`.
3. If you are the only maintainer, keep your npm user as an `Owner`.
4. If you have multiple maintainers:
   - invite them into the `dfactory` organization
   - optionally create a team
   - give that team `read/write` package access

Important:

- npm says organization `Owner`, `Admin`, and `Member` roles can create and publish packages in the organization scope.
- npm also says write access for existing public organization packages is controlled through team `read/write` access.
- For a solo maintainer, being the org `Owner` is the simplest path.
- For a team, use org membership plus team `read/write` access.

### `create-dfactory`

This package is unscoped, so it is controlled by an npm user account, not by an npm organization.

What this means in plain English:

- there is no special npm scope or organization to configure for `create-dfactory`
- there is no separate npm settings page you must prepare before the first publish
- the npm user account that performs the first successful publish becomes the account that controls the package

The setup is:

1. Pick one npm user account that you want to be the initial owner of `create-dfactory`.
2. Sign in to npm with that exact user account.
3. Use that same account to create the bootstrap `NPM_TOKEN`.
4. Run the bootstrap workflow with that token.
5. After the first publish succeeds, that user account is the package owner/maintainer for `create-dfactory`.
6. Only after the package exists, manage additional maintainers if needed.

After the first publish, verify owners with:

```bash
npm owner ls create-dfactory
```

If needed, add another maintainer with:

```bash
npm owner add <npm-username> create-dfactory
```

Important:

- npm says only user accounts can create and manage unscoped packages.
- That means the account behind your bootstrap `NPM_TOKEN` must itself be allowed to publish `create-dfactory`.
- For an unscoped package that does not exist yet, the practical rule is: publish it first from the user account that should control it, then use `npm owner` afterward if you want to share control. This is an inference from npm's unscoped publish flow plus the `npm owner` docs.

### Quick checklist for `create-dfactory`

Before first publish:

1. Log in to npm in the browser with your chosen owner account.
2. Make sure this is the same account you will use to generate the bootstrap token.
3. Make sure the package name is the one you actually want: `create-dfactory`.

First publish:

1. Generate `NPM_TOKEN` from that user account.
2. Put it into GitHub Actions secrets as `NPM_TOKEN`.
3. Run `Release Bootstrap`.

After first publish:

1. Open `https://www.npmjs.com/package/create-dfactory`
2. Verify the package exists and shows as public.
3. Run `npm owner ls create-dfactory`
4. Add other maintainers only if needed.

### What account should create the bootstrap token?

Use an npm user account that satisfies both of these:

1. it is allowed to publish into the `@dfactory` scope
2. it is an owner/maintainer of `create-dfactory`

If one account does not have both permissions, the bootstrap workflow will fail.

### If a name is already taken

Inference from npm package/scope rules:

- if you cannot create the `dfactory` organization, the `@dfactory` scope is already controlled by someone else
- if you cannot publish `create-dfactory`, that unscoped package name is already owned by another npm user or already exists

In that case you must do one of these:

- use the existing rightful owner account
- have the current owner add/transfer access
- choose a different package name or scope

## Important Token Rules

### `GITHUB_TOKEN`

Do not create this yourself.

GitHub automatically provides `secrets.GITHUB_TOKEN` to workflow jobs. This repository already uses that built-in token in [`release.yml`](./workflows/release.yml). You should not create a repository secret named `GITHUB_TOKEN`, and you should not paste a personal access token into GitHub for this workflow.

### `NPM_TOKEN`

This is needed only for the very first publish, because npm trusted publishers can only be configured after the packages exist on npm.

Use a short-lived npm granular access token, store it in GitHub as a repository Actions secret named exactly `NPM_TOKEN`, use it once with the bootstrap workflow, then delete the GitHub secret and revoke the npm token.

## Recommended Repository Settings

- Protect `main`
- Require the `quality`, `docs`, and `e2e` checks before merge
- Require pull requests before merging to `main`
- Prefer squash merges

## GitHub Repository Settings

These settings are all in GitHub at:

`Repository -> Settings`

### 1. Actions permissions

Open:

`Settings -> Actions -> General`

Then:

1. Make sure GitHub Actions is enabled.
2. Under `Actions permissions`, allow the actions used by this repository.
3. If you want the simplest setup, choose the option that allows actions and reusable workflows.
4. If your repository uses a restrictive allowlist, make sure at least these actions are allowed:
   - `actions/checkout`
   - `actions/setup-node`
   - `actions/upload-artifact`
   - `pnpm/action-setup`
   - `changesets/action`

### 2. Workflow permissions

Still in:

`Settings -> Actions -> General`

Then:

1. Under `Workflow permissions`, select `Read and write permissions`.
2. Turn on `Allow GitHub Actions to create and approve pull requests`.

This is important because the release workflow uses Changesets to open and update the automated release PR.

### 3. Branch protection

Open:

`Settings -> Rules` or `Settings -> Branches`

Protect `main` and require these checks:

- `quality`
- `docs`
- `e2e`

## One-Time Bootstrap Publish

Use this only for the very first release of brand-new npm package names.

### Step 1. Create the npm token

Open npm in your browser and sign in to the account that has publish access.

Go to:

`npmjs.com -> profile picture -> Access Tokens`

Then:

1. Click `Generate New Token`.
2. Create a granular access token.
3. Give it a clear name such as `dfactory-bootstrap-release`.
4. Set a short expiration.
   - Recommendation: `1 day` if you plan to publish immediately.
5. Give it write access.
6. Copy the token value immediately and save it temporarily somewhere safe.

Important:

- npm only shows the full token once.
- If your npm account or package policy requires 2FA for publish, the token may need the `Bypass two-factor authentication` option enabled for this one-time bootstrap publish.
- This token should be temporary. Revoke it after the bootstrap succeeds.

Inference from the npm docs: for brand-new package names, the least error-prone bootstrap setup is a short-lived granular token with write access and immediate revocation after use. The docs explain granular tokens and token creation, but they do not spell out a single recommended package-selection strategy for a first publish of multiple new packages.

### Step 2. Add `NPM_TOKEN` to GitHub

Open:

`Repository -> Settings -> Secrets and variables -> Actions`

Then:

1. Click `Secrets`.
2. Click `New repository secret`.
3. In `Name`, enter `NPM_TOKEN`.
4. In `Secret`, paste the npm token value.
5. Click `Add secret`.

Use the exact name `NPM_TOKEN`. The bootstrap workflow maps that secret into `NODE_AUTH_TOKEN` for npm during publish.

### Step 3. Make sure the first version is the one you want

The bootstrap workflow publishes whatever versions are already in the package manifests.

Before running it:

1. Verify package versions in the repo are correct.
2. Verify local checks pass:
   - `pnpm lint`
   - `pnpm typecheck`
   - `pnpm test`
   - `pnpm test:e2e`
   - `pnpm docs:ci`
   - `pnpm release:pack`
   - `pnpm release:smoke`

### Step 4. Run the bootstrap workflow

Open:

`Repository -> Actions -> Release Bootstrap`

Then:

1. Click `Run workflow`.
2. Choose the `main` branch.
3. Start the workflow.
4. Wait for it to finish.

If it succeeds, your public packages should now exist on npm.

### Step 5. Clean up the bootstrap token

Do this immediately after a successful first publish.

1. Delete the `NPM_TOKEN` repository secret from GitHub.
2. Revoke the npm access token on npmjs.com.

At that point, token-based publishing should no longer be your normal path.

## Long-Term Trusted Publishing Setup

After the first publish, switch to npm trusted publishing.

### Step 1. Open each package on npm

For each published public package:

1. Open the package page on npm.
2. Go to `Settings`.
3. Find `Trusted publishing`.
4. Choose `GitHub Actions`.

You must repeat this for each public package. npm allows only one trusted publisher configuration per package.

### Step 2. Enter the repo values

Use these exact values for this repository:

- Organization or user: `chiploopman`
- Repository: `dfactory`
- Workflow filename: `release.yml`
- Environment name: leave blank

Important:

- Enter only `release.yml`, not `.github/workflows/release.yml`.
- The filename must match exactly, including `.yml`.
- The workflow must run on GitHub-hosted runners.

### Step 3. Keep the workflow as the OIDC publisher

The steady-state workflow in [`release.yml`](./workflows/release.yml) is already configured for this:

- `permissions` includes `id-token: write`
- it uses `actions/setup-node` with the npm registry URL
- it uses the built-in `GITHUB_TOKEN`

You do not need to add a long-term npm token secret for this workflow.

### Step 4. Optionally harden npm package settings

After trusted publishing is working, npm recommends tightening package publishing access:

1. Open each package on npm.
2. Go to `Settings -> Publishing access`.
3. Choose `Require two-factor authentication and disallow tokens`.
4. Save.

This blocks traditional token-based publishing while still allowing trusted publishing through OIDC.

## Normal Release Flow After Bootstrap

1. For the very first publish only, run `.github/workflows/release-bootstrap.yml`, because npm trusted publishers are configured per package after the package exists on npm.
2. Configure each public npm package with a trusted publisher for `.github/workflows/release.yml`, then remove the `NPM_TOKEN` secret.
3. Contributors add changesets in PRs that affect published packages.
4. Merging to `main` updates or creates the automated release PR.
5. Merging the release PR publishes public packages to npm via GitHub OIDC and creates GitHub releases.

In practice, that means:

1. A feature PR adds code plus a changeset.
2. That PR merges into `main`.
3. `Release` workflow runs and opens or updates the release PR.
4. You review that release PR.
5. You merge the release PR.
6. The next `Release` workflow run publishes to npm and creates GitHub releases.

## Safety Notes

- Never commit tokens into `.npmrc`, workflow files, or source files.
- Never put your npm token in GitHub repository variables. Use repository secrets.
- Never create a manual GitHub secret called `GITHUB_TOKEN` for this setup.
- Revoke bootstrap tokens after use.
- Keep release jobs on GitHub-hosted runners for trusted publishing.

## Troubleshooting

### Release workflow cannot open a PR

Check:

1. `Settings -> Actions -> General -> Workflow permissions -> Read and write permissions`
2. `Allow GitHub Actions to create and approve pull requests` is enabled

### npm trusted publishing fails with `ENEEDAUTH`

Check:

1. The npm trusted publisher points to `chiploopman / dfactory / release.yml`
2. The filename matches exactly
3. The workflow is running on GitHub-hosted runners
4. The package `repository.url` matches the GitHub repository URL exactly

### Bootstrap publish fails with npm auth errors

Check:

1. The GitHub secret name is exactly `NPM_TOKEN`
2. The token was copied fully
3. The token has write access
4. If your npm account/package enforces 2FA on writes, the token is allowed to bypass 2FA for this bootstrap publish

## Official References

- npm trusted publishing: https://docs.npmjs.com/trusted-publishers/
- npm access tokens: https://docs.npmjs.com/creating-and-viewing-access-tokens/
- npm token overview: https://docs.npmjs.com/about-access-tokens
- npm token revocation: https://docs.npmjs.com/revoking-access-tokens/
- GitHub secrets: https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets
- GitHub automatic `GITHUB_TOKEN`: https://docs.github.com/en/actions/tutorials/authenticate-with-github_token
- GitHub Actions repository settings: https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository
- Changesets GitHub Action: https://github.com/changesets/action

## Verification Commands

```bash
pnpm release:status
pnpm release:pack
pnpm release:smoke
```
