import { describe, expect, it } from "vitest"

import {
  DEFAULT_SCHEMA_DOC_TAB_ID,
  resolveSchemaDocTabId,
  SCHEMA_DOC_TABS,
} from "../../packages/ui/src/lib/schema-doc-tabs.ts"

describe("schema doc tabs", () => {
  it("exposes deterministic docs-like tab order", () => {
    expect(SCHEMA_DOC_TABS.map((tab) => tab.id)).toEqual([
      "schema-json",
      "features-json",
    ])
    expect(SCHEMA_DOC_TABS.map((tab) => tab.label)).toEqual([
      "schema.json",
      "features.json",
    ])
  })

  it("resolves to schema default when value is missing or invalid", () => {
    expect(resolveSchemaDocTabId()).toBe(DEFAULT_SCHEMA_DOC_TAB_ID)
    expect(resolveSchemaDocTabId("unknown")).toBe(DEFAULT_SCHEMA_DOC_TAB_ID)
  })

  it("accepts valid schema tab ids", () => {
    expect(resolveSchemaDocTabId("schema-json")).toBe("schema-json")
    expect(resolveSchemaDocTabId("features-json")).toBe("features-json")
  })
})
