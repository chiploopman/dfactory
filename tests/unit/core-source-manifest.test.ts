import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  collectTemplateSourceFiles,
  DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES
} from "../../packages/core/src/source-manifest.ts";

describe("core source manifest", () => {
  it("collects recursive files with entry first and binary skip metadata", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-source-manifest-"));
    const entryFilePath = path.join(rootDir, "template.tsx");

    await fs.mkdir(path.join(rootDir, "nested"), { recursive: true });
    await fs.writeFile(entryFilePath, `export const id = "invoice";\n`);
    await fs.writeFile(path.join(rootDir, "nested", "details.ts"), `export const details = true;\n`);
    await fs.writeFile(path.join(rootDir, "nested", "logo.bin"), Buffer.from([0, 159, 146, 150, 0, 1, 2, 3]));

    const manifest = await collectTemplateSourceFiles({
      rootDir,
      entryFilePath
    });

    expect(manifest.entryFile).toBe("template.tsx");
    expect(manifest.files[0]?.path).toBe("template.tsx");
    expect(manifest.files[0]?.entry).toBe(true);
    expect(manifest.files[0]?.status).toBe("ready");
    expect(manifest.files.find((file) => file.path === "nested/details.ts")?.status).toBe("ready");
    expect(manifest.files.find((file) => file.path === "nested/logo.bin")?.status).toBe("skipped");
    expect(manifest.files.find((file) => file.path === "nested/logo.bin")?.skipReason).toBe("binary");
  });

  it("skips oversized files using tooLarge reason", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-source-too-large-"));
    const entryFilePath = path.join(rootDir, "template.ts");
    const oversizedFilePath = path.join(rootDir, "oversized.md");

    await fs.writeFile(entryFilePath, `export const ok = true;\n`);
    await fs.writeFile(
      oversizedFilePath,
      "a".repeat(DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES + 1)
    );

    const manifest = await collectTemplateSourceFiles({
      rootDir,
      entryFilePath,
      maxFileBytes: DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES
    });

    expect(manifest.files.find((file) => file.path === "oversized.md")?.status).toBe("skipped");
    expect(manifest.files.find((file) => file.path === "oversized.md")?.skipReason).toBe("tooLarge");
  });

  it("marks missing entry file as unreadable", async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "dfactory-source-unreadable-"));

    await fs.writeFile(path.join(rootDir, "other.ts"), `export const ok = true;\n`);

    const manifest = await collectTemplateSourceFiles({
      rootDir,
      entryFilePath: path.join(rootDir, "template.ts")
    });

    expect(manifest.entryFile).toBe("template.ts");
    expect(manifest.files[0]?.path).toBe("template.ts");
    expect(manifest.files[0]?.status).toBe("skipped");
    expect(manifest.files[0]?.skipReason).toBe("unreadable");
  });
});
