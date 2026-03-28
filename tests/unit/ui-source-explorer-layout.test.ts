import { describe, expect, it } from "vitest"

import {
  SOURCE_EXPLORER_NAV_DEFAULT_PERCENT,
  SOURCE_EXPLORER_NAV_MAX_PERCENT,
  SOURCE_EXPLORER_NAV_MIN_PERCENT,
  clampSourceExplorerNavSize,
  getSourceExplorerNavSizeFromLayout,
  toPercentString,
} from "../../packages/ui/src/lib/source-explorer-layout.ts"

describe("source explorer layout helpers", () => {
  it("clamps source nav size into allowed percentage range", () => {
    expect(clampSourceExplorerNavSize(10)).toBe(SOURCE_EXPLORER_NAV_MIN_PERCENT)
    expect(clampSourceExplorerNavSize(28)).toBe(28)
    expect(clampSourceExplorerNavSize(80)).toBe(SOURCE_EXPLORER_NAV_MAX_PERCENT)
  })

  it("uses default size when nav size is not finite", () => {
    expect(clampSourceExplorerNavSize(Number.NaN)).toBe(
      SOURCE_EXPLORER_NAV_DEFAULT_PERCENT,
    )
  })

  it("converts numeric values to percent strings", () => {
    expect(toPercentString(28)).toBe("28%")
    expect(toPercentString(72)).toBe("72%")
    expect(toPercentString(140)).toBe("100%")
  })

  it("reads nav size from layout map with safe fallback", () => {
    expect(
      getSourceExplorerNavSizeFromLayout(
        { "source-explorer-nav-panel": 34 },
        "source-explorer-nav-panel",
        28,
      ),
    ).toBe(34)
    expect(
      getSourceExplorerNavSizeFromLayout(
        {},
        "source-explorer-nav-panel",
        28,
      ),
    ).toBe(28)
  })
})
