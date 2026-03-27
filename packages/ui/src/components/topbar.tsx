import { Download, Eye } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { TemplateSummary } from "@/types/api";

interface TopbarProps {
  selectedTemplate?: TemplateSummary;
  onPreview: () => void;
  onGenerate: () => void;
  busy: boolean;
}

export function Topbar({
  selectedTemplate,
  onPreview,
  onGenerate,
  busy
}: TopbarProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-card/60 px-4 py-3 backdrop-blur-sm">
      <div>
        <p className="text-sm font-semibold">{selectedTemplate?.meta.title ?? "Select a template"}</p>
        <p className="text-xs text-muted-foreground">{selectedTemplate?.meta.description ?? "Storybook-style PDF workshop"}</p>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={onPreview} disabled={busy || !selectedTemplate} data-testid="topbar-preview-button">
          <Eye className="mr-1 h-3.5 w-3.5" />
          Preview
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerate}
          disabled={busy || !selectedTemplate}
          data-testid="topbar-generate-button"
        >
          <Download className="mr-1 h-3.5 w-3.5" />
          Generate
        </Button>
      </div>
    </header>
  );
}
