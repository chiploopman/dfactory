import { FileText, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { TemplateSummary } from "@/types/api";

interface TemplateCatalogProps {
  templates: TemplateSummary[];
  selectedId?: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (templateId: string) => void;
}

export function TemplateCatalog({
  templates,
  selectedId,
  query,
  onQueryChange,
  onSelect
}: TemplateCatalogProps) {
  const normalized = query.trim().toLowerCase();
  const filtered = templates.filter((item) => {
    const haystack = [
      item.id,
      item.meta.title,
      item.meta.description ?? "",
      ...(item.meta.tags ?? [])
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  });

  return (
    <aside className="flex h-full w-[320px] shrink-0 flex-col border-r bg-card/70 backdrop-blur-sm">
      <div className="p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <ScrollArea className="h-full px-3 pb-3">
        <div className="space-y-2">
          {filtered.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => onSelect(template.id)}
              className={cn(
                "group w-full rounded-xl border p-3 text-left transition-colors",
                selectedId === template.id
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card hover:border-primary/30 hover:bg-card/70"
              )}
              data-template-id={template.id}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="line-clamp-1 text-sm font-semibold">{template.meta.title}</p>
                <Badge variant="secondary" className="capitalize">
                  {template.framework}
                </Badge>
              </div>

              <p className="line-clamp-2 text-xs text-muted-foreground">
                {template.meta.description ?? "No description provided."}
              </p>

              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{template.id}</span>
              </div>
            </button>
          ))}

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
              No templates found for this search.
            </div>
          ) : null}
        </div>
      </ScrollArea>
    </aside>
  );
}
