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
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  await page.locator("[data-template-id='invoice']").click();
  await expect(page.getByTestId("topbar-preview-button")).toBeEnabled();
  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("dock-tab-payload")).toHaveAttribute("aria-selected", "true");
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

  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("bottom-dock")).toHaveAttribute("data-sticky", "true");
  await expect(page.getByTestId("bottom-panel")).toBeVisible();

  const panelBackground = await page.getByTestId("bottom-panel").evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  const workspaceBackground = await page
    .locator("main [data-slot='card']")
    .first()
    .evaluate((element) => {
      return getComputedStyle(element).backgroundColor;
    });
  expect(panelBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(panelBackground).not.toBe(workspaceBackground);

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
  expect(Math.abs((dockBounds?.x ?? 0) - 0)).toBeLessThanOrEqual(2);
  expect(Math.abs((dockBounds?.width ?? 0) - (viewport?.width ?? 0))).toBeLessThanOrEqual(2);
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
  await expect(page.getByTestId("schema-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("invoiceNumber");

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await page.getByTestId("bottom-panel-collapse").click();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);

  await page.getByTestId("dock-tab-source").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("source-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("source-view")).toContainText("defineTemplate");

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
  await expect(page.getByTestId("schema-view").locator(".cm-editor")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("invoiceNumber");
});
