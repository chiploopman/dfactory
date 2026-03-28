function normalizePath(path: string): string {
  return path.replaceAll("\\", "/")
}

export function getFileName(path: string): string {
  const normalized = normalizePath(path)
  const segments = normalized.split("/").filter((segment) => segment.length > 0)
  return segments.at(-1) ?? normalized
}

export function getFileExtension(path: string): string | undefined {
  const fileName = getFileName(path)
  const lastDotIndex = fileName.lastIndexOf(".")

  if (lastDotIndex <= 0 || lastDotIndex === fileName.length - 1) {
    return undefined
  }

  return fileName.slice(lastDotIndex + 1).toLowerCase()
}

export function getFileExtensionBadge(path: string): string {
  const extension = getFileExtension(path)
  return extension ? extension.toUpperCase() : "FILE"
}
