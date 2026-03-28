import { describe, expect, it } from "vitest"

import {
  getInspectorEditorConfig,
  inferSourceLanguageFromPath,
} from "../../packages/ui/src/lib/editor-config.ts"

describe("editor config helpers", () => {
  it("infers javascript for supported template source extensions", () => {
    expect(inferSourceLanguageFromPath("/tmp/template.ts")).toBe("javascript")
    expect(inferSourceLanguageFromPath("/tmp/template.tsx")).toBe("javascript")
    expect(inferSourceLanguageFromPath("/tmp/template.js")).toBe("javascript")
    expect(inferSourceLanguageFromPath("/tmp/template.jsx")).toBe("javascript")
    expect(inferSourceLanguageFromPath("/tmp/template.mts")).toBe("javascript")
    expect(inferSourceLanguageFromPath("/tmp/template.mtsx")).toBe("javascript")
  })

  it("falls back to plaintext for unknown or missing source path", () => {
    expect(inferSourceLanguageFromPath("/tmp/template.vue")).toBe("html")
    expect(inferSourceLanguageFromPath("/tmp/template.html")).toBe("html")
    expect(inferSourceLanguageFromPath("/tmp/template.css")).toBe("css")
    expect(inferSourceLanguageFromPath("/tmp/template.scss")).toBe("css")
    expect(inferSourceLanguageFromPath("/tmp/template.md")).toBe("markdown")
    expect(inferSourceLanguageFromPath("/tmp/template.json")).toBe("json")
    expect(inferSourceLanguageFromPath("template")).toBe("plaintext")
    expect(inferSourceLanguageFromPath()).toBe("plaintext")
  })

  it("returns editable payload config with json language", () => {
    expect(getInspectorEditorConfig({ panel: "payload" })).toEqual({
      readOnly: false,
      lineNumbers: true,
      lineWrapping: true,
      language: "json",
    })
  })

  it("returns read-only schema/source config with deterministic language selection", () => {
    expect(getInspectorEditorConfig({ panel: "schema" })).toEqual({
      readOnly: true,
      lineNumbers: true,
      lineWrapping: true,
      language: "json",
    })

    expect(
      getInspectorEditorConfig({
        panel: "source",
        sourceFilePath: "/templates/invoice/template.tsx",
      }),
    ).toEqual({
      readOnly: true,
      lineNumbers: true,
      lineWrapping: true,
      language: "javascript",
    })

    expect(getInspectorEditorConfig({ panel: "source" })).toEqual({
      readOnly: true,
      lineNumbers: true,
      lineWrapping: true,
      language: "plaintext",
    })
  })
})
