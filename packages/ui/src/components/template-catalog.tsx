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
  const filtered = templates.filter((item) =>
    item.id.toLowerCase().includes(normalized),
  )

  return (
    <Sidebar collapsible="none" className="h-full border-r">
      <SidebarHeader className="h-14 justify-center border-b px-3 py-0">
        <span
          className="shrink-0 text-lg font-semibold tracking-tight text-primary"
          data-testid="catalog-logo"
        >
          dfactory
        </span>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-2 pb-1">
          <SidebarGroupContent>
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground" />
              <SidebarInput
                placeholder="Search templates"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                className="pl-8"
                aria-label="Search templates"
              />
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="min-h-0 flex-1 p-2 pt-1">
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {filtered.map((template) => (
                <SidebarMenuItem key={template.id}>
                  <SidebarMenuButton
                    type="button"
                    isActive={selectedId === template.id}
                    variant="primary"
                    onClick={() => onSelect(template.id)}
                    className="h-auto items-start py-2.5 font-normal data-active:font-normal"
                    data-template-id={template.id}
                  >
                    <span
                      className="truncate text-sm font-normal text-muted-foreground group-data-active/menu-button:text-primary"
                      data-testid="template-item-id"
                    >
                      {template.id}
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
