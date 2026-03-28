export const SOURCE_EXPLORER_NAV_MIN_PERCENT = 18
export const SOURCE_EXPLORER_NAV_MAX_PERCENT = 40
export const SOURCE_EXPLORER_NAV_DEFAULT_PERCENT = 28

export function clampSourceExplorerNavSize(value: number): number {
  if (!Number.isFinite(value)) {
    return SOURCE_EXPLORER_NAV_DEFAULT_PERCENT
  }

  return Math.min(
    SOURCE_EXPLORER_NAV_MAX_PERCENT,
    Math.max(SOURCE_EXPLORER_NAV_MIN_PERCENT, value),
  )
}

export function toPercentString(value: number): string {
  const safeValue = Number.isFinite(value) ? value : 0
  const normalizedValue = Math.min(100, Math.max(0, safeValue))
  return `${normalizedValue}%`
}

export function getSourceExplorerNavSizeFromLayout(
  layout: Record<string, number>,
  navPanelId: string,
  fallback: number = SOURCE_EXPLORER_NAV_DEFAULT_PERCENT,
): number {
  const nextValue = layout[navPanelId]

  if (typeof nextValue !== "number") {
    return clampSourceExplorerNavSize(fallback)
  }

  return clampSourceExplorerNavSize(nextValue)
}
