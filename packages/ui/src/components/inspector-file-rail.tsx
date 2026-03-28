import type { ComponentProps } from "react"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type BadgeVariant = ComponentProps<typeof Badge>["variant"]

export interface InspectorFileRailItem {
  value: string
  label: string
  tooltip?: string
  badges?: Array<{
    label: string
    variant?: BadgeVariant
  }>
  tabDataAttributes?: Record<`data-${string}`, string>
}

interface InspectorFileRailProps {
  items: InspectorFileRailItem[]
  railTestId: string
  scrollTestId?: string
  listTestId: string
  tabTestId: string
}

export function InspectorFileRail({
  items,
  railTestId,
  scrollTestId,
  listTestId,
  tabTestId,
}: InspectorFileRailProps) {
  return (
    <div
      className="sticky top-0 z-10 -mx-1 border-b border-border/80 bg-card px-1 py-2"
      data-testid={railTestId}
    >
      <ScrollArea
        className="w-full"
        data-testid={scrollTestId ?? `${railTestId}-scroll`}
      >
        <TabsList
          className="h-9 w-max justify-start gap-1 rounded-lg border border-border/70 bg-muted p-1"
          data-testid={listTestId}
        >
          {items.map((item) => {
            const trigger = (
              <TabsTrigger
                key={item.value}
                value={item.value}
                className="h-7 flex-none gap-1.5 text-muted-foreground hover:text-foreground aria-selected:border-border aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm"
                data-testid={tabTestId}
                {...(item.tabDataAttributes ?? {})}
              >
                <span className="max-w-56 truncate font-mono text-xs">
                  {item.label}
                </span>
                {item.badges?.map((badge) => (
                  <Badge
                    key={`${item.value}-${badge.label}`}
                    variant={badge.variant ?? "outline"}
                    className="text-[10px]"
                  >
                    {badge.label}
                  </Badge>
                ))}
              </TabsTrigger>
            )

            if (!item.tooltip) {
              return trigger
            }

            return (
              <Tooltip key={item.value}>
                <TooltipTrigger asChild>{trigger}</TooltipTrigger>
                <TooltipContent side="top" align="start">
                  <span className="font-mono text-xs">{item.tooltip}</span>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </TabsList>
      </ScrollArea>
    </div>
  )
}
