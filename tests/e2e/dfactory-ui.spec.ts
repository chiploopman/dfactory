import { expect, test } from "@playwright/test";

test("dev mode: catalog, payload edit, html/pdf preview, generate, dock panel behavior", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByTestId("dfactory-app")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  await page.locator("[data-template-id='invoice']").click();
  await expect(page.getByRole("button", { name: "Preview" })).toBeEnabled();

  await page.getByTestId("payload-editor").fill(
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

  const [htmlPreviewResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/preview") && response.request().method() === "POST";
    }),
    page.getByRole("button", { name: "Preview" }).click()
  ]);

  const htmlPreviewBody = (await htmlPreviewResponse.json()) as { mode: string };
  const htmlPreviewRequest = htmlPreviewResponse.request().postDataJSON() as {
    payload: { invoiceNumber: string };
  };

  expect(htmlPreviewResponse.ok()).toBeTruthy();
  expect(htmlPreviewBody.mode).toBe("html");
  expect(htmlPreviewRequest.payload.invoiceNumber).toBe("INV-2026");
  await expect(page.getByTestId("preview-frame")).toBeVisible();

  await page.getByRole("button", { name: "PDF" }).click();
  const [pdfPreviewResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/preview") && response.request().method() === "POST";
    }),
    page.getByRole("button", { name: "Preview" }).click()
  ]);

  expect(pdfPreviewResponse.ok()).toBeTruthy();
  expect(pdfPreviewResponse.headers()["content-type"]).toContain("application/pdf");
  await expect(page.getByTestId("preview-pdf-frame")).toBeVisible();

  const [generateResponse] = await Promise.all([
    page.waitForResponse((response) => {
      return response.url().includes("/api/document/generate") && response.request().method() === "POST";
    }),
    page.getByRole("button", { name: "Generate" }).click()
  ]);

  expect(generateResponse.ok()).toBeTruthy();
  expect(generateResponse.headers()["content-type"]).toContain("application/pdf");

  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("invoiceNumber");

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toHaveCount(0);

  await page.getByTestId("dock-tab-source").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("source-view")).toContainText("export const meta");

  await page.getByTestId("dock-tab-playground").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("playground-curl")).toContainText("/document/preview");
});

test("prod mode: source and playground tabs are hidden by default", async ({ page }) => {
  await page.goto("http://127.0.0.1:3220");

  await expect(page.getByTestId("dfactory-app")).toBeVisible();
  await expect(page.locator("[data-template-id='invoice']")).toBeVisible();
  await expect(page.getByTestId("bottom-dock")).toBeVisible();
  await expect(page.getByTestId("dock-tab-schema")).toBeVisible();
  await expect(page.getByTestId("dock-tab-source")).toHaveCount(0);
  await expect(page.getByTestId("dock-tab-playground")).toHaveCount(0);

  await page.getByTestId("dock-tab-schema").click();
  await expect(page.getByTestId("bottom-panel")).toBeVisible();
  await expect(page.getByTestId("schema-view")).toContainText("invoiceNumber");
});
