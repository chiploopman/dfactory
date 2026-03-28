export type InspectorEditorPanel = "payload" | "schema" | "source"

export type InspectorEditorLanguage =
  | "json"
  | "javascript"
  | "html"
  | "css"
  | "markdown"
  | "plaintext"

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

const JSON_SOURCE_EXTENSIONS = new Set(["json", "jsonc"])
const HTML_SOURCE_EXTENSIONS = new Set(["html", "htm", "vue", "svelte"])
const CSS_SOURCE_EXTENSIONS = new Set(["css", "scss", "sass", "less", "pcss"])
const MARKDOWN_SOURCE_EXTENSIONS = new Set(["md", "mdx"])

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
  if (JSON_SOURCE_EXTENSIONS.has(extension)) {
    return "json"
  }
  if (HTML_SOURCE_EXTENSIONS.has(extension)) {
    return "html"
  }
  if (CSS_SOURCE_EXTENSIONS.has(extension)) {
    return "css"
  }
  if (MARKDOWN_SOURCE_EXTENSIONS.has(extension)) {
    return "markdown"
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
