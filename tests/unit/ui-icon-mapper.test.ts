import { describe, expect, it } from "vitest"

import {
  getFrameworkIconMeta,
  getSourceFileIconMeta,
} from "../../packages/ui/src/lib/icon-mapper.tsx"

describe("ui icon mapper", () => {
  it("maps framework names to official framework icon metadata", () => {
    expect(getFrameworkIconMeta("react")).toMatchObject({
      kind: "react",
      label: "React",
    })
    expect(getFrameworkIconMeta("vue")).toMatchObject({
      kind: "vue",
      label: "Vue",
    })
  })

  it("falls back to unknown framework icon metadata", () => {
    expect(getFrameworkIconMeta("svelte")).toMatchObject({
      kind: "unknown",
      label: "svelte",
    })
  })

  it("maps source file extensions to deterministic icon kinds", () => {
    expect(getSourceFileIconMeta("invoice/template.ts").kind).toBe("typescript")
    expect(getSourceFileIconMeta("invoice/template.tsx").kind).toBe("react")
    expect(getSourceFileIconMeta("invoice/InvoiceDocument.vue").kind).toBe("vue")
    expect(getSourceFileIconMeta("invoice/README.md").kind).toBe("file")
  })
})
