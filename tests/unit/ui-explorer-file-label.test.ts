import { describe, expect, it } from "vitest"

import { getExplorerFileLabel } from "../../packages/ui/src/lib/explorer-file-label.ts"

describe("explorer file label helper", () => {
  it("builds basename labels and keeps full relative path for tooltip", () => {
    expect(
      getExplorerFileLabel("templates/invoice-reference/components/InvoiceReferenceDocument.tsx"),
    ).toEqual({
      label: "InvoiceReferenceDocument.tsx",
      tooltip: "templates/invoice-reference/components/InvoiceReferenceDocument.tsx",
    })
  })

  it("normalizes windows-style paths for tooltip display", () => {
    expect(
      getExplorerFileLabel(
        "templates\\invoice-reference\\components\\InvoiceReferenceDocument.vue",
      ),
    ).toEqual({
      label: "InvoiceReferenceDocument.vue",
      tooltip: "templates/invoice-reference/components/InvoiceReferenceDocument.vue",
    })
  })
})
