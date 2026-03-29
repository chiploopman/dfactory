import { Search } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { TemplateSummary } from "@/types/api"

interface TemplateCatalogProps {
  templates: TemplateSummary[]
  selectedId?: string
  query: string
  onQueryChange: (value: string) => void
  onSelect: (templateId: string) => void
}

export function TemplateCatalog({
  templates,
  selectedId,
  query,
  onQueryChange,
  onSelect,
}: TemplateCatalogProps) {
  const normalized = query.trim().toLowerCase()
  const filtered = templates.filter((item) => {
    const haystack = `${item.meta.title} ${item.id}`.toLowerCase()

    return haystack.includes(normalized)
  })

  return (
    <Sidebar collapsible="none" className="h-full border-r">
      <SidebarHeader className="border-b p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
          <SidebarInput
            placeholder="Search templates"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            className="pl-8"
            aria-label="Search templates"
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="min-h-0 flex-1 p-2">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filtered.map((template) => (
                <SidebarMenuItem key={template.id}>
                  <SidebarMenuButton
                    type="button"
                    isActive={selectedId === template.id}
                    onClick={() => onSelect(template.id)}
                    className="h-auto items-start py-2.5"
                    data-template-id={template.id}
                  >
                    <span className="flex min-w-0 flex-col">
                      <span
                        className="truncate text-sm font-medium"
                        data-testid="template-item-name"
                      >
                        {template.meta.title}
                      </span>
                      <span
                        className="truncate text-xs text-muted-foreground"
                        data-testid="template-item-id"
                      >
                        {template.id}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {filtered.length === 0 ? (
                <p className="px-2 py-3 text-sm text-muted-foreground">
                  No templates found for this search.
                </p>
              ) : null}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
