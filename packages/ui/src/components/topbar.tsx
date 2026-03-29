import { Download, Eye } from "lucide-react"

import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RenderMode } from "@/lib/api"
import type { TemplateSummary } from "@/types/api"

interface TopbarProps {
  selectedTemplate?: TemplateSummary
  mode: RenderMode
  onModeChange: (mode: RenderMode) => void
  onPreview: () => void
  onGenerate: () => void
  busy: boolean
  previewBusy: boolean
  generateBusy: boolean
}

export function Topbar({
  selectedTemplate,
  mode,
  onModeChange,
  onPreview,
  onGenerate,
  busy,
  previewBusy,
  generateBusy,
}: TopbarProps) {
  return (
    <header className="flex h-14 items-center justify-between gap-3 border-b bg-card/60 px-4 py-0 backdrop-blur-sm">
      <div className="min-w-0 flex-1 self-center">
        <p className="truncate text-sm font-semibold">
          {selectedTemplate?.meta.title ?? "Select a template"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {selectedTemplate?.meta.description ?? "Storybook-style PDF workshop"}
        </p>
      </div>

      <div className="flex h-full shrink-0 items-center self-center gap-2">
        <Tabs
          value={mode}
          onValueChange={(nextValue) => onModeChange(nextValue as RenderMode)}
          className="h-full items-center gap-0 data-horizontal:!flex-row"
          data-testid="preview-mode-tabs"
        >
          <TabsList className="self-center">
            <TabsTrigger value="html" data-testid="preview-mode-html">
              HTML
            </TabsTrigger>
            <TabsTrigger value="pdf" data-testid="preview-mode-pdf">
              PDF
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Separator
          orientation="vertical"
          className="data-vertical:!h-6 data-vertical:!self-center"
        />

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

        <Separator
          orientation="vertical"
          className="data-vertical:!h-6 data-vertical:!self-center"
          data-testid="topbar-theme-separator"
        />

        <div className="flex items-center" data-testid="topbar-theme-toggle">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
