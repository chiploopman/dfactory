# @dfactory/framework-react

## Purpose

React framework plugin for dFactory runtime.

It renders template outputs to static HTML and supports fragment rendering for first-class PDF elements.

## Usage

Config pairing:

```ts
plugins: ["@dfactory/framework-react"],
moduleLoader: "@dfactory/module-loader-bundle",
```

## Development

```bash
pnpm --filter @dfactory/framework-react typecheck
pnpm --filter @dfactory/framework-react test
pnpm --filter @dfactory/framework-react build
```

Keep adapter logic framework-specific and avoid core orchestration concerns.

## Troubleshooting

- Invalid element output: verify template render returns valid React-compatible output.
- SSR markup issues: test with representative payloads and examples.

## Related Documentation

- [Frameworks: React](/docs/frameworks/react)
- [Rendering Pipeline](/docs/rendering-pipeline)
