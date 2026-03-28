import { describe, expect, it } from "vitest"

import { buildSourceTabLabels } from "../../packages/ui/src/lib/source-tab-labels.ts"

describe("source tab label helper", () => {
  it("uses basename labels when file names are unique", () => {
    expect(
      buildSourceTabLabels([
        "invoice/template.tsx",
        "invoice/InvoiceBody.tsx",
        "invoice/styles/print.css",
      ]),
    ).toEqual([
      { path: "invoice/template.tsx", label: "template.tsx" },
      { path: "invoice/InvoiceBody.tsx", label: "InvoiceBody.tsx" },
      { path: "invoice/styles/print.css", label: "print.css" },
    ])
  })

  it("expands labels with parent segments only when collisions occur", () => {
    expect(
      buildSourceTabLabels([
        "invoice/template.tsx",
        "shared/template.tsx",
        "nested/deep/template.tsx",
      ]),
    ).toEqual([
      { path: "invoice/template.tsx", label: "invoice/template.tsx" },
      { path: "shared/template.tsx", label: "shared/template.tsx" },
      { path: "nested/deep/template.tsx", label: "deep/template.tsx" },
    ])
  })

  it("returns labels in the same order as the input list", () => {
    const orderedPaths = [
      "zeta/main.ts",
      "alpha/main.ts",
      "alpha/component.vue",
      "docs/readme.md",
    ]
    const labels = buildSourceTabLabels(orderedPaths)

    expect(labels.map((item) => item.path)).toEqual(orderedPaths)
  })
})
