import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Braces, ChevronsDown, Code2, Eye, FileJson2, FileText, PlayCircle, TerminalSquare } from "lucide-react";

import { TemplateCatalog } from "@/components/template-catalog";
import { Topbar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchRuntime,
  fetchTemplateSchema,
  fetchTemplateSource,
  fetchTemplates,
  generateDocument,
  previewDocument,
  type RenderMode
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PreviewHtmlResponse, RuntimeConfig, TemplateSummary } from "@/types/api";

const DEFAULT_PAYLOAD = {
  invoiceNumber: "INV-1001",
  customerName: "Northwind Trading",
  issuedAt: "2026-03-27",
  items: [
    { name: "Consulting", qty: 2, price: 420 },
    { name: "Support", qty: 1, price: 180 }
  ]
};

type PanelTab = "payload" | "schema" | "source" | "playground";

interface PanelTabItem {
  id: PanelTab;
  label: string;
  icon: typeof FileJson2;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [schemaJson, setSchemaJson] = useState<string>("{}");
  const [sourceCode, setSourceCode] = useState<string>("// Source unavailable");
  const [previewHtml, setPreviewHtml] = useState<string>();
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>();
  const [payloadText, setPayloadText] = useState<string>(pretty(DEFAULT_PAYLOAD));
  const [runtime, setRuntime] = useState<RuntimeConfig>();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<RenderMode>("html");
  const [status, setStatus] = useState<string>("Ready");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [panelOpen, setPanelOpen] = useState(false);
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>("payload");

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [templates, selectedId]
  );

  const sourceEnabled = runtime ? !runtime.isProduction || runtime.ui.sourceInProd : true;
  const playgroundEnabled = runtime ? !runtime.isProduction || runtime.ui.playgroundInProd : true;

  const panelTabs = useMemo<PanelTabItem[]>(() => {
    const tabs: PanelTabItem[] = [
      { id: "payload", label: "Payload", icon: Braces },
      { id: "schema", label: "Schema", icon: FileJson2 }
    ];

    if (sourceEnabled) {
      tabs.push({ id: "source", label: "Source", icon: Code2 });
    }

    if (playgroundEnabled) {
      tabs.push({ id: "playground", label: "API Playground", icon: TerminalSquare });
    }

    return tabs;
  }, [sourceEnabled, playgroundEnabled]);

  const activePanel = useMemo(() => {
    return panelTabs.find((tab) => tab.id === activePanelTab) ?? panelTabs[0];
  }, [panelTabs, activePanelTab]);

  async function loadTemplates() {
    const [runtimeConfig, templateList] = await Promise.all([fetchRuntime(), fetchTemplates()]);

    setRuntime(runtimeConfig);
    setTemplates(templateList);

    if (templateList.length > 0 && !selectedId) {
      setSelectedId(templateList[0].id);
    }
  }

  async function loadTemplateAssets(templateId: string) {
    const [schema] = await Promise.all([fetchTemplateSchema(templateId)]);
    setSchemaJson(pretty(schema));

    if (sourceEnabled) {
      try {
        const source = await fetchTemplateSource(templateId);
        setSourceCode(source);
      } catch {
        setSourceCode("// Source disabled or unavailable");
      }
    } else {
      setSourceCode("// Source disabled in production");
    }
  }

  useEffect(() => {
    loadTemplates().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to initialize DFactory UI.");
    });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    loadTemplateAssets(selectedId).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Failed to load template assets.");
    });
  }, [selectedId, sourceEnabled]);

  useEffect(() => {
    if (!panelTabs.some((tab) => tab.id === activePanelTab)) {
      setActivePanelTab(panelTabs[0]?.id ?? "payload");
    }
  }, [panelTabs, activePanelTab]);

  useEffect(() => {
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  useEffect(() => {
    if (!panelOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPanelOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [panelOpen]);

  function readPayload() {
    try {
      return JSON.parse(payloadText) as unknown;
    } catch {
      throw new Error("Payload must be valid JSON.");
    }
  }

  function handleDockTabClick(tab: PanelTab) {
    if (activePanelTab === tab && panelOpen) {
      setPanelOpen(false);
      return;
    }

    setActivePanelTab(tab);
    setPanelOpen(true);
  }

  async function runPreview() {
    if (!selectedTemplate) {
      return;
    }

    setBusy(true);
    setError(undefined);

    try {
      const payload = readPayload();
      const response = await previewDocument({
        templateId: selectedTemplate.id,
        payload,
        mode
      });

      if (mode === "html") {
        const body = response as PreviewHtmlResponse;
        setPreviewHtml(body.html);
        setStatus(`Preview rendered in ${Math.round(body.diagnostics.renderMs ?? 0)}ms`);
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl);
          setPreviewPdfUrl(undefined);
        }
      } else {
        const blob = response as Blob;
        if (previewPdfUrl) {
          URL.revokeObjectURL(previewPdfUrl);
        }
        const url = URL.createObjectURL(blob);
        setPreviewPdfUrl(url);
        setStatus("PDF preview generated");
      }
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : "Preview failed.");
      setStatus("Preview failed");
    } finally {
      setBusy(false);
    }
  }

  async function runGenerate() {
    if (!selectedTemplate) {
      return;
    }

    setBusy(true);
    setError(undefined);

    try {
      const payload = readPayload();
      const response = await generateDocument({
        templateId: selectedTemplate.id,
        payload,
        mode
      });

      if (mode === "pdf") {
        const blob = response as Blob;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${selectedTemplate.id}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
      } else {
        const body = response as { html: string };
        setPreviewHtml(body.html);
      }

      setStatus(`Generate completed (${mode.toUpperCase()})`);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "Generate failed.");
      setStatus("Generate failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex h-screen flex-col overflow-hidden" data-testid="dfactory-app">
      <Topbar
        selectedTemplate={selectedTemplate}
        onPreview={runPreview}
        onGenerate={runGenerate}
        busy={busy}
      />

      <div className="flex min-h-0 flex-1 pb-14">
        <TemplateCatalog
          templates={templates}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={setSelectedId}
        />

        <main className="relative min-h-0 flex-1 p-4">
          <div className="h-full min-h-0">
            <Card className="h-full min-h-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PlayCircle className="h-4 w-4" />
                  Live Preview
                </CardTitle>
                <CardDescription>{status}</CardDescription>
                <CardAction>
                  <Tabs
                    value={mode}
                    onValueChange={(nextValue) => setMode(nextValue as RenderMode)}
                    className="gap-0"
                    data-testid="preview-mode-tabs"
                  >
                    <TabsList>
                      <TabsTrigger value="html" data-testid="preview-mode-html">
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="pdf" data-testid="preview-mode-pdf">
                        PDF
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardAction>
              </CardHeader>
              <CardContent className="min-h-0 h-[calc(100%-78px)]">
                {mode === "html" ? (
                  previewHtml ? (
                    <iframe
                      title="Preview HTML"
                      srcDoc={previewHtml}
                      className="h-full w-full rounded-lg border bg-white"
                      data-testid="preview-frame"
                    />
                  ) : (
                    <Empty className="h-full rounded-lg border bg-muted/15" data-testid="preview-empty-html">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Code2 />
                        </EmptyMedia>
                        <EmptyTitle>No HTML preview yet</EmptyTitle>
                        <EmptyDescription>Run preview to render this template as HTML.</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button size="sm" onClick={runPreview} disabled={busy || !selectedTemplate}>
                          <Eye data-icon="inline-start" />
                          Preview
                        </Button>
                      </EmptyContent>
                    </Empty>
                  )
                ) : (
                  previewPdfUrl ? (
                    <iframe
                      title="Preview PDF"
                      src={previewPdfUrl}
                      className="h-full w-full rounded-lg border bg-white"
                      data-testid="preview-pdf-frame"
                    />
                  ) : (
                    <Empty className="h-full rounded-lg border bg-muted/15" data-testid="preview-empty-pdf">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <FileText />
                        </EmptyMedia>
                        <EmptyTitle>No PDF preview yet</EmptyTitle>
                        <EmptyDescription>Run preview to generate and open a PDF preview.</EmptyDescription>
                      </EmptyHeader>
                      <EmptyContent>
                        <Button size="sm" onClick={runPreview} disabled={busy || !selectedTemplate}>
                          <Eye data-icon="inline-start" />
                          Preview
                        </Button>
                      </EmptyContent>
                    </Empty>
                  )
                )}
              </CardContent>
            </Card>
          </div>

          {error ? (
            <div
              className={cn(
                "absolute left-1/2 z-30 flex w-[min(44rem,calc(100%-2rem))] -translate-x-1/2 items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow-sm",
                panelOpen ? "bottom-[calc(60vh+4.5rem)] md:bottom-[calc(33vh+4.5rem)]" : "bottom-16"
              )}
              data-testid="error-banner"
            >
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </main>
      </div>

      <AnimatePresence>
        {panelOpen ? (
          <motion.section
            key="bottom-panel"
            id={`panel-${activePanel.id}`}
            role="tabpanel"
            aria-labelledby={`dock-tab-${activePanel.id}`}
            className="absolute inset-x-0 bottom-14 z-30 h-[60vh] border-t bg-background/95 shadow-[0_-20px_40px_-24px_hsl(var(--foreground)/0.4)] backdrop-blur-xl md:h-[33vh]"
            data-testid="bottom-panel"
            initial={{ y: "100%", opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.4 }}
            transition={{ type: "spring", stiffness: 320, damping: 34, mass: 0.85 }}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-3 px-4 py-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Inspector</p>
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <activePanel.icon className="h-4 w-4" />
                    {activePanel.label}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Collapse bottom panel"
                  data-testid="bottom-panel-collapse"
                >
                  <ChevronsDown className="h-4 w-4" />
                </Button>
              </div>
              <Separator />

              <div className="min-h-0 flex-1 p-4">
                {activePanel.id === "payload" ? (
                  <Textarea
                    value={payloadText}
                    onChange={(event) => setPayloadText(event.target.value)}
                    className="h-full min-h-full font-mono text-xs"
                    data-testid="payload-editor"
                  />
                ) : null}

                {activePanel.id === "schema" ? (
                  <ScrollArea className="h-full rounded-lg border bg-muted/30">
                    <pre className="p-3 text-xs" data-testid="schema-view">
                      {schemaJson}
                    </pre>
                  </ScrollArea>
                ) : null}

                {activePanel.id === "source" ? (
                  <ScrollArea className="h-full rounded-lg border bg-muted/30">
                    <pre className="p-3 text-xs" data-testid="source-view">
                      {sourceCode}
                    </pre>
                  </ScrollArea>
                ) : null}

                {activePanel.id === "playground" ? (
                  <ScrollArea className="h-full rounded-lg border bg-muted/30">
                    <div className="flex flex-col gap-3 p-3 text-xs">
                      <p>
                        <strong>Preview:</strong> POST <code>/api/document/preview</code>
                      </p>
                      <p>
                        <strong>Generate:</strong> POST <code>/api/document/generate</code>
                      </p>
                      <pre className="overflow-auto rounded-lg bg-background p-3" data-testid="playground-curl">
{`curl -X POST ${import.meta.env.VITE_DFACTORY_API_URL ?? "http://127.0.0.1:3210/api"}/document/preview \\
  -H 'content-type: application/json' \\
  -d '{"templateId":"${selectedTemplate?.id ?? "invoice"}","payload":${payloadText},"mode":"${mode}"}'`}
                      </pre>
                    </div>
                  </ScrollArea>
                ) : null}
              </div>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>

      <footer
        className="absolute inset-x-0 bottom-0 z-40 border-t bg-card/90 backdrop-blur-md supports-[backdrop-filter]:bg-card/75"
        data-testid="bottom-dock"
        data-sticky="true"
      >
        <div
          className="flex min-h-14 items-center gap-2 px-4"
          role="tablist"
          aria-label="Template detail panels"
          data-testid="bottom-dock-tablist"
        >
          {panelTabs.map((tab) => {
            const isActive = panelOpen && activePanelTab === tab.id;

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
            );
          })}
        </div>
      </footer>
    </div>
  );
}
