export type InspectorEditorPanel = "payload" | "schema" | "source"

export type InspectorEditorLanguage = "json" | "javascript" | "plaintext"

export interface InspectorEditorConfig {
  readOnly: boolean
  lineNumbers: boolean
  lineWrapping: boolean
  language: InspectorEditorLanguage
}

const JAVASCRIPT_SOURCE_EXTENSIONS = new Set([
  "ts",
  "tsx",
  "js",
  "jsx",
  "mts",
  "mtsx",
])

export function inferSourceLanguageFromPath(
  filePath?: string,
): InspectorEditorLanguage {
  if (!filePath) {
    return "plaintext"
  }

  const normalized = filePath.trim().toLowerCase()
  const extensionIndex = normalized.lastIndexOf(".")
  if (extensionIndex === -1) {
    return "plaintext"
  }

  const extension = normalized.slice(extensionIndex + 1)
  if (JAVASCRIPT_SOURCE_EXTENSIONS.has(extension)) {
    return "javascript"
  }

  return "plaintext"
}

export function getInspectorEditorConfig(options: {
  panel: InspectorEditorPanel
  sourceFilePath?: string
}): InspectorEditorConfig {
  switch (options.panel) {
    case "payload":
      return {
        readOnly: false,
        lineNumbers: true,
        lineWrapping: true,
        language: "json",
      }
    case "schema":
      return {
        readOnly: true,
        lineNumbers: true,
        lineWrapping: true,
        language: "json",
      }
    case "source":
      return {
        readOnly: true,
        lineNumbers: true,
        lineWrapping: true,
        language: inferSourceLanguageFromPath(options.sourceFilePath),
      }
    default:
      return {
        readOnly: true,
        lineNumbers: true,
        lineWrapping: true,
        language: "plaintext",
      }
  }
}
