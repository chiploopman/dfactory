export interface SourceTabLabel {
  path: string
  label: string
}

function splitPathSegments(filePath: string): string[] {
  return filePath
    .replaceAll("\\", "/")
    .split("/")
    .filter((segment) => segment.length > 0)
}

function joinLabel(segments: string[], depth: number): string {
  const start = Math.max(0, segments.length - depth)
  return segments.slice(start).join("/")
}

export function buildSourceTabLabels(paths: string[]): SourceTabLabel[] {
  const segmentsByIndex = paths.map((filePath) => splitPathSegments(filePath))
  const depths = segmentsByIndex.map(() => 1)

  while (true) {
    const labelToIndices = new Map<string, number[]>()

    for (const [index, segments] of segmentsByIndex.entries()) {
      const label = joinLabel(segments, depths[index] ?? 1)
      const indices = labelToIndices.get(label)
      if (indices) {
        indices.push(index)
      } else {
        labelToIndices.set(label, [index])
      }
    }

    let changed = false
    for (const [, indices] of labelToIndices) {
      if (indices.length < 2) {
        continue
      }

      for (const index of indices) {
        const segmentLength = segmentsByIndex[index]?.length ?? 0
        if ((depths[index] ?? 1) < segmentLength) {
          depths[index] = (depths[index] ?? 1) + 1
          changed = true
        }
      }
    }

    if (!changed) {
      break
    }
  }

  return paths.map((path, index) => ({
    path,
    label: joinLabel(segmentsByIndex[index] ?? [path], depths[index] ?? 1),
  }))
}
