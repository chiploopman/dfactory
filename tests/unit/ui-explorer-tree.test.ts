import { describe, expect, it } from "vitest"

import {
  buildExplorerTree,
  isAncestorPath,
} from "../../packages/ui/src/lib/explorer-tree.ts"

describe("explorer tree helpers", () => {
  it("builds a deterministic recursive tree from file paths", () => {
    const tree = buildExplorerTree([
      "invoice/template.tsx",
      "invoice/components/header.tsx",
      "invoice/components/footer.tsx",
      "invoice/styles/print.css",
    ])

    expect(tree).toEqual([
      {
        type: "folder",
        name: "invoice",
        path: "invoice",
        children: [
          {
            type: "file",
            name: "template.tsx",
            path: "invoice/template.tsx",
          },
          {
            type: "folder",
            name: "components",
            path: "invoice/components",
            children: [
              {
                type: "file",
                name: "header.tsx",
                path: "invoice/components/header.tsx",
              },
              {
                type: "file",
                name: "footer.tsx",
                path: "invoice/components/footer.tsx",
              },
            ],
          },
          {
            type: "folder",
            name: "styles",
            path: "invoice/styles",
            children: [
              {
                type: "file",
                name: "print.css",
                path: "invoice/styles/print.css",
              },
            ],
          },
        ],
      },
    ])
  })

  it("ignores duplicate and empty paths", () => {
    const tree = buildExplorerTree([
      "invoice/template.tsx",
      "invoice/template.tsx",
      "",
      "/invoice/template.tsx",
    ])

    expect(tree).toHaveLength(1)
    const invoiceFolder = tree[0]
    expect(invoiceFolder?.type).toBe("folder")
    if (invoiceFolder?.type !== "folder") {
      return
    }

    expect(invoiceFolder.children).toEqual([
      {
        type: "file",
        name: "template.tsx",
        path: "invoice/template.tsx",
      },
    ])
  })

  it("detects ancestor path relationships for default folder expansion", () => {
    expect(
      isAncestorPath("invoice/components", "invoice/components/header.tsx"),
    ).toBe(true)
    expect(isAncestorPath("invoice", "invoice/template.tsx")).toBe(true)
    expect(
      isAncestorPath("invoice/styles", "invoice/components/header.tsx"),
    ).toBe(false)
    expect(isAncestorPath("", "invoice/template.tsx")).toBe(false)
  })
})
