import {
  IconBrandReact,
  IconBrandTypescript,
  IconBrandVue,
} from "@tabler/icons-react"
import { FileCode2, Shapes } from "lucide-react"
import type { ComponentType } from "react"

import { getFileExtension } from "./explorer-file-meta"

type IconComponent = ComponentType<{ className?: string }>

export interface FrameworkIconMeta {
  kind: "react" | "vue" | "unknown"
  label: string
  Icon: IconComponent
}

export interface SourceFileIconMeta {
  kind: "typescript" | "react" | "vue" | "file"
  label: string
  Icon: IconComponent
}

function normalizeFramework(framework: string): string {
  return framework.trim().toLowerCase()
}

export function getFrameworkIconMeta(framework: string): FrameworkIconMeta {
  const normalized = normalizeFramework(framework)

  if (normalized.includes("react")) {
    return {
      kind: "react",
      label: "React",
      Icon: IconBrandReact,
    }
  }

  if (normalized.includes("vue")) {
    return {
      kind: "vue",
      label: "Vue",
      Icon: IconBrandVue,
    }
  }

  return {
    kind: "unknown",
    label: framework || "Framework",
    Icon: Shapes,
  }
}

export function getSourceFileIconMeta(path: string): SourceFileIconMeta {
  const extension = getFileExtension(path)

  switch (extension) {
    case "ts":
    case "mts":
    case "cts":
      return {
        kind: "typescript",
        label: "TypeScript",
        Icon: IconBrandTypescript,
      }
    case "tsx":
    case "mtsx":
    case "jsx":
      return {
        kind: "react",
        label: "React",
        Icon: IconBrandReact,
      }
    case "vue":
      return {
        kind: "vue",
        label: "Vue",
        Icon: IconBrandVue,
      }
    default:
      return {
        kind: "file",
        label: "File",
        Icon: FileCode2,
      }
  }
}
