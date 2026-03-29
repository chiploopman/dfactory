import { expect, test, type Page } from "@playwright/test";

function getProdUrl(projectName: string): string {
  if (projectName.startsWith("vue-")) {
    return "http://127.0.0.1:3320";
  }

  return "http://127.0.0.1:3220";
}

function getDevApiUrl(projectName: string): string {
  if (projectName.startsWith("vue-")) {
    return "http://127.0.0.1:3310/api";
  }

  return "http://127.0.0.1:3210/api";
}

async function setCodeMirrorValue(page: Page, testId: string, value: string) {
  const editorContent = page.getByTestId(testId).locator(".cm-content").first();
  await expect(editorContent).toBeVisible();
  await editorContent.click();
  await page.keyboard.press(process.platform === "darwin" ? "Meta+a" : "Control+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(value);
}

test("dev mode: catalog, payload edit, html/pdf preview, generate, dock panel behavior", async ({ page }, testInfo) => {
  await page.goto("/");

  await expect(page.getByTestId("dfactory-app")).toBeVisible();
  const templateSearchInput = page.getByRole("textbox", {
    name: "Search templates",
  });
  await expect(templateSearchInput).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  const invoiceItem = page.locator("[data-template-id='invoice']");
  await expect(invoiceItem.getByTestId("template-item-name")).toContainText("Invoice");
  await expect(invoiceItem.getByTestId("template-item-id")).toHaveText("invoice");
  await expect(
    page.locator("header").getByTestId("preview-mode-tabs"),
  ).toBeVisible();

  await templateSearchInput.fill("invoice-reference");
  await expect(page.locator("[data-template-id='invoice-reference']")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toHaveCount(0);

  await templateSearchInput.fill("starter");
  await expect(page.getByText("No templates found for this search.")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toHaveCount(0);
  await expect(page.locator("[data-template-id='invoice-reference']")).toHaveCount(0);

  await templateSearchInput.fill("invoice");
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  await page.locator("[data-template-id='invoice']").click();
  await expect(page.getByTestId("topbar-preview-button")).toBeEnabled();
  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("dock-tab-payload")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("preview-empty-html")).toBeVisible();
  const emptyPreviewButton = page
    .getByTestId("preview-empty-html")
    .getByRole("button", { name: "Preview" });
  await expect(emptyPreviewButton).toHaveAttribute("data-size", "default");
  const emptyPreviewClass = await page.getByTestId("preview-empty-html").evaluate((element) => {
    return element.className;
  });
  expect(emptyPreviewClass).toContain("size-full");
  await expect(page.getByTestId("payload-editor")).toBeVisible();
  await expect(page.getByTestId("payload-editor").locator(".cm-editor")).toBeVisible();

  await setCodeMirrorValue(
    page,
    "payload-editor",
    JSON.stringify(
      {
        invoiceNumber: "INV-2026",
        customerName: "Acme Corporation",
        issuedAt: "2026-03-27",
        items: [
          { name: "Design", qty: 2, price: 150 },
          { name: "Development", qty: 3, price: 220 }
        ]
      },
      null,
      2
    )
  );

  const apiBase = getDevApiUrl(testInfo.project.name);
  const preflightResponse = await page.request.post(`${apiBase}/document/preflight`, {
    data: {
      templateId: "invoice",
      payload: {
        invoiceNumber: "INV-2026",
        customerName: "Acme Corporation",
        issuedAt: "2026-03-27",
        items: [
          { name: "Design", qty: 2, price: 150 },
          { name: "Development", qty: 3, price: 220 }
        ]
      },
      mode: "pdf"
    }
  });
  expect(preflightResponse.ok()).toBeTruthy();
  const preflightBody = (await preflightResponse.json()) as {
    ok: boolean;
    resolvedFeatures: {
      toc?: {
        enabled?: boolean;
      };
    };
  };
  expect(preflightBody.ok).toBe(true);
  expect(preflightBody.resolvedFeatures.toc?.enabled).toBe(true);

  const featuresResponse = await page.request.get(`${apiBase}/templates/invoice/features`);
  expect(featuresResponse.ok()).toBeTruthy();
  const featuresBody = (await featuresResponse.json()) as {
    features: {
      toc?: {
        enabled?: boolean;
      };
    };
  };
  expect(featuresBody.features.toc?.enabled).toBe(true);

  const [htmlPreviewResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/preview") && response.request().method() === "POST";
    }),
    page.getByTestId("topbar-preview-button").click()
  ]);

  const htmlPreviewBody = (await htmlPreviewResponse.json()) as { mode: string };
  const htmlPreviewRequest = htmlPreviewResponse.request().postDataJSON() as {
    payload: { invoiceNumber: string };
  };

  expect(htmlPreviewResponse.ok()).toBeTruthy();
  expect(htmlPreviewBody.mode).toBe("html");
  expect(htmlPreviewRequest.payload.invoiceNumber).toBe("INV-2026");
  await expect(page.getByTestId("preview-frame")).toBeVisible();

  await page.getByRole("tab", { name: "PDF" }).click();
  const [pdfPreviewResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/preview") && response.request().method() === "POST";
    }),
    page.getByTestId("topbar-preview-button").click()
  ]);

  expect(pdfPreviewResponse.ok()).toBeTruthy();
  expect(pdfPreviewResponse.headers()["content-type"]).toContain("application/pdf");
  await expect(page.getByTestId("preview-pdf-frame")).toBeVisible();

  const [generateResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/generate") && response.request().method() === "POST";
    }),
    page.getByTestId("topbar-generate-button").click()
  ]);

  expect(generateResponse.ok()).toBeTruthy();
  expect(generateResponse.headers()["content-type"]).toContain("application/pdf");

  await expect(page.locator("[data-template-id='invoice-reference']")).toBeVisible();
  await page.locator("[data-template-id='invoice-reference']").click();
  await expect(page.getByTestId("topbar-preview-button")).toBeEnabled();

  const referenceFeaturesResponse = await page.request.get(
    `${apiBase}/templates/invoice-reference/features`,
  );
  expect(referenceFeaturesResponse.ok()).toBeTruthy();
  const referenceFeaturesBody = (await referenceFeaturesResponse.json()) as {
    features: {
      toc?: {
        enabled?: boolean;
      };
    };
    elementCapabilities: Record<
      string,
      { defined: boolean; hasRender: boolean; hasTemplate: boolean }
    >;
  };
  expect(referenceFeaturesBody.features.toc?.enabled).toBe(true);
  expect(referenceFeaturesBody.elementCapabilities.toc.hasRender).toBe(true);
  expect(referenceFeaturesBody.elementCapabilities.header.hasRender).toBe(true);
  expect(referenceFeaturesBody.elementCapabilities.pagination.hasRender).toBe(true);

  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("bottom-dock")).toHaveAttribute("data-sticky", "true");
  await expect(page.getByTestId("bottom-panel")).toBeVisible();

  const panelBackground = await page.getByTestId("bottom-panel").evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  expect(panelBackground).not.toBe("rgba(0, 0, 0, 0)");

  const panelClassName = await page.getByTestId("bottom-panel").evaluate((element) => {
    return element.className;
  });
  expect(panelClassName).toContain("border-t");
  expect(panelClassName).toContain("shadow-[0_-18px_36px_-24px_hsl(var(--foreground)/0.45)]");

  const dockClassName = await page.getByTestId("bottom-dock").evaluate((element) => {
    return element.className;
  });
  expect(dockClassName).toContain("border-t");
  expect(dockClassName).toContain("shadow-[0_-8px_20px_-16px_hsl(var(--foreground)/0.35)]");

  const viewport = page.viewportSize();
  const dockBounds = await page.getByTestId("bottom-dock").boundingBox();
  expect(viewport).toBeTruthy();
  expect(dockBounds).toBeTruthy();
  expect((dockBounds?.x ?? 0)).toBeGreaterThan(100);
  expect((dockBounds?.width ?? 0)).toBeLessThan((viewport?.width ?? 0) - 80);
  const resizeHandle = page.locator(".bottom-panel-resize-handle").first();
  await expect(resizeHandle).toBeVisible();
  const resizeHandleBounds = await resizeHandle.boundingBox();
  expect(resizeHandleBounds).toBeTruthy();
  expect((resizeHandleBounds?.width ?? 0)).toBeGreaterThan((resizeHandleBounds?.height ?? 0));

  const initialPanelBounds = await page.getByTestId("bottom-panel").boundingBox();
  expect(initialPanelBounds).toBeTruthy();
  const handleCenterX = (resizeHandleBounds?.x ?? 0) + (resizeHandleBounds?.width ?? 0) / 2;
  const handleCenterY = (resizeHandleBounds?.y ?? 0) + (resizeHandleBounds?.height ?? 0) / 2;
  await page.mouse.move(handleCenterX, handleCenterY);
  await page.mouse.down();
  await page.mouse.move(handleCenterX, handleCenterY - 140, { steps: 16 });
  await page.mouse.up();

  const expandedPanelBounds = await page.getByTestId("bottom-panel").boundingBox();
  expect(expandedPanelBounds).toBeTruthy();
  const expandedDelta = Math.abs((expandedPanelBounds?.height ?? 0) - (initialPanelBounds?.height ?? 0));
  expect(expandedDelta).toBeGreaterThan(20);

  await page.mouse.move(handleCenterX, handleCenterY - 140);
  await page.mouse.down();
  await page.mouse.move(handleCenterX, 8, { steps: 24 });
  await page.mouse.up();

  const maxPanelBounds = await page.getByTestId("bottom-panel").boundingBox();
  expect(maxPanelBounds).toBeTruthy();
  expect((maxPanelBounds?.height ?? 0)).toBeLessThanOrEqual((viewport?.height ?? 0) * 0.72);

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("schema-explorer")).toBeVisible();
  await expect(page.getByTestId("schema-explorer-list")).toBeVisible();
  const activeSchemaFile = page
    .locator('[data-testid="schema-explorer-file"][data-active="true"]')
    .first();
  await expect(activeSchemaFile).toBeVisible();
  await expect(page.getByTestId("schema-viewer-meta")).toContainText("schema.json");
  await expect(page.getByTestId("schema-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("invoiceNumber");
  await page.getByRole("button", { name: "features.json" }).click();
  await expect(page.getByTestId("schema-viewer-meta")).toContainText("features.json");
  await expect(page.getByTestId("schema-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("\"toc\"");

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("bottom-panel-collapse")).toBeVisible();
  await page.getByTestId("bottom-panel-collapse").click();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);
  await expect(page.getByTestId("bottom-panel-collapse")).toHaveCount(0);

  await page.getByTestId("dock-tab-source").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("source-explorer")).toBeVisible();
  const sourceExplorerClassName = await page.getByTestId("source-explorer").evaluate((element) => {
    return element.className;
  });
  expect(sourceExplorerClassName).toContain("overflow-hidden");
  await expect(page.getByTestId("source-explorer-list")).toBeVisible();
  await expect(page.getByTestId("source-explorer-file").first()).toBeVisible();
  const sourceResizeHandle = page.locator(".source-explorer-resize-handle").first();
  await expect(sourceResizeHandle).toBeVisible();
  const sourceNavBefore = await page.getByTestId("source-explorer-nav").boundingBox();
  const sourceHandleBounds = await sourceResizeHandle.boundingBox();
  const sourceExplorerBounds = await page.getByTestId("source-explorer").boundingBox();
  expect(sourceNavBefore).toBeTruthy();
  expect(sourceHandleBounds).toBeTruthy();
  expect(sourceExplorerBounds).toBeTruthy();
  const initialSourceNavRatio =
    (sourceNavBefore?.width ?? 0) / (sourceExplorerBounds?.width ?? 1);
  expect(initialSourceNavRatio).toBeGreaterThan(0.17);
  expect(initialSourceNavRatio).toBeLessThanOrEqual(0.42);
  const sourceHandleCenterX = (sourceHandleBounds?.x ?? 0) + (sourceHandleBounds?.width ?? 0) / 2;
  const sourceHandleCenterY = (sourceHandleBounds?.y ?? 0) + (sourceHandleBounds?.height ?? 0) / 2;
  await page.mouse.move(sourceHandleCenterX, sourceHandleCenterY);
  await page.mouse.down();
  await page.mouse.move(sourceHandleCenterX + 180, sourceHandleCenterY, { steps: 16 });
  await page.mouse.up();
  const sourceNavAfter = await page.getByTestId("source-explorer-nav").boundingBox();
  expect(sourceNavAfter).toBeTruthy();
  const sourceResizeDelta = Math.abs((sourceNavAfter?.width ?? 0) - (sourceNavBefore?.width ?? 0));
  expect(sourceResizeDelta).toBeGreaterThan(6);
  expect((sourceNavAfter?.width ?? 0)).toBeLessThanOrEqual((sourceExplorerBounds?.width ?? 0) * 0.42);
  const sourceHandleAfterBounds = await sourceResizeHandle.boundingBox();
  expect(sourceHandleAfterBounds).toBeTruthy();
  const sourceHandleAfterCenterX =
    (sourceHandleAfterBounds?.x ?? 0) + (sourceHandleAfterBounds?.width ?? 0) / 2;
  const sourceHandleAfterCenterY =
    (sourceHandleAfterBounds?.y ?? 0) + (sourceHandleAfterBounds?.height ?? 0) / 2;
  await page.mouse.move(sourceHandleAfterCenterX, sourceHandleAfterCenterY);
  await page.mouse.down();
  await page.mouse.move((sourceExplorerBounds?.x ?? 0) + (sourceExplorerBounds?.width ?? 0) + 200, sourceHandleAfterCenterY, {
    steps: 24,
  });
  await page.mouse.up();
  const sourceNavAtMax = await page.getByTestId("source-explorer-nav").boundingBox();
  expect(sourceNavAtMax).toBeTruthy();
  expect((sourceNavAtMax?.width ?? 0)).toBeLessThanOrEqual((sourceExplorerBounds?.width ?? 0) * 0.42);
  const sourceExplorerBackground = await page.getByTestId("source-explorer").evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  const bottomPanelBackground = await page.getByTestId("bottom-panel").evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  expect(sourceExplorerBackground).not.toBe(bottomPanelBackground);
  const activeSourceFile = page
    .locator('[data-testid="source-explorer-file"][data-active="true"]')
    .first();
  await expect(activeSourceFile).toBeVisible();
  const firstSourceFile = page.getByTestId("source-explorer-file").first();
  const firstSourcePath = await firstSourceFile.getAttribute("data-file-path");
  expect(firstSourcePath).toBeTruthy();
  const firstSourceLabel = firstSourceFile.getByTestId("source-explorer-file-label");
  await firstSourceLabel.hover();
  await expect(page.locator("[data-slot='tooltip-content']").last()).toContainText(firstSourcePath ?? "");
  await firstSourceFile.click();
  await expect(page.getByTestId("source-viewer-meta")).toContainText(firstSourcePath ?? "");
  await expect(page.getByTestId("source-viewer-copy")).toBeVisible();
  const activeTabBackground = await activeSourceFile.evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  const inactiveSourceTab = page
    .locator('[data-testid="source-explorer-file"][data-active="false"]')
    .first();
  if ((await inactiveSourceTab.count()) > 0) {
    const inactiveTabBackground = await inactiveSourceTab.evaluate((element) => {
      return getComputedStyle(element).backgroundColor;
    });
    expect(activeTabBackground).not.toBe(inactiveTabBackground);
  } else {
    const activeTabBorder = await activeSourceFile.evaluate((element) => {
      return getComputedStyle(element).borderColor;
    });
    expect(activeTabBorder).not.toBe("rgba(0, 0, 0, 0)");
  }
  await expect(page.getByTestId("source-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("source-view")).toContainText("defineTemplate");
  await page.getByRole("button", { name: "components" }).click();

  if (testInfo.project.name.startsWith("vue-")) {
    const tsTemplateFile = page.getByRole("button", { name: "template.ts" });
    await tsTemplateFile.click();
    await expect(tsTemplateFile).toHaveAttribute("data-icon-kind", "typescript");
    await page.getByRole("button", { name: "InvoiceReferenceDocument.vue" }).click();
    await expect(
      page.getByRole("button", { name: "InvoiceReferenceDocument.vue" }),
    ).toHaveAttribute("data-icon-kind", "vue");
    await expect(page.getByTestId("source-view")).toContainText("<template>");
  } else {
    await page.getByRole("button", { name: "InvoiceReferenceDocument.tsx" }).click();
    await expect(
      page.getByRole("button", { name: "InvoiceReferenceDocument.tsx" }),
    ).toHaveAttribute("data-icon-kind", "react");
    await expect(page.getByTestId("source-view")).toContainText("InvoiceReferenceDocument");
  }

  await page.getByTestId("dock-tab-playground").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("playground-curl")).toContainText("/document/preview");
});

test("prod mode: source and playground tabs are hidden by default", async ({ page }, testInfo) => {
  await page.goto(getProdUrl(testInfo.project.name));

  await expect(page.getByTestId("dfactory-app")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("dock-tab-payload")).toBeVisible();
  await expect(page.getByTestId("dock-tab-payload")).toHaveAttribute("aria-selected", "true");
  await expect(page.getByTestId("dock-tab-schema")).toBeVisible();
  await expect(page.getByTestId("dock-tab-source")).toHaveCount(0);
  await expect(page.getByTestId("dock-tab-playground")).toHaveCount(0);
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("payload-editor")).toBeVisible();
  await expect(page.getByTestId("payload-editor").locator(".cm-editor")).toBeVisible();

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("schema-explorer")).toBeVisible();
  await expect(page.getByTestId("schema-explorer-list")).toBeVisible();
  await expect(page.getByTestId("schema-viewer-meta")).toContainText("schema.json");
  await expect(page.getByTestId("schema-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("invoiceNumber");
});
