export type ExplorerTreeNode = ExplorerTreeFolderNode | ExplorerTreeFileNode

export interface ExplorerTreeFolderNode {
  type: "folder"
  name: string
  path: string
  children: ExplorerTreeNode[]
}

export interface ExplorerTreeFileNode {
  type: "file"
  name: string
  path: string
}

interface MutableFolderNode {
  type: "folder"
  name: string
  path: string
  children: ExplorerTreeNode[]
  folderChildren: Map<string, MutableFolderNode>
  fileChildren: Set<string>
}

function createFolderNode(name: string, path: string): MutableFolderNode {
  return {
    type: "folder",
    name,
    path,
    children: [],
    folderChildren: new Map<string, MutableFolderNode>(),
    fileChildren: new Set<string>(),
  }
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\/+/, "").replace(/\/+$/, "")
}

export function buildExplorerTree(paths: string[]): ExplorerTreeNode[] {
  const root = createFolderNode("", "")

  for (const rawPath of paths) {
    const normalizedPath = normalizePath(rawPath)
    if (!normalizedPath) {
      continue
    }

    const segments = normalizedPath.split("/").filter((segment) => segment.length > 0)
    if (segments.length === 0) {
      continue
    }

    let cursor = root
    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index]!
      const isLeaf = index === segments.length - 1
      const nextPath = cursor.path ? `${cursor.path}/${segment}` : segment

      if (isLeaf) {
        if (!cursor.fileChildren.has(nextPath)) {
          cursor.children.push({
            type: "file",
            name: segment,
            path: nextPath,
          })
          cursor.fileChildren.add(nextPath)
        }
        continue
      }

      const existingFolder = cursor.folderChildren.get(segment)
      if (existingFolder) {
        cursor = existingFolder
        continue
      }

      const folderNode = createFolderNode(segment, nextPath)
      cursor.folderChildren.set(segment, folderNode)
      cursor.children.push(folderNode)
      cursor = folderNode
    }
  }

  return root.children.map((node) => toPublicTreeNode(node))
}

export function isAncestorPath(ancestorPath: string, targetPath: string): boolean {
  const normalizedAncestor = normalizePath(ancestorPath)
  const normalizedTarget = normalizePath(targetPath)

  if (!normalizedAncestor || !normalizedTarget) {
    return false
  }

  return (
    normalizedTarget === normalizedAncestor ||
    normalizedTarget.startsWith(`${normalizedAncestor}/`)
  )
}

function toPublicTreeNode(node: ExplorerTreeNode | MutableFolderNode): ExplorerTreeNode {
  if (node.type === "file") {
    return {
      type: "file",
      name: node.name,
      path: node.path,
    }
  }

  return {
    type: "folder",
    name: node.name,
    path: node.path,
    children: node.children.map((child) => toPublicTreeNode(child)),
  }
}
