import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import { AnimatePresence, motion } from "framer-motion"
import {
  AlertCircle,
  Braces,
  Code2,
  Eye,
  FileJson2,
  FileText,
  Maximize,
  Minimize,
  TerminalSquare,
} from "lucide-react"

import { InspectorCodeExplorer } from "@/components/inspector-code-explorer"
import { TemplateCatalog } from "@/components/template-catalog"
import { Topbar } from "@/components/topbar"
import { Button } from "@/components/ui/button"
import { CodeEditor } from "@/components/ui/code-editor"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Spinner } from "@/components/ui/spinner"
import {
  DEFAULT_SCHEMA_DOC_TAB_ID,
  resolveSchemaDocTabId,
  SCHEMA_DOC_TABS,
  type SchemaDocTabId,
} from "@/lib/schema-doc-tabs"
import {
  fetchRuntime,
  fetchTemplateSchema,
  fetchTemplateFeatures,
  fetchTemplateSource,
  fetchTemplates,
  generateDocument,
  preflightDocument,
  previewDocument,
  type RenderMode,
} from "@/lib/api"
import { getInspectorEditorConfig } from "@/lib/editor-config"
import { SOURCE_EXPLORER_NAV_DEFAULT_PERCENT } from "@/lib/source-explorer-layout"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type {
  PreviewHtmlResponse,
  RuntimeConfig,
  TemplateSourceFile,
  TemplateSourceManifest,
  TemplateSummary,
} from "@/types/api"

const DEFAULT_PAYLOAD = {
  invoiceNumber: "INV-1001",
  customerName: "Northwind Trading",
  issuedAt: "2026-03-27",
  items: [
    { name: "Consulting", qty: 2, price: 420 },
    { name: "Support", qty: 1, price: 180 },
  ],
}

type PanelTab = "payload" | "schema" | "source" | "playground"

interface PanelTabItem {
  id: PanelTab
  label: string
  icon: typeof FileJson2
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2)
}

function resolveInitialSourceFilePath(
  manifest: TemplateSourceManifest,
): string | undefined {
  const entryReadyFile = manifest.files.find(
    (file) => file.path === manifest.entryFile && file.status === "ready",
  )
  if (entryReadyFile) {
    return entryReadyFile.path
  }

  const firstReadyFile = manifest.files.find((file) => file.status === "ready")
  if (firstReadyFile) {
    return firstReadyFile.path
  }

  return manifest.files[0]?.path
}

function formatSourceSkipReason(reason?: TemplateSourceFile["skipReason"]): string {
  switch (reason) {
    case "binary":
      return "Binary file is not previewable."
    case "tooLarge":
      return "File is larger than the source preview limit."
    case "unreadable":
      return "File could not be read from disk."
    default:
      return "File is not available for preview."
  }
}

export default function App() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [schemaJson, setSchemaJson] = useState<string>("{}")
  const [featuresJson, setFeaturesJson] = useState<string>("{}")
  const [sourceManifest, setSourceManifest] = useState<TemplateSourceManifest>()
  const [activeSourceFilePath, setActiveSourceFilePath] = useState<string>()
  const [previewHtml, setPreviewHtml] = useState<string>()
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>()
  const [payloadText, setPayloadText] = useState<string>(
    pretty(DEFAULT_PAYLOAD),
  )
  const [activeSchemaDoc, setActiveSchemaDoc] = useState<SchemaDocTabId>(
    DEFAULT_SCHEMA_DOC_TAB_ID,
  )
  const [runtime, setRuntime] = useState<RuntimeConfig>()
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<RenderMode>("html")
  const [busyAction, setBusyAction] = useState<"preview" | "generate" | null>(
    null,
  )
  const [error, setError] = useState<string>()
  const [panelOpen, setPanelOpen] = useState(true)
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>("payload")
  const [desktopPanelSize, setDesktopPanelSize] = useState(33)
  const [sourceExplorerNavSize, setSourceExplorerNavSize] = useState(
    SOURCE_EXPLORER_NAV_DEFAULT_PERCENT,
  )
  const payloadTemplateIdRef = useRef<string | undefined>(undefined)
  const payloadDirtyRef = useRef(false)
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }
    return window.matchMedia("(min-width: 768px)").matches
  })

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [templates, selectedId],
  )
  const selectedSourceFile = useMemo(() => {
    if (!sourceManifest || sourceManifest.files.length === 0) {
      return undefined
    }

    if (activeSourceFilePath) {
      const byPath = sourceManifest.files.find(
        (file) => file.path === activeSourceFilePath,
      )
      if (byPath) {
        return byPath
      }
    }

    const fallbackPath = resolveInitialSourceFilePath(sourceManifest)
    return sourceManifest.files.find((file) => file.path === fallbackPath)
  }, [activeSourceFilePath, sourceManifest])
  const schemaExplorerFiles = useMemo(
    () =>
      SCHEMA_DOC_TABS.map((tab) => ({
        id: tab.id,
        path: tab.label,
        status: "ready" as const,
        content: tab.id === "features-json" ? featuresJson : schemaJson,
      })),
    [featuresJson, schemaJson],
  )
  const sourceExplorerFiles = useMemo(() => {
    if (!sourceManifest) {
      return []
    }

    return sourceManifest.files.map((file) => ({
      id: file.path,
      path: file.path,
      status: file.status,
      content: file.content,
      skipReason: file.skipReason,
      bytes: file.bytes,
      badges: [
        ...(file.entry
          ? [{ label: "entry", variant: "secondary" as const }]
          : []),
        ...(file.status === "skipped"
          ? [{ label: "skipped", variant: "outline" as const }]
          : []),
      ],
    }))
  }, [sourceManifest])

  const sourceEnabled = runtime
    ? !runtime.isProduction || runtime.ui.sourceInProd
    : true
  const playgroundEnabled = runtime
    ? !runtime.isProduction || runtime.ui.playgroundInProd
    : true
  const busy = busyAction !== null
  const previewBusy = busyAction === "preview"
  const generateBusy = busyAction === "generate"

  const panelTabs = useMemo<PanelTabItem[]>(() => {
    const tabs: PanelTabItem[] = [
      { id: "payload", label: "Payload", icon: Braces },
      { id: "schema", label: "Schema", icon: FileJson2 },
    ]

    if (sourceEnabled) {
      tabs.push({ id: "source", label: "Source", icon: Code2 })
    }

    if (playgroundEnabled) {
      tabs.push({
        id: "playground",
        label: "API Playground",
        icon: TerminalSquare,
      })
    }

    return tabs
  }, [sourceEnabled, playgroundEnabled])

  const activePanel = useMemo(() => {
    return panelTabs.find((tab) => tab.id === activePanelTab) ?? panelTabs[0]
  }, [panelTabs, activePanelTab])

  useEffect(() => {
    async function loadTemplates() {
      const [runtimeConfig, templateList] = await Promise.all([
        fetchRuntime(),
        fetchTemplates(),
      ])

      setRuntime(runtimeConfig)
      setTemplates(templateList)

      if (templateList.length > 0) {
        setSelectedId((currentId) => currentId ?? templateList[0].id)
      }
    }

    loadTemplates().catch((loadError) => {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to initialize DFactory UI.",
      )
    })
  }, [])

  useEffect(() => {
    if (!selectedId) {
      return
    }

    const templateId = selectedId
    const templateChanged = payloadTemplateIdRef.current !== templateId
    if (templateChanged) {
      payloadTemplateIdRef.current = templateId
      payloadDirtyRef.current = false
    }
    let cancelled = false

    async function loadTemplateAssets() {
      const [schema, features] = await Promise.all([
        fetchTemplateSchema(templateId),
        fetchTemplateFeatures(templateId),
      ])
      if (cancelled) {
        return
      }
      setSchemaJson(pretty(schema))
      setFeaturesJson(pretty(features.features))

      if (features.examples.length > 0) {
        const nextPayloadText = pretty(features.examples[0].payload)
        setPayloadText((currentPayloadText) => {
          if (
            payloadTemplateIdRef.current !== templateId ||
            payloadDirtyRef.current
          ) {
            return currentPayloadText
          }

          return nextPayloadText
        })
      }

      if (sourceEnabled) {
        try {
          const source = await fetchTemplateSource(templateId)
          if (cancelled) {
            return
          }
          setSourceManifest(source)
          setActiveSourceFilePath(resolveInitialSourceFilePath(source))
        } catch {
          if (cancelled) {
            return
          }
          setSourceManifest(undefined)
          setActiveSourceFilePath(undefined)
        }
      } else {
        setSourceManifest(undefined)
        setActiveSourceFilePath(undefined)
      }
    }

    loadTemplateAssets().catch((loadError) => {
      if (cancelled) {
        return
      }
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load template assets.",
      )
    })

    return () => {
      cancelled = true
    }
  }, [selectedId, sourceEnabled])

  useEffect(() => {
    if (!panelTabs.some((tab) => tab.id === activePanelTab)) {
      setActivePanelTab(panelTabs[0]?.id ?? "payload")
    }
  }, [panelTabs, activePanelTab])

  useEffect(() => {
    if (!sourceManifest || sourceManifest.files.length === 0) {
      setActiveSourceFilePath(undefined)
      return
    }

    if (
      activeSourceFilePath &&
      sourceManifest.files.some((file) => file.path === activeSourceFilePath)
    ) {
      return
    }

    setActiveSourceFilePath(resolveInitialSourceFilePath(sourceManifest))
  }, [activeSourceFilePath, sourceManifest])

  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl)
      }
    }
  }, [previewPdfUrl])

  useEffect(() => {
    if (!panelOpen) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelOpen(false)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => {
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [panelOpen])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(min-width: 768px)")
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches)
    }

    setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener("change", onChange)
    return () => {
      mediaQuery.removeEventListener("change", onChange)
    }
  }, [])

  function readPayload() {
    try {
      return JSON.parse(payloadText) as unknown
    } catch {
      throw new Error("Payload must be valid JSON.")
    }
  }

  function handleDockTabClick(tab: PanelTab) {
    if (activePanelTab === tab && panelOpen) {
      setPanelOpen(false)
      return
    }

    setActivePanelTab(tab)
    setPanelOpen(true)
  }

  async function runPreview() {
    if (!selectedTemplate || busyAction) {
      return
    }

    setBusyAction("preview")
    setError(undefined)

    try {
      const payload = readPayload()
      const preflight = await preflightDocument({
        templateId: selectedTemplate.id,
        payload,
        mode,
      })
      const featureDiagnostics = preflight.diagnostics.features as Array<{
        level?: "info" | "warn" | "error"
        message?: string
      }>
      const warningCount = featureDiagnostics.filter((item) => item.level === "warn")
        .length
      const errorCount = featureDiagnostics.filter((item) => item.level === "error")
        .length
      if (errorCount > 0) {
        toast.error(`Preflight reported ${errorCount} feature error(s)`)
      } else if (warningCount > 0) {
        toast.warning(`Preflight reported ${warningCount} feature warning(s)`)
      }

      const response = await previewDocument({
        templateId: selectedTemplate.id,
        payload,
        mode,
      })

      if (mode === "html") {
        const body = response as PreviewHtmlResponse
        setPreviewHtml(body.html)
        toast.success(
          `HTML preview rendered in ${Math.round(body.diagnostics.renderMs ?? 0)}ms`,
        )
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl)
          setPreviewPdfUrl(undefined)
        }
      } else {
        const blob = response as Blob
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl)
        }
        const url = URL.createObjectURL(blob)
        setPreviewPdfUrl(url)
        toast.success("PDF preview generated")
      }
    } catch (previewError) {
      const message =
        previewError instanceof Error ? previewError.message : "Preview failed."
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  async function runGenerate() {
    if (!selectedTemplate || busyAction) {
      return
    }

    setBusyAction("generate")
    setError(undefined)

    try {
      const payload = readPayload()
      const preflight = await preflightDocument({
        templateId: selectedTemplate.id,
        payload,
        mode,
      })
      const featureDiagnostics = preflight.diagnostics.features as Array<{
        level?: "info" | "warn" | "error"
      }>
      if (featureDiagnostics.some((item) => item.level === "error")) {
        throw new Error("Preflight reported feature errors. Fix template or payload before generate.")
      }

      const response = await generateDocument({
        templateId: selectedTemplate.id,
        payload,
        mode,
      })

      if (mode === "pdf") {
        const blob = response as Blob
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = `${selectedTemplate.id}.pdf`
        anchor.click()
        URL.revokeObjectURL(url)
        toast.success("PDF generated")
      } else {
        const body = response as { html: string }
        setPreviewHtml(body.html)
        toast.success("HTML generated and loaded in preview")
      }
    } catch (generationError) {
      const message =
        generationError instanceof Error ? generationError.message : "Generate failed."
      toast.error(message)
    } finally {
      setBusyAction(null)
    }
  }

  const clampedDesktopPanelSize = Math.min(70, Math.max(24, desktopPanelSize))
  const workspacePanelSize = Math.max(30, 100 - clampedDesktopPanelSize)

  function renderInspectorBody() {
    return (
      <div className="min-h-0 flex-1 p-4">
        {activePanel.id === "payload" ? (
          <CodeEditor
            value={payloadText}
            onChange={(nextValue) => {
              payloadTemplateIdRef.current = selectedId
              payloadDirtyRef.current = true
              setPayloadText(nextValue)
            }}
            config={getInspectorEditorConfig({ panel: "payload" })}
            className="h-full"
            data-testid="payload-editor"
          />
        ) : null}

        {activePanel.id === "schema" ? (
          <InspectorCodeExplorer
            files={schemaExplorerFiles}
            activeFileId={activeSchemaDoc}
            onSelectFile={(fileId) =>
              setActiveSchemaDoc(resolveSchemaDocTabId(fileId))
            }
            resolveEditorConfig={() => getInspectorEditorConfig({ panel: "schema" })}
            resolveSkippedMessage={() => "File is not available for preview."}
            emptyState={{
              title: "Schema documents unavailable",
              description: "Unable to load schema and feature documents.",
              icon: FileJson2,
            }}
            sectionLabel="Schema Files"
            testIdPrefix="schema"
          />
        ) : null}

        {activePanel.id === "source" ? (
          <InspectorCodeExplorer
            files={sourceExplorerFiles}
            activeFileId={selectedSourceFile?.path}
            onSelectFile={setActiveSourceFilePath}
            resolveEditorConfig={(file) =>
              getInspectorEditorConfig({
                panel: "source",
                sourceFilePath: file.path,
              })
            }
            resolveSkippedMessage={(file) => formatSourceSkipReason(file.skipReason)}
            emptyState={{
              title: "No source files found",
              description:
                "This template folder does not contain previewable source files.",
              icon: Code2,
            }}
            sectionLabel="Template Files"
            testIdPrefix="source"
            resizableNav={isDesktop}
            navPanelSize={sourceExplorerNavSize}
            onNavPanelSizeChange={setSourceExplorerNavSize}
          />
        ) : null}

        {activePanel.id === "playground" ? (
          <ScrollArea className="h-full rounded-lg border bg-muted/30">
            <div className="flex flex-col gap-3 p-3 text-xs">
              <p>
                <strong>Preview:</strong> POST{" "}
                <code>/api/document/preview</code>
              </p>
              <p>
                <strong>Generate:</strong> POST{" "}
                <code>/api/document/generate</code>
              </p>
              <pre
                className="overflow-auto rounded-lg bg-background p-3"
                data-testid="playground-curl"
              >
                {`curl -X POST ${import.meta.env.VITE_DFACTORY_API_URL ?? "http://127.0.0.1:3210/api"}/document/preview \\
  -H 'content-type: application/json' \\
  -d '{"templateId":"${selectedTemplate?.id ?? "invoice"}","payload":${payloadText},"mode":"${mode}"}'`}
              </pre>
            </div>
          </ScrollArea>
        ) : null}
      </div>
    )
  }

  function renderInspectorPanelContent() {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Inspector
            </p>
            <div className="flex items-center gap-2 text-sm font-semibold">
              <activePanel.icon className="h-4 w-4" />
              {activePanel.label}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="self-center"
            onClick={() => setPanelOpen(false)}
            aria-label="Collapse bottom panel"
            data-testid="bottom-panel-collapse"
          >
            <Minimize />
          </Button>
        </div>
        <Separator />
        {renderInspectorBody()}
      </div>
    )
  }

  function renderWorkspace(isMobile: boolean) {
    const errorPositionClass = isMobile
      ? panelOpen
        ? "bottom-[calc(60vh+4.5rem)]"
        : "bottom-16"
      : "bottom-4"

    return (
      <main className="relative h-full min-h-0 p-4">
        <div className="size-full min-h-0">
          {mode === "html" ? (
            previewHtml ? (
              <iframe
                title="Preview HTML"
                srcDoc={previewHtml}
                className="size-full rounded-lg border bg-white"
                data-testid="preview-frame"
              />
            ) : (
              <Empty
                className="size-full rounded-lg border bg-muted/15"
                data-testid="preview-empty-html"
              >
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Code2 />
                  </EmptyMedia>
                  <EmptyTitle>No HTML preview yet</EmptyTitle>
                  <EmptyDescription>
                    Run preview to render this template as HTML.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button onClick={runPreview} disabled={busy || !selectedTemplate}>
                    {previewBusy ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <Eye data-icon="inline-start" />
                    )}
                    {previewBusy ? "Previewing..." : "Preview"}
                  </Button>
                </EmptyContent>
              </Empty>
            )
          ) : previewPdfUrl ? (
            <iframe
              title="Preview PDF"
              src={previewPdfUrl}
              className="size-full rounded-lg border bg-white"
              data-testid="preview-pdf-frame"
            />
          ) : (
            <Empty
              className="size-full rounded-lg border bg-muted/15"
              data-testid="preview-empty-pdf"
            >
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <FileText />
                </EmptyMedia>
                <EmptyTitle>No PDF preview yet</EmptyTitle>
                <EmptyDescription>
                  Run preview to generate and open a PDF preview.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button onClick={runPreview} disabled={busy || !selectedTemplate}>
                  {previewBusy ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <Eye data-icon="inline-start" />
                  )}
                  {previewBusy ? "Previewing..." : "Preview"}
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </div>

        {error ? (
          <div
            className={cn(
              "absolute left-1/2 z-30 flex w-[min(44rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm",
              errorPositionClass,
            )}
            data-testid="error-banner"
          >
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        ) : null}
      </main>
    )
  }

  return (
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "20rem" } as CSSProperties}
      className="relative h-screen overflow-hidden"
      data-testid="dfactory-app"
    >
      <TemplateCatalog
        templates={templates}
        selectedId={selectedId}
        query={query}
        onQueryChange={setQuery}
        onSelect={setSelectedId}
      />

      <SidebarInset className="min-h-0 pb-14">
        <Topbar
          selectedTemplate={selectedTemplate}
          mode={mode}
          onModeChange={setMode}
          onPreview={runPreview}
          onGenerate={runGenerate}
          busy={busy}
          previewBusy={previewBusy}
          generateBusy={generateBusy}
        />

        <div className="min-h-0 flex-1">
          {isDesktop ? (
            panelOpen ? (
              <ResizablePanelGroup
                id="workspace-resizable-group"
                orientation="vertical"
                className="[&:has([data-separator=active])_iframe]:pointer-events-none"
                resizeTargetMinimumSize={{ coarse: 40, fine: 16 }}
                onLayoutChanged={(layout) => {
                  const nextBottomSize = layout["inspector-panel"]
                  if (typeof nextBottomSize === "number") {
                    setDesktopPanelSize(
                      Math.min(70, Math.max(24, nextBottomSize)),
                    )
                  }
                }}
              >
                <ResizablePanel
                  id="workspace-panel"
                  defaultSize={`${workspacePanelSize}%`}
                  minSize="30%"
                >
                  {renderWorkspace(false)}
                </ResizablePanel>
                <ResizableHandle
                  withHandle
                  className="bottom-panel-resize-handle bg-transparent"
                  data-testid="bottom-panel-resize-handle"
                />
                <ResizablePanel
                  id="inspector-panel"
                  defaultSize={`${clampedDesktopPanelSize}%`}
                  minSize="24%"
                  maxSize="70%"
                >
                  <section
                    id={`panel-${activePanel.id}`}
                    role="tabpanel"
                    aria-labelledby={`dock-tab-${activePanel.id}`}
                    className="h-full border-t border-border/90 bg-muted/70 shadow-[0_-18px_36px_-24px_hsl(var(--foreground)/0.45)] backdrop-blur-lg supports-[backdrop-filter]:bg-muted/65"
                    data-testid="bottom-panel"
                  >
                    {renderInspectorPanelContent()}
                  </section>
                </ResizablePanel>
              </ResizablePanelGroup>
            ) : (
              <div className="h-full">{renderWorkspace(false)}</div>
            )
          ) : (
            <div className="h-full">{renderWorkspace(true)}</div>
          )}
        </div>

        <footer
          className="absolute inset-x-0 bottom-0 z-40 border-t border-border/90 bg-muted/95 shadow-[0_-8px_20px_-16px_hsl(var(--foreground)/0.35)] backdrop-blur-md supports-[backdrop-filter]:bg-muted/85"
          data-testid="bottom-dock"
          data-sticky="true"
        >
          <div className="flex min-h-14 items-center gap-2 px-4">
            <div
              className="flex flex-1 items-center gap-2"
              role="tablist"
              aria-label="Template detail panels"
              data-testid="bottom-dock-tablist"
            >
              {panelTabs.map((tab) => {
                const isActive = panelOpen && activePanelTab === tab.id

                return (
                  <Button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`dock-tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    aria-expanded={isActive}
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className="shrink-0 gap-1.5"
                    onClick={() => handleDockTabClick(tab.id)}
                    data-testid={`dock-tab-${tab.id}`}
                  >
                    <tab.icon className="h-3.5 w-3.5" />
                    {tab.label}
                  </Button>
                )
              })}
            </div>

            {panelOpen ? null : (
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="self-center"
                onClick={() => setPanelOpen(true)}
                aria-label="Expand bottom panel"
                data-testid="bottom-panel-collapse"
              >
                <Maximize />
              </Button>
            )}
          </div>
        </footer>
      </SidebarInset>

      <AnimatePresence>
        {!isDesktop && panelOpen ? (
          <motion.section
            key="bottom-panel"
            id={`panel-${activePanel.id}`}
            role="tabpanel"
            aria-labelledby={`dock-tab-${activePanel.id}`}
            className="absolute inset-x-0 bottom-14 z-30 h-[60vh] border-t border-border/90 bg-muted/85 shadow-[0_-18px_36px_-24px_hsl(var(--foreground)/0.45)] backdrop-blur-lg supports-[backdrop-filter]:bg-muted/75"
            data-testid="bottom-panel"
            initial={{ y: "100%", opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.4 }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 34,
              mass: 0.85,
            }}
          >
            {renderInspectorPanelContent()}
          </motion.section>
        ) : null}
      </AnimatePresence>

    </SidebarProvider>
  )
}
