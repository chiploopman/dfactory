# create-dfactory

## Purpose

Project bootstrap generator for adding dFactory into existing React/Vue projects.

It detects framework dependencies, updates package scripts/dependencies, and copies starter templates.

## Usage

```bash
npm create dfactory@latest
# or
pnpm create dfactory@latest
# or
yarn create dfactory
```

## Development

```bash
pnpm --filter create-dfactory typecheck
pnpm --filter create-dfactory test
pnpm --filter create-dfactory build
```

When changing generation behavior, add unit coverage under `tests/unit/create-dfactory*.test.ts`.

## Troubleshooting

- Wrong framework selected: verify target project dependencies before running initializer.
- Missing scripts/deps: rerun generator and inspect resulting `package.json` merge behavior.

## Related Documentation

- [Installation](/docs/installation)
- [Contributing](/docs/contributing)
