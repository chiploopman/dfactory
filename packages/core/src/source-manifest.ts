import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

import fg from "fast-glob";

import type { TemplateSourceFile } from "./types";

export const DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES = 256 * 1024;
const require = createRequire(import.meta.url);
const { isText } = require("istextorbinary") as {
  isText: (filename: string, buffer?: Buffer) => boolean;
};

function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function normalizeRelativePath(rootDir: string, filePath: string): string {
  return toPosixPath(path.relative(rootDir, filePath));
}

function toSortedRelativePaths(paths: string[], entryFile: string): string[] {
  const uniquePaths = [...new Set([...paths.map((item) => toPosixPath(item)), entryFile])];
  uniquePaths.sort((a, b) => a.localeCompare(b));
  return [entryFile, ...uniquePaths.filter((item) => item !== entryFile)];
}

function createSkippedFile(options: {
  path: string;
  bytes: number;
  entry: boolean;
  skipReason: "binary" | "tooLarge" | "unreadable";
}): TemplateSourceFile {
  return {
    path: options.path,
    status: "skipped",
    skipReason: options.skipReason,
    bytes: options.bytes,
    entry: options.entry
  };
}

export async function collectTemplateSourceFiles(options: {
  rootDir: string;
  entryFilePath: string;
  maxFileBytes?: number;
}): Promise<{
  entryFile: string;
  files: TemplateSourceFile[];
}> {
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_TEMPLATE_SOURCE_MAX_FILE_BYTES;
  const entryFile = normalizeRelativePath(options.rootDir, options.entryFilePath);
  const discovered = await fg("**/*", {
    cwd: options.rootDir,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
    ignore: ["**/node_modules/**", "**/.git/**"]
  });
  const filePaths = toSortedRelativePaths(discovered, entryFile);

  const files = await Promise.all(
    filePaths.map(async (relativePath) => {
      const absolutePath = path.resolve(options.rootDir, relativePath);
      const entry = relativePath === entryFile;

      let fileBuffer: Buffer;
      try {
        fileBuffer = await fs.readFile(absolutePath);
      } catch {
        return createSkippedFile({
          path: relativePath,
          bytes: 0,
          entry,
          skipReason: "unreadable"
        });
      }

      const bytes = fileBuffer.byteLength;
      if (bytes > maxFileBytes) {
        return createSkippedFile({
          path: relativePath,
          bytes,
          entry,
          skipReason: "tooLarge"
        });
      }

      let isTextFile = false;
      try {
        isTextFile = isText(absolutePath, fileBuffer);
      } catch {
        isTextFile = false;
      }

      if (!isTextFile) {
        return createSkippedFile({
          path: relativePath,
          bytes,
          entry,
          skipReason: "binary"
        });
      }

      return {
        path: relativePath,
        status: "ready",
        content: fileBuffer.toString("utf8"),
        bytes,
        entry
      } satisfies TemplateSourceFile;
    })
  );

  return {
    entryFile,
    files
  };
}
