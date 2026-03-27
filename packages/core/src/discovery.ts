import path from "node:path";
import fg from "fast-glob";

import type { DFactoryConfig } from "./types";
import { normalizeSlashes } from "./utils";

export interface TemplateCandidate {
  filePath: string;
  directory: string;
}

export async function discoverTemplateCandidates(
  cwd: string,
  config: DFactoryConfig
): Promise<TemplateCandidate[]> {
  const entries = await fg(config.templates.globs, {
    cwd,
    absolute: true,
    ignore: config.templates.ignore,
    onlyFiles: true,
    unique: true
  });

  const candidates = entries
    .sort((a, b) => a.localeCompare(b))
    .map((filePath) => ({
      filePath: normalizeSlashes(path.resolve(filePath)),
      directory: normalizeSlashes(path.dirname(path.resolve(filePath)))
    }));

  return candidates;
}
