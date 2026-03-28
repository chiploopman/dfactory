import { getFileName, normalizeFilePath } from "./explorer-file-meta"

export interface ExplorerFileLabel {
  label: string
  tooltip: string
}

export function getExplorerFileLabel(path: string): ExplorerFileLabel {
  return {
    label: getFileName(path),
    tooltip: normalizeFilePath(path),
  }
}
