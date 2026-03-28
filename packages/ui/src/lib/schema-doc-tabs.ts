export const SCHEMA_DOC_TAB_IDS = ["schema-json", "features-json"] as const

export type SchemaDocTabId = (typeof SCHEMA_DOC_TAB_IDS)[number]

export const DEFAULT_SCHEMA_DOC_TAB_ID: SchemaDocTabId = "schema-json"

export interface SchemaDocTab {
  id: SchemaDocTabId
  label: string
  tooltip: string
  viewTestId: string
}

export const SCHEMA_DOC_TABS: SchemaDocTab[] = [
  {
    id: "schema-json",
    label: "schema.json",
    tooltip: "Template payload JSON Schema",
    viewTestId: "schema-view",
  },
  {
    id: "features-json",
    label: "features.json",
    tooltip: "Resolved template features configuration",
    viewTestId: "features-view",
  },
]

export function resolveSchemaDocTabId(value?: string): SchemaDocTabId {
  if (value && SCHEMA_DOC_TAB_IDS.includes(value as SchemaDocTabId)) {
    return value as SchemaDocTabId
  }

  return DEFAULT_SCHEMA_DOC_TAB_ID
}
