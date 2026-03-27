import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Code2, FileJson2, PlayCircle, TerminalSquare } from "lucide-react";

import { TemplateCatalog } from "@/components/template-catalog";
import { Topbar } from "@/components/topbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export default function App() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string>();
  const [schemaJson, setSchemaJson] = useState<string>("{}");
  const [sourceCode, setSourceCode] = useState<string>("// Source unavailable");
  const [previewHtml, setPreviewHtml] = useState<string>("<p>Run preview to see output.</p>");
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string>();
  const [payloadText, setPayloadText] = useState<string>(pretty(DEFAULT_PAYLOAD));
  const [runtime, setRuntime] = useState<RuntimeConfig>();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<RenderMode>("html");
  const [status, setStatus] = useState<string>("Ready");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedId),
    [templates, selectedId]
  );

  const sourceEnabled = runtime ? !runtime.isProduction || runtime.ui.sourceInProd : true;
  const playgroundEnabled = runtime ? !runtime.isProduction || runtime.ui.playgroundInProd : true;

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
    return () => {
      if (previewPdfUrl) {
        URL.revokeObjectURL(previewPdfUrl);
      }
    };
  }, [previewPdfUrl]);

  function readPayload() {
    try {
      return JSON.parse(payloadText) as unknown;
    } catch {
      throw new Error("Payload must be valid JSON.");
    }
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
    <div className="flex h-screen flex-col" data-testid="dfactory-app">
      <Topbar
        selectedTemplate={selectedTemplate}
        mode={mode}
        onModeChange={setMode}
        onPreview={runPreview}
        onGenerate={runGenerate}
        onRefreshTemplates={loadTemplates}
        busy={busy}
      />

      <div className="flex min-h-0 flex-1">
        <TemplateCatalog
          templates={templates}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={setSelectedId}
        />

        <main className="min-h-0 flex-1 p-4">
          <div className="grid h-full min-h-0 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
            <Card className="min-h-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <PlayCircle className="h-4 w-4" />
                  Live Preview
                </CardTitle>
                <CardDescription>{status}</CardDescription>
              </CardHeader>
              <CardContent className="min-h-0 h-[calc(100%-78px)]">
                {mode === "html" ? (
                  <iframe
                    title="Preview HTML"
                    srcDoc={previewHtml}
                    className="h-full w-full rounded-lg border bg-white"
                    data-testid="preview-frame"
                  />
                ) : (
                  <iframe
                    title="Preview PDF"
                    src={previewPdfUrl}
                    className="h-full w-full rounded-lg border bg-white"
                    data-testid="preview-pdf-frame"
                  />
                )}
              </CardContent>
            </Card>

            <Card className="min-h-0 overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Payload</CardTitle>
                <CardDescription>Schema-aware payload editor</CardDescription>
              </CardHeader>
              <CardContent className="h-[calc(100%-78px)]">
                <Textarea
                  value={payloadText}
                  onChange={(event) => setPayloadText(event.target.value)}
                  className="h-full min-h-full font-mono text-xs"
                  data-testid="payload-editor"
                />
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="schema" className="mt-4">
            <TabsList>
              <TabsTrigger value="schema">
                <FileJson2 className="mr-1 h-3.5 w-3.5" />
                Schema
              </TabsTrigger>
              {sourceEnabled ? (
                <TabsTrigger value="source">
                  <Code2 className="mr-1 h-3.5 w-3.5" />
                  Source
                </TabsTrigger>
              ) : null}
              {playgroundEnabled ? (
                <TabsTrigger value="playground">
                  <TerminalSquare className="mr-1 h-3.5 w-3.5" />
                  API Playground
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value="schema">
              <Card>
                <CardContent className="pt-4">
                  <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted p-3 text-xs" data-testid="schema-view">
                    {schemaJson}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>

            {sourceEnabled ? (
              <TabsContent value="source">
                <Card>
                  <CardContent className="pt-4">
                    <pre className="max-h-[300px] overflow-auto rounded-lg bg-muted p-3 text-xs" data-testid="source-view">
                      {sourceCode}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}

            {playgroundEnabled ? (
              <TabsContent value="playground">
                <Card>
                  <CardContent className="space-y-3 pt-4 text-xs">
                    <p>
                      <strong>Preview:</strong> POST <code>/api/document/preview</code>
                    </p>
                    <p>
                      <strong>Generate:</strong> POST <code>/api/document/generate</code>
                    </p>
                    <pre className="max-h-[220px] overflow-auto rounded-lg bg-muted p-3" data-testid="playground-curl">
{`curl -X POST ${import.meta.env.VITE_DFACTORY_API_URL ?? "http://127.0.0.1:3210/api"}/document/preview \\
  -H 'content-type: application/json' \\
  -d '{"templateId":"${selectedTemplate?.id ?? "invoice"}","payload":${payloadText},"mode":"${mode}"}'`}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            ) : null}
          </Tabs>

          {error ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="error-banner">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
