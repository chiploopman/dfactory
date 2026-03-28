import { css } from "@codemirror/lang-css"
import { html } from "@codemirror/lang-html"
import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
import { markdown } from "@codemirror/lang-markdown"
import { EditorView } from "@codemirror/view"
import { githubLight } from "@uiw/codemirror-theme-github"
import CodeMirror from "@uiw/react-codemirror"

import type { InspectorEditorConfig } from "@/lib/editor-config"
import { cn } from "@/lib/utils"

interface CodeEditorProps {
  value: string
  config: InspectorEditorConfig
  onChange?: (value: string) => void
  className?: string
  variant?: "framed" | "plain"
  "data-testid"?: string
}

function createLanguageExtensions(config: InspectorEditorConfig) {
  const extensions = [
    EditorView.theme({
      "&": {
        fontSize: "var(--dfactory-code-font-size, 15px)",
      },
      ".cm-gutters": {
        fontSize: "var(--dfactory-code-font-size, 15px)",
      },
    }),
  ]

  if (config.language === "json") {
    extensions.push(json())
  } else if (config.language === "javascript") {
    extensions.push(javascript({ jsx: true, typescript: true }))
  } else if (config.language === "html") {
    extensions.push(html())
  } else if (config.language === "css") {
    extensions.push(css())
  } else if (config.language === "markdown") {
    extensions.push(markdown())
  }

  if (config.lineWrapping) {
    extensions.push(EditorView.lineWrapping)
  }

  return extensions
}

export function CodeEditor({
  value,
  config,
  onChange,
  className,
  variant = "framed",
  "data-testid": dataTestId,
}: CodeEditorProps) {
  const extensions = createLanguageExtensions(config)

  return (
    <div
      className={cn(
        variant === "plain"
          ? "h-full p-0 overflow-hidden"
          : "h-full rounded-lg border bg-muted/30 p-0 overflow-hidden",
        className,
      )}
      data-testid={dataTestId}
    >
      <CodeMirror
        value={value}
        theme={githubLight}
        height="100%"
        editable={!config.readOnly}
        readOnly={config.readOnly}
        onChange={(nextValue) => {
          onChange?.(nextValue)
        }}
        extensions={extensions}
        basicSetup={{
          lineNumbers: config.lineNumbers,
          highlightActiveLine: !config.readOnly,
          highlightActiveLineGutter: !config.readOnly,
          foldGutter: true,
          autocompletion: !config.readOnly,
        }}
        className="h-full [&_.cm-editor]:h-full [&_.cm-gutters]:bg-transparent [&_.cm-scroller]:font-mono"
      />
    </div>
  )
}
