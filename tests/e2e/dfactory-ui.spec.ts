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
  await expect(invoiceItem.getByTestId("template-item-id")).toHaveText("invoice");
  await expect(
    page.locator("header").getByTestId("preview-mode-tabs"),
  ).toBeVisible();
  const themeToggleTrigger = page.getByTestId("theme-toggle-trigger");
  await expect(themeToggleTrigger).toBeVisible();
  const themeToggleContainer = page.getByTestId("topbar-theme-toggle");
  await expect(themeToggleContainer).toBeVisible();
  const themeSeparator = page.getByTestId("topbar-theme-separator");
  await expect(themeSeparator).toBeVisible();

  const topbarBox = await page.locator("header").boundingBox();
  const themeToggleBox = await themeToggleTrigger.boundingBox();
  expect(topbarBox).toBeTruthy();
  expect(themeToggleBox).toBeTruthy();
  expect((themeToggleBox?.x ?? 0) + (themeToggleBox?.width ?? 0)).toBeGreaterThan(
    (topbarBox?.x ?? 0) + (topbarBox?.width ?? 0) - 48,
  );

  const generateButtonBox = await page.getByTestId("topbar-generate-button").boundingBox();
  const themeSeparatorBox = await themeSeparator.boundingBox();
  expect(generateButtonBox).toBeTruthy();
  expect(themeSeparatorBox).toBeTruthy();
  expect((themeSeparatorBox?.x ?? 0)).toBeGreaterThan((generateButtonBox?.x ?? 0));
  expect((themeToggleBox?.x ?? 0)).toBeGreaterThan((themeSeparatorBox?.x ?? 0));

  const openThemeMenu = async () => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      if (await page.getByTestId("theme-toggle-menu").isVisible()) {
        return;
      }
      await themeToggleTrigger.click({ force: true });
      await page.waitForTimeout(60);
    }
    await expect(page.getByTestId("theme-toggle-menu")).toBeVisible();
  };

  await openThemeMenu();
  await expect(page.getByTestId("theme-toggle-menu")).toBeVisible();
  await expect(page.getByTestId("theme-toggle-light")).toBeVisible();
  await expect(page.getByTestId("theme-toggle-dark")).toBeVisible();
  await expect(page.getByTestId("theme-toggle-system")).toBeVisible();

  await page.getByTestId("theme-toggle-light").click({ force: true });
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.classList.contains("dark"));
  }).toBe(false);
  const lightBackground = await page.evaluate(() => {
    return getComputedStyle(document.body).backgroundColor;
  });

  await openThemeMenu();
  await page.getByTestId("theme-toggle-dark").click({ force: true });
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.classList.contains("dark"));
  }).toBe(true);
  const darkBackground = await page.evaluate(() => {
    return getComputedStyle(document.body).backgroundColor;
  });
  expect(darkBackground).not.toBe(lightBackground);
  const darkLogoColor = await page.getByTestId("catalog-logo").evaluate((element) => {
    return getComputedStyle(element).color;
  });
  const darkPrimaryButtonBg = await page.getByTestId("topbar-preview-button").evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  expect(darkLogoColor).toBe(darkPrimaryButtonBg);

  await openThemeMenu();
  await page.getByTestId("theme-toggle-light").click({ force: true });
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.classList.contains("dark"));
  }).toBe(false);

  const catalogLogo = page.getByTestId("catalog-logo");
  await expect(catalogLogo).toBeVisible();
  await expect(catalogLogo).toHaveText("dfactory");
  const headerHeights = await page.evaluate(() => {
    const sidebarHeader = document.querySelector("[data-slot='sidebar-header']");
    const topbar = document.querySelector("header");
    if (!sidebarHeader || !topbar) {
      return null;
    }
    return {
      sidebarHeight: sidebarHeader.getBoundingClientRect().height,
      topbarHeight: topbar.getBoundingClientRect().height,
    };
  });
  expect(headerHeights).toBeTruthy();
  expect(
    Math.abs((headerHeights?.sidebarHeight ?? 0) - (headerHeights?.topbarHeight ?? 0)),
  ).toBeLessThanOrEqual(1);
  const catalogColorTokens = await page.evaluate(() => {
    const legacySidebarProbe = document.createElement("div");
    legacySidebarProbe.style.backgroundColor = "var(--sidebar-primary)";
    const primaryProbe = document.createElement("div");
    primaryProbe.style.color = "var(--primary)";
    document.body.appendChild(legacySidebarProbe);
    document.body.appendChild(primaryProbe);
    const legacySidebarStyles = getComputedStyle(legacySidebarProbe);
    const primaryStyles = getComputedStyle(primaryProbe);
    const colors = {
      primaryForeground: primaryStyles.color,
      legacySidebarPrimaryBackground: legacySidebarStyles.backgroundColor,
    };
    legacySidebarProbe.remove();
    primaryProbe.remove();
    return colors;
  });
  const logoColor = await catalogLogo.evaluate((element) => {
    return getComputedStyle(element).color;
  });
  expect(logoColor).toBe(catalogColorTokens.primaryForeground);
  const logoFontSize = await catalogLogo.evaluate((element) => {
    return getComputedStyle(element).fontSize;
  });
  expect(Number.parseFloat(logoFontSize)).toBeGreaterThanOrEqual(17);
  const sidebarHeader = page.locator("[data-slot='sidebar-header']");
  const sidebarHeaderBox = await sidebarHeader.boundingBox();
  const searchInputBox = await templateSearchInput.boundingBox();
  expect(sidebarHeaderBox).not.toBeNull();
  expect(searchInputBox).not.toBeNull();
  expect((searchInputBox?.y ?? 0) >= (sidebarHeaderBox?.y ?? 0) + (sidebarHeaderBox?.height ?? 0) - 1)
    .toBe(true);

  await templateSearchInput.fill("invoice-reference");
  await expect(page.locator("[data-template-id='invoice-reference']")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toHaveCount(0);

  await templateSearchInput.fill("advanced");
  await expect(page.getByText("No templates found for this search.")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toHaveCount(0);
  await expect(page.locator("[data-template-id='invoice-reference']")).toHaveCount(0);

  await templateSearchInput.fill("invoice");
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  await page.locator("[data-template-id='invoice']").click();
  await expect(invoiceItem).toHaveAttribute("data-active", "true");
  const invoiceItemBackground = await invoiceItem.evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  expect(invoiceItemBackground).not.toBe(catalogColorTokens.legacySidebarPrimaryBackground);
  expect(invoiceItemBackground).not.toBe("rgba(0, 0, 0, 0)");
  const selectedTemplateIdColor = await invoiceItem
    .getByTestId("template-item-id")
    .evaluate((element) => {
      return getComputedStyle(element).color;
    });
  expect(selectedTemplateIdColor).toBe(catalogColorTokens.primaryForeground);
  const selectedTemplateIdWeight = await invoiceItem
    .getByTestId("template-item-id")
    .evaluate((element) => {
      return getComputedStyle(element).fontWeight;
    });
  expect(selectedTemplateIdWeight).toBe("400");
  const invoiceReferenceItem = page.locator("[data-template-id='invoice-reference']");
  await expect(invoiceReferenceItem).toBeVisible();
  await expect(invoiceReferenceItem).toHaveAttribute("data-active", "false");
  const invoiceReferenceBackground = await invoiceReferenceItem.evaluate((element) => {
    return getComputedStyle(element).backgroundColor;
  });
  expect(invoiceReferenceBackground).not.toBe(catalogColorTokens.legacySidebarPrimaryBackground);
  const unselectedTemplateIdColor = await invoiceReferenceItem
    .getByTestId("template-item-id")
    .evaluate((element) => {
      return getComputedStyle(element).color;
    });
  expect(unselectedTemplateIdColor).not.toBe(catalogColorTokens.primaryForeground);
  const unselectedTemplateIdWeight = await invoiceReferenceItem
    .getByTestId("template-item-id")
    .evaluate((element) => {
      return getComputedStyle(element).fontWeight;
    });
  expect(unselectedTemplateIdWeight).toBe("400");
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
  await openThemeMenu();
  await page.getByTestId("theme-toggle-dark").click({ force: true });
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.classList.contains("dark"));
  }).toBe(true);
  const darkEditorSurfaces = await page.getByTestId("payload-editor").evaluate((element) => {
    const cmEditor = element.querySelector(".cm-editor");
    const cmGutters = element.querySelector(".cm-gutters");
    const cmActiveLine = element.querySelector(".cm-activeLine");
    const result = {
      wrapperBackground: getComputedStyle(element).backgroundColor,
      editorBackground: cmEditor ? getComputedStyle(cmEditor).backgroundColor : "",
      guttersBackground: cmGutters ? getComputedStyle(cmGutters).backgroundColor : "",
      activeLineBackground: cmActiveLine ? getComputedStyle(cmActiveLine).backgroundColor : "",
    };
    return result;
  });
  expect(darkEditorSurfaces.wrapperBackground).not.toBe("rgba(0, 0, 0, 0)");
  expect(darkEditorSurfaces.editorBackground).toBe("rgba(0, 0, 0, 0)");
  expect(darkEditorSurfaces.guttersBackground).toBe("rgba(0, 0, 0, 0)");
  expect(darkEditorSurfaces.activeLineBackground).not.toBe("rgba(0, 0, 0, 0)");
  await openThemeMenu();
  await page.getByTestId("theme-toggle-light").click({ force: true });
  await expect.poll(async () => {
    return page.evaluate(() => document.documentElement.classList.contains("dark"));
  }).toBe(false);

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
    diagnostics: {
      features: Array<{
        level?: "info" | "warn" | "error";
      }>;
    };
    resolvedFeatures: {
      toc?: {
        enabled?: boolean;
      };
    };
  };
  expect(preflightBody.ok).toBe(true);
  expect(preflightBody.resolvedFeatures.toc?.enabled).toBe(true);
  expect(
    preflightBody.diagnostics.features.filter((diagnostic) => diagnostic.level === "warn"),
  ).toHaveLength(0);
  expect(
    preflightBody.diagnostics.features.filter((diagnostic) => diagnostic.level === "error"),
  ).toHaveLength(0);

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
  const htmlPreviewFontFamily = await page.getByTestId("preview-frame").evaluate((element) => {
    const iframe = element as HTMLIFrameElement;
    const documentRef = iframe.contentDocument;
    if (!documentRef?.body) {
      return "";
    }
    return documentRef.defaultView?.getComputedStyle(documentRef.body).fontFamily ?? "";
  });
  expect(htmlPreviewFontFamily.toLowerCase()).toContain("inter");
  await expect(
    page.getByText(/Preflight reported \d+ feature warning\(s\)/i),
  ).toHaveCount(0);

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
  await expect(
    page.getByText(/Preflight reported \d+ feature warning\(s\)/i),
  ).toHaveCount(0);

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

  const [referencePreviewResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/preview") && response.request().method() === "POST";
    }),
    page.getByTestId("topbar-preview-button").click()
  ]);

  expect(referencePreviewResponse.ok()).toBeTruthy();

  const [referenceGenerateResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/generate") && response.request().method() === "POST";
    }),
    page.getByTestId("topbar-generate-button").click()
  ]);

  expect(referenceGenerateResponse.ok()).toBeTruthy();
  await expect(page.getByTestId("error-banner")).toHaveCount(0);

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
  await expect(
    page.getByTestId("bottom-panel").getByTestId("bottom-panel-collapse"),
  ).toBeVisible();
  await expect(
    page.getByTestId("bottom-dock").getByTestId("bottom-panel-collapse"),
  ).toHaveCount(0);
  await page.getByTestId("bottom-panel").getByTestId("bottom-panel-collapse").click();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);
  await expect(
    page.getByTestId("bottom-dock").getByTestId("bottom-panel-collapse"),
  ).toBeVisible();
  await page.getByTestId("bottom-dock").getByTestId("bottom-panel-collapse").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(
    page.getByTestId("bottom-panel").getByTestId("bottom-panel-collapse"),
  ).toBeVisible();
  await expect(
    page.getByTestId("bottom-dock").getByTestId("bottom-panel-collapse"),
  ).toHaveCount(0);

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
  await expect(sourceResizeHandle).toHaveCount(1);
  const sourceNavBefore = await page.getByTestId("source-explorer-nav").boundingBox();
  const sourceViewerBefore = await page.getByTestId("source-viewer").boundingBox();
  const sourceExplorerBounds = await page.getByTestId("source-explorer").boundingBox();
  expect(sourceNavBefore).toBeTruthy();
  expect(sourceViewerBefore).toBeTruthy();
  expect(sourceExplorerBounds).toBeTruthy();
  const sourceNavDividerStyle = await page.getByTestId("source-explorer-nav").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      borderRightStyle: style.borderRightStyle,
      borderRightWidth: style.borderRightWidth,
      borderRightColor: style.borderRightColor,
    };
  });
  expect(sourceNavDividerStyle.borderRightStyle).not.toBe("none");
  expect(parseFloat(sourceNavDividerStyle.borderRightWidth)).toBeGreaterThan(0);
  expect(sourceNavDividerStyle.borderRightColor).not.toBe("rgba(0, 0, 0, 0)");
  expect(sourceNavDividerStyle.borderRightColor).not.toBe("transparent");
  const sourcePaneGapBefore =
    (sourceViewerBefore?.x ?? 0) - ((sourceNavBefore?.x ?? 0) + (sourceNavBefore?.width ?? 0));
  expect(Math.abs(sourcePaneGapBefore)).toBeLessThanOrEqual(2);
  const initialSourceNavRatio =
    (sourceNavBefore?.width ?? 0) / (sourceExplorerBounds?.width ?? 1);
  expect(initialSourceNavRatio).toBeGreaterThan(0.17);
  expect(initialSourceNavRatio).toBeLessThanOrEqual(0.42);
  const sourceHandleCenterX = (sourceNavBefore?.x ?? 0) + (sourceNavBefore?.width ?? 0);
  const sourceHandleCenterY = (sourceNavBefore?.y ?? 0) + (sourceNavBefore?.height ?? 0) / 2;
  await page.mouse.move(sourceHandleCenterX, sourceHandleCenterY);
  await page.mouse.down();
  await page.mouse.move(sourceHandleCenterX + 180, sourceHandleCenterY, { steps: 16 });
  await page.mouse.up();
  const sourceNavAfter = await page.getByTestId("source-explorer-nav").boundingBox();
  const sourceViewerAfter = await page.getByTestId("source-viewer").boundingBox();
  expect(sourceNavAfter).toBeTruthy();
  expect(sourceViewerAfter).toBeTruthy();
  const sourcePaneGapAfter =
    (sourceViewerAfter?.x ?? 0) - ((sourceNavAfter?.x ?? 0) + (sourceNavAfter?.width ?? 0));
  expect(Math.abs(sourcePaneGapAfter)).toBeLessThanOrEqual(2);
  const sourceResizeDelta = Math.abs((sourceNavAfter?.width ?? 0) - (sourceNavBefore?.width ?? 0));
  expect(sourceResizeDelta).toBeGreaterThan(6);
  expect((sourceNavAfter?.width ?? 0)).toBeLessThanOrEqual((sourceExplorerBounds?.width ?? 0) * 0.42);
  const sourceHandleAfterCenterX =
    (sourceNavAfter?.x ?? 0) + (sourceNavAfter?.width ?? 0);
  const sourceHandleAfterCenterY =
    (sourceNavAfter?.y ?? 0) + (sourceNavAfter?.height ?? 0) / 2;
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
