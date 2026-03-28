import { Download, Eye } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { TemplateSummary } from "@/types/api"

interface TopbarProps {
  selectedTemplate?: TemplateSummary
  onPreview: () => void
  onGenerate: () => void
  busy: boolean
  previewBusy: boolean
  generateBusy: boolean
}

export function Topbar({
  selectedTemplate,
  onPreview,
  onGenerate,
  busy,
  previewBusy,
  generateBusy,
}: TopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div>
        <p className="text-sm font-semibold">
          {selectedTemplate?.meta.title ?? "Select a template"}
        </p>
        <p className="text-xs text-muted-foreground">
          {selectedTemplate?.meta.description ?? "Storybook-style PDF workshop"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="default"
          onClick={onPreview}
          disabled={busy || !selectedTemplate}
          data-testid="topbar-preview-button"
        >
          {previewBusy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Eye data-icon="inline-start" />
          )}
          {previewBusy ? "Previewing..." : "Preview"}
        </Button>
        <Button
          variant="outline"
          size="default"
          onClick={onGenerate}
          disabled={busy || !selectedTemplate}
          data-testid="topbar-generate-button"
        >
          {generateBusy ? (
            <Spinner data-icon="inline-start" />
          ) : (
            <Download data-icon="inline-start" />
          )}
          {generateBusy ? "Generating..." : "Generate"}
        </Button>
      </div>
    </header>
  )
}
