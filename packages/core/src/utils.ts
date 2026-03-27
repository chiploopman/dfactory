import fs from "node:fs/promises";
import path from "node:path";

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function normalizeSlashes(value: string): string {
  return value.replace(/\\/g, "/");
}

export function inferTemplateId(filePath: string): string {
  const folder = path.basename(path.dirname(filePath));
  return folder;
}
