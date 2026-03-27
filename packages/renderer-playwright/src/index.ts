import { chromium, type Browser } from "playwright";

export interface PdfRenderOptions {
  timeoutMs?: number;
  pdf?: Record<string, unknown>;
}

export interface PdfRenderer {
  htmlToPdf: (html: string, options?: PdfRenderOptions) => Promise<Buffer>;
  close: () => Promise<void>;
}

class Semaphore {
  private available: number;
  private readonly waiters: Array<() => void> = [];

  constructor(size: number) {
    this.available = Math.max(1, size);
  }

  async acquire(): Promise<() => void> {
    if (this.available > 0) {
      this.available -= 1;
      return () => this.release();
    }

    await new Promise<void>((resolve) => {
      this.waiters.push(resolve);
    });

    this.available -= 1;
    return () => this.release();
  }

  private release(): void {
    this.available += 1;
    const next = this.waiters.shift();
    if (next) {
      next();
    }
  }
}

export class PlaywrightPdfRenderer implements PdfRenderer {
  private browserPromise: Promise<Browser> | undefined;
  private readonly semaphore: Semaphore;
  private readonly defaultTimeoutMs: number;

  constructor(options?: { poolSize?: number; timeoutMs?: number }) {
    this.semaphore = new Semaphore(options?.poolSize ?? 4);
    this.defaultTimeoutMs = options?.timeoutMs ?? 30000;
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browserPromise) {
      this.browserPromise = chromium.launch({
        headless: true,
        args: ["--font-render-hinting=none"]
      });
    }

    return this.browserPromise;
  }

  async htmlToPdf(html: string, options?: PdfRenderOptions): Promise<Buffer> {
    const release = await this.semaphore.acquire();
    try {
      const browser = await this.getBrowser();
      const context = await browser.newContext();
      const page = await context.newPage();

      page.setDefaultNavigationTimeout(options?.timeoutMs ?? this.defaultTimeoutMs);
      await page.setContent(html, { waitUntil: "networkidle" });

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        ...(options?.pdf ?? {})
      } as Parameters<typeof page.pdf>[0]);

      await context.close();
      return Buffer.from(pdf);
    } finally {
      release();
    }
  }

  async close(): Promise<void> {
    if (!this.browserPromise) {
      return;
    }

    const browser = await this.browserPromise;
    await browser.close();
    this.browserPromise = undefined;
  }
}

export function createPlaywrightPdfRenderer(options?: {
  poolSize?: number;
  timeoutMs?: number;
}): PdfRenderer {
  return new PlaywrightPdfRenderer(options);
}
