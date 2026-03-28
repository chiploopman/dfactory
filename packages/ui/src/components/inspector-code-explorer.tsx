import { useMemo, useState } from "react"
import type { CSSProperties, ComponentProps } from "react"
import { Check, ChevronRight, Copy, FileText, Folder } from "lucide-react"

import { CodeEditor } from "@/components/ui/code-editor"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { InspectorEditorConfig } from "@/lib/editor-config"
import { getExplorerFileLabel } from "@/lib/explorer-file-label"
import {
  getFileExtensionBadge,
} from "@/lib/explorer-file-meta"
import { getSourceFileIconMeta } from "@/lib/icon-mapper"
import {
  SOURCE_EXPLORER_NAV_MAX_PERCENT,
  SOURCE_EXPLORER_NAV_MIN_PERCENT,
  clampSourceExplorerNavSize,
  getSourceExplorerNavSizeFromLayout,
  toPercentString,
} from "@/lib/source-explorer-layout"
import {
  buildExplorerTree,
  isAncestorPath,
  type ExplorerTreeFolderNode,
  type ExplorerTreeNode,
} from "@/lib/explorer-tree"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

type BadgeVariant = ComponentProps<typeof Badge>["variant"]

export interface InspectorCodeExplorerFile {
  id: string
  path: string
  status: "ready" | "skipped"
  content?: string
  skipReason?: "binary" | "tooLarge" | "unreadable"
  bytes?: number
  badges?: Array<{
    label: string
    variant?: BadgeVariant
  }>
}

interface InspectorCodeExplorerProps {
  files: InspectorCodeExplorerFile[]
  activeFileId?: string
  onSelectFile: (fileId: string) => void
  resolveEditorConfig: (file: InspectorCodeExplorerFile) => InspectorEditorConfig
  resolveSkippedMessage: (file: InspectorCodeExplorerFile) => string
  emptyState: {
    title: string
    description: string
    icon?: React.ComponentType<{ className?: string }>
  }
  sectionLabel: string
  testIdPrefix: string
  resizableNav?: boolean
  navPanelSize?: number
  onNavPanelSizeChange?: (size: number) => void
}

function buildListItemBadges(file: InspectorCodeExplorerFile) {
  if (!file.badges || file.badges.length === 0) {
    return null
  }

  return (
    <span className="ml-auto flex items-center gap-1 pl-1">
      {file.badges.map((badge) => (
        <Badge
          key={`${file.id}-${badge.label}`}
          variant={badge.variant ?? "outline"}
          className="h-4 rounded-sm px-1 text-[9px]"
        >
          {badge.label}
        </Badge>
      ))}
    </span>
  )
}

export function InspectorCodeExplorer({
  files,
  activeFileId,
  onSelectFile,
  resolveEditorConfig,
  resolveSkippedMessage,
  emptyState,
  sectionLabel,
  testIdPrefix,
  resizableNav = false,
  navPanelSize = 28,
  onNavPanelSizeChange,
}: InspectorCodeExplorerProps) {
  const [copiedFileId, setCopiedFileId] = useState<string>()

  const fileByPath = useMemo(
    () => new Map(files.map((file) => [file.path, file])),
    [files],
  )
  const selectedFile = useMemo(() => {
    if (files.length === 0) {
      return undefined
    }

    if (activeFileId) {
      const byId = files.find((file) => file.id === activeFileId)
      if (byId) {
        return byId
      }
    }

    return files[0]
  }, [activeFileId, files])
  const tree = useMemo(
    () => buildExplorerTree(files.map((file) => file.path)),
    [files],
  )
  const selectedFileIconMeta = useMemo(
    () =>
      selectedFile ? getSourceFileIconMeta(selectedFile.path) : undefined,
    [selectedFile],
  )
  const clampedNavSize = clampSourceExplorerNavSize(navPanelSize)
  const navPanelId = `${testIdPrefix}-explorer-nav-panel`
  const viewerPanelId = `${testIdPrefix}-explorer-viewer-panel`
  const defaultNavSize = toPercentString(clampedNavSize)
  const defaultViewerSize = toPercentString(100 - clampedNavSize)
  const enableResizableNav = resizableNav && typeof onNavPanelSizeChange === "function"

  const onCopyFile = async () => {
    if (!selectedFile?.content) {
      return
    }

    try {
      await navigator.clipboard.writeText(selectedFile.content)
      setCopiedFileId(selectedFile.id)
      toast.success("Copied file content")
      window.setTimeout(() => {
        setCopiedFileId((current) =>
          current === selectedFile.id ? undefined : current,
        )
      }, 1200)
    } catch {
      toast.error("Failed to copy file content")
    }
  }

  const EmptyIcon = emptyState.icon ?? FileText
  const navContent = (
    <SidebarProvider
      defaultOpen
      className="h-full min-h-0 w-full"
      style={{ "--sidebar-width": "100%" } as CSSProperties}
    >
      <Sidebar
        collapsible="none"
        className="w-full border-none bg-transparent text-foreground"
      >
        <SidebarContent className="overflow-hidden">
          <SidebarGroup className="h-full min-h-0 p-0">
            <SidebarGroupLabel className="h-10 rounded-none border-b px-3 text-[11px] uppercase tracking-wide text-muted-foreground">
              {sectionLabel}
            </SidebarGroupLabel>
            <SidebarGroupContent className="min-h-0 flex-1">
              <ScrollArea
                className="h-full"
                data-testid={`${testIdPrefix}-explorer-list-scroll`}
              >
                <SidebarMenu
                  className="p-2"
                  data-testid={`${testIdPrefix}-explorer-list`}
                >
                  {tree.map((node) => (
                    <ExplorerTreeItem
                      key={node.path}
                      node={node}
                      fileByPath={fileByPath}
                      activeFileId={selectedFile?.id}
                      onSelectFile={onSelectFile}
                      testIdPrefix={testIdPrefix}
                    />
                  ))}
                </SidebarMenu>
              </ScrollArea>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  )
  const viewerContent = (
    <div className="min-h-0 flex h-full flex-col bg-card" data-testid={`${testIdPrefix}-viewer`}>
      {selectedFile ? (
        <>
          <div
            className="sticky top-0 z-10 flex h-10 min-w-0 items-center gap-2 border-b bg-card px-3"
            data-testid={`${testIdPrefix}-viewer-meta`}
          >
            <Badge
              variant="secondary"
              className="h-5 shrink-0 rounded-sm px-1.5 text-[10px] [&_svg]:size-3.5 [&_svg]:shrink-0"
              data-icon-kind={selectedFileIconMeta?.kind ?? "file"}
            >
              {selectedFileIconMeta ? (
                <selectedFileIconMeta.Icon aria-hidden="true" />
              ) : null}
              <span>{getFileExtensionBadge(selectedFile.path)}</span>
            </Badge>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {selectedFile.path}
                </p>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <span className="font-mono text-xs">{selectedFile.path}</span>
              </TooltipContent>
            </Tooltip>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              className="ml-auto shrink-0"
              onClick={onCopyFile}
              aria-label="Copy selected file content"
              data-testid={`${testIdPrefix}-viewer-copy`}
              disabled={!selectedFile.content}
            >
              {copiedFileId === selectedFile.id ? (
                <Check />
              ) : (
                <Copy />
              )}
            </Button>
          </div>

          <div className="min-h-0 flex-1">
            {selectedFile.status === "ready" ? (
              <CodeEditor
                value={selectedFile.content ?? ""}
                config={resolveEditorConfig(selectedFile)}
                variant="plain"
                className="h-full"
                data-testid={`${testIdPrefix}-view`}
              />
            ) : (
              <Empty
                className="h-full"
                data-testid={`${testIdPrefix}-view-skipped`}
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <FileText />
                  </EmptyMedia>
                  <EmptyTitle>Source preview unavailable</EmptyTitle>
                  <EmptyDescription>
                    {resolveSkippedMessage(selectedFile)}
                  </EmptyDescription>
                  <Badge variant="outline" className="mt-2">
                    {(selectedFile.bytes ?? 0).toLocaleString()} bytes
                  </Badge>
                </EmptyHeader>
              </Empty>
            )}
          </div>
        </>
      ) : (
        <Empty className="h-full" data-testid={`${testIdPrefix}-viewer-empty`}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <EmptyIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyState.title}</EmptyTitle>
            <EmptyDescription>{emptyState.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  )

  return (
    <section
      className="h-full overflow-hidden rounded-lg border bg-card"
      data-testid={`${testIdPrefix}-explorer`}
    >
      {files.length === 0 ? (
        <Empty className="h-full" data-testid={`${testIdPrefix}-explorer-empty`}>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <EmptyIcon />
            </EmptyMedia>
            <EmptyTitle>{emptyState.title}</EmptyTitle>
            <EmptyDescription>{emptyState.description}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <>
          {enableResizableNav ? (
            <ResizablePanelGroup
              id={`${testIdPrefix}-explorer-group`}
              orientation="horizontal"
              className="h-full min-h-0"
              onLayoutChanged={(layout) => {
                onNavPanelSizeChange(
                  getSourceExplorerNavSizeFromLayout(
                    layout,
                    navPanelId,
                    clampedNavSize,
                  ),
                )
              }}
            >
              <ResizablePanel
                id={navPanelId}
                minSize={toPercentString(SOURCE_EXPLORER_NAV_MIN_PERCENT)}
                maxSize={toPercentString(SOURCE_EXPLORER_NAV_MAX_PERCENT)}
                defaultSize={defaultNavSize}
              >
                <div
                  className="h-full min-h-0 border-r bg-card"
                  data-testid={`${testIdPrefix}-explorer-nav`}
                >
                  {navContent}
                </div>
              </ResizablePanel>
              <ResizableHandle
                className="source-explorer-resize-handle relative -ml-px w-3 bg-transparent p-0 after:absolute after:top-1/2 after:left-0 after:h-8 after:w-[6px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-border after:transition-all after:hover:h-10"
                data-testid={`${testIdPrefix}-explorer-resize-handle`}
              />
              <ResizablePanel
                id={viewerPanelId}
                minSize={toPercentString(60)}
                defaultSize={defaultViewerSize}
              >
                {viewerContent}
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="grid h-full min-h-0 grid-cols-[16rem_minmax(0,1fr)]">
              <div
                className="min-h-0 border-r bg-card"
                data-testid={`${testIdPrefix}-explorer-nav`}
              >
                {navContent}
              </div>
              {viewerContent}
            </div>
          )}
        </>
      )}
    </section>
  )
}

interface ExplorerTreeItemProps {
  node: ExplorerTreeNode
  fileByPath: Map<string, InspectorCodeExplorerFile>
  activeFileId?: string
  onSelectFile: (fileId: string) => void
  testIdPrefix: string
}

function ExplorerTreeItem({
  node,
  fileByPath,
  activeFileId,
  onSelectFile,
  testIdPrefix,
}: ExplorerTreeItemProps) {
  if (node.type === "folder") {
    return (
      <FolderTreeItem
        folder={node}
        fileByPath={fileByPath}
        activeFileId={activeFileId}
        onSelectFile={onSelectFile}
        testIdPrefix={testIdPrefix}
      />
    )
  }

  const file = fileByPath.get(node.path)
  if (!file) {
    return null
  }

  const isActive = file.id === activeFileId
  const iconMeta = getSourceFileIconMeta(file.path)
  const label = getExplorerFileLabel(file.path)
  const FileIcon = iconMeta.Icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={() => onSelectFile(file.id)}
        data-testid={`${testIdPrefix}-explorer-file`}
        data-file-id={file.id}
        data-file-path={file.path}
        data-active={isActive}
        data-icon-kind={iconMeta.kind}
        className={cn("min-w-0 gap-2", isActive ? "shadow-none" : "")}
      >
        <FileIcon aria-hidden="true" />
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="min-w-0 flex-1 truncate"
              data-testid={`${testIdPrefix}-explorer-file-label`}
            >
              {label.label}
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" align="start">
            <span className="font-mono text-xs">{label.tooltip}</span>
          </TooltipContent>
        </Tooltip>
        {buildListItemBadges(file)}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

interface FolderTreeItemProps {
  folder: ExplorerTreeFolderNode
  fileByPath: Map<string, InspectorCodeExplorerFile>
  activeFileId?: string
  onSelectFile: (fileId: string) => void
  testIdPrefix: string
}

function FolderTreeItem({
  folder,
  fileByPath,
  activeFileId,
  onSelectFile,
  testIdPrefix,
}: FolderTreeItemProps) {
  const activeFile = [...fileByPath.values()].find((file) => file.id === activeFileId)
  const isOpenByDefault = activeFile
    ? isAncestorPath(folder.path, activeFile.path)
    : false

  return (
    <SidebarMenuItem>
      <Collapsible
        defaultOpen={isOpenByDefault}
        className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
      >
        <CollapsibleTrigger asChild>
          <SidebarMenuButton className="min-w-0 gap-2">
            <ChevronRight className="transition-transform" />
            <Folder />
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="min-w-0 flex-1 truncate">{folder.name}</span>
              </TooltipTrigger>
              <TooltipContent side="top" align="start">
                <span className="font-mono text-xs">{folder.path}</span>
              </TooltipContent>
            </Tooltip>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {folder.children.map((child) => (
              <ExplorerTreeItem
                key={child.path}
                node={child}
                fileByPath={fileByPath}
                activeFileId={activeFileId}
                onSelectFile={onSelectFile}
                testIdPrefix={testIdPrefix}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    </SidebarMenuItem>
  )
}
