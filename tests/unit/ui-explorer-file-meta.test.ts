import { describe, expect, it } from "vitest"

import {
  getFileExtension,
  getFileExtensionBadge,
  getFileName,
} from "../../packages/ui/src/lib/explorer-file-meta.ts"

describe("explorer file metadata helpers", () => {
  it("extracts file names from relative and nested paths", () => {
    expect(getFileName("invoice/template.tsx")).toBe("template.tsx")
    expect(getFileName("invoice/components/header.tsx")).toBe("header.tsx")
    expect(getFileName("InvoiceTemplate.vue")).toBe("InvoiceTemplate.vue")
  })

  it("extracts lowercase extensions and handles extensionless files", () => {
    expect(getFileExtension("invoice/template.tsx")).toBe("tsx")
    expect(getFileExtension("invoice/README.MD")).toBe("md")
    expect(getFileExtension("invoice/Dockerfile")).toBeUndefined()
  })

  it("builds uppercase badge labels with FILE fallback", () => {
    expect(getFileExtensionBadge("invoice/template.tsx")).toBe("TSX")
    expect(getFileExtensionBadge("invoice/config.json")).toBe("JSON")
    expect(getFileExtensionBadge("invoice/Dockerfile")).toBe("FILE")
  })
})
