import { Download, Eye, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { RenderMode } from "@/lib/api";
import type { TemplateSummary } from "@/types/api";

interface TopbarProps {
  selectedTemplate?: TemplateSummary;
  mode: RenderMode;
  onModeChange: (mode: RenderMode) => void;
  onPreview: () => void;
  onGenerate: () => void;
  onRefreshTemplates: () => void;
  busy: boolean;
}

export function Topbar({
  selectedTemplate,
  mode,
  onModeChange,
  onPreview,
  onGenerate,
  onRefreshTemplates,
  busy
}: TopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div>
        <p className="text-sm font-semibold">{selectedTemplate?.meta.title ?? "Select a template"}</p>
        <p className="text-xs text-muted-foreground">{selectedTemplate?.meta.description ?? "Storybook-style PDF workshop"}</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="rounded-lg border bg-card p-1">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === "html" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            onClick={() => onModeChange("html")}
          >
            HTML
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              mode === "pdf" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            onClick={() => onModeChange("pdf")}
          >
            PDF
          </button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Button variant="secondary" size="sm" onClick={onRefreshTemplates} disabled={busy}>
          <RefreshCw className="mr-1 h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button size="sm" onClick={onPreview} disabled={busy || !selectedTemplate}>
          <Eye className="mr-1 h-3.5 w-3.5" />
          Preview
        </Button>
        <Button variant="outline" size="sm" onClick={onGenerate} disabled={busy || !selectedTemplate}>
          <Download className="mr-1 h-3.5 w-3.5" />
          Generate
        </Button>
      </div>
    </header>
  );
}
