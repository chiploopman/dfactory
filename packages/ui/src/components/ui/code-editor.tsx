import { javascript } from "@codemirror/lang-javascript"
import { json } from "@codemirror/lang-json"
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
  "data-testid"?: string
}

function createLanguageExtensions(config: InspectorEditorConfig) {
  const extensions = []

  if (config.language === "json") {
    extensions.push(json())
  } else if (config.language === "javascript") {
    extensions.push(javascript({ jsx: true, typescript: true }))
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
  "data-testid": dataTestId,
}: CodeEditorProps) {
  const extensions = createLanguageExtensions(config)

  return (
    <div
      className={cn(
        "h-full rounded-lg border bg-muted/30 p-0 overflow-hidden",
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
        className="h-full text-xs [&_.cm-editor]:h-full [&_.cm-gutters]:bg-transparent [&_.cm-scroller]:font-mono"
      />
    </div>
  )
}
