# Skill: dfactory-adapter-development

## Purpose
Guide framework adapter implementation without changing core contracts unexpectedly.

## Adapter contract
1. Export a `TemplateAdapter` with:
   - `framework`
   - `renderHtml({ template, payload })`
2. Adapter must return final HTML string (or document fragment wrapped by caller).
3. Adapter module should be loadable through `config.adapters` references.

## Conformance expectations
1. Adapter renders payload validated by template schema.
2. Missing adapter for framework returns clear runtime error.
3. Adapter can be registered without core code edits beyond package wiring.
