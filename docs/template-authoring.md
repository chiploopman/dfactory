# Template Authoring

## Required location

`src/templates/<template-name>/template.tsx` (React)

`src/templates/<template-name>/template.ts` (Vue)

## Canonical API (`@dfactory/template-kit`)

Use `defineTemplate()` as the primary authoring API. Existing `meta/schema/render` exports remain supported.

```ts
import { z } from "zod";
import { defineTemplate } from "@dfactory/template-kit";

const template = defineTemplate({
  meta: {
    id: "invoice",
    title: "Invoice",
    framework: "react",
    version: "1.0.0"
  },
  schema: z.object({
    customerName: z.string()
  }),
  pdf: {
    toc: { enabled: true },
    pagination: { mode: "css" }
  },
  pdfElements: {
    header: {
      render(ctx) {
        return `<div>${ctx.template.title} • ${ctx.tokens.date}</div>`;
      }
    },
    footer: {
      template: "<div>{{pageNumber}} / {{totalPages}}</div>"
    },
    toc: {
      render(ctx) {
        return `<nav>${ctx.headings.map((h) => h.text).join(", ")}</nav>`;
      }
    }
  },
  examples: [
    {
      name: "default",
      payload: { customerName: "Acme Corp" }
    }
  ],
  render(payload, context) {
    return `<main class="${context?.helpers.markerClass("avoidBreak") ?? ""}">Hello ${payload.customerName}</main>`;
  }
});

export const meta = template.meta;
export const schema = template.schema;
export const pdf = template.pdf;
export const pdfElements = template.pdfElements;
export const examples = template.examples;
export const render = template.render;
```

## First-class PDF elements

`pdfElements` is additive and non-breaking. Each element supports either:

- `render(context)` for framework-native component rendering (React/Vue nodes or HTML string).
- `template` for direct string fallback.

Supported elements:

- `toc`
- `header`
- `footer`
- `watermark`
- `pagination`

Renderer precedence is deterministic:

1. `pdfElements.<element>.render`
2. `pdfElements.<element>.template`
3. Legacy `pdf.*` behavior/defaults

Element render context includes:

- Run metadata: `runId`, `mode`, `profile`, `now`
- Template metadata: `template`, `templateId`
- `payload` and resolved `features`
- Token helpers: `{{pageNumber}}`, `{{totalPages}}`, `{{date}}`, `{{title}}`, `{{templateId}}`
- Pagination helpers/marker classes
- TOC heading map (`headings`) for TOC renderers

## PDF template features

`pdf` config supports:

- `page` (`A4` / `Letter`, margins, orientation)
- `headerFooter` (tokenized templates like `{{pageNumber}}`, `{{totalPages}}`, `{{title}}`)
- `toc` (automatic heading-based TOC)
- `pagination` (`css` default, `pagedjs` opt-in)
- `assets` (HTTPS + data URI policies)
- `fonts` (`@font-face` manifest)
- `metadata` and optional `watermark` (with `@dfactory/pdf-feature-pdf-lib`)

## Reference templates

Starters now include:

- `invoice` (simple onboarding template)
- `invoice-reference` (rich, multi-file template showing first-class TOC/header/footer/watermark/pagination patterns)

## Runtime configuration

Use `plugins`, `moduleLoader`, and `renderer.pdfPlugins` in `dfactory.config.ts`:

```ts
plugins: ["@dfactory/framework-react"]
moduleLoader: "@dfactory/module-loader-bundle"
renderer: {
  engine: "playwright",
  poolSize: 4,
  timeoutMs: 30000,
  pdfPlugins: ["@dfactory/pdf-feature-standard"]
}
```

For Vue SFC templates:

```ts
plugins: ["@dfactory/framework-vue"]
moduleLoader: "@dfactory/module-loader-vite"
```
