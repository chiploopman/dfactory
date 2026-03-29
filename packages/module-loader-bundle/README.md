# @dfactory/module-loader-bundle

## Purpose

Default module loader using `bundle-require` for TS/JS template modules without transform-heavy requirements.

## Usage

Use with React plugin in config:

```ts
moduleLoader: "@dfactory/module-loader-bundle"
```

## Development

```bash
pnpm --filter @dfactory/module-loader-bundle typecheck
pnpm --filter @dfactory/module-loader-bundle test
pnpm --filter @dfactory/module-loader-bundle build
```

## Troubleshooting

- Module evaluation failures: verify template file path and ESM/CJS compatibility.
- Framework requiring transforms: switch to `@dfactory/module-loader-vite`.

## Related Documentation

- [Rendering Pipeline](/docs/rendering-pipeline)
- [Frameworks: React](/docs/frameworks/react)
