# Skill: dfactory-template-authoring

## Purpose
Standardize how templates are authored and discovered.

## Contract
1. Required path format: `src/templates/<name>/template.tsx`.
2. Required exports:
   - `meta`
   - `schema` (zod)
   - `render(payload)`
3. `meta.framework` must match a registered adapter (v1 default: `react`).
4. Template payload must validate against `schema` at runtime.

## Guidance
1. Keep rendering deterministic and pure.
2. Use payload URLs for external assets in v1.
3. Include concise `description` and helpful `tags` in `meta`.
