import { getBounds } from "../render/geometry";
import { buildSearchEntry } from "../render/nodes";
import type { SearchEntry } from "../render/types";
import type { ContentsCanvasDocument } from "./contents";

export function buildDescendantSearchEntries(
  documents: ContentsCanvasDocument[],
  rootSourcePath: string,
  currentSourcePath: string,
  exportFormat: "package" | "single-html",
): SearchEntry[] {
  const documentsByPath = new Map(documents.map((document) => [document.sourcePath, document]));
  const treeChildren = new Map<string, string[]>();
  const treeVisited = new Set<string>();
  const descendants: ContentsCanvasDocument[] = [];

  function buildTree(sourcePath: string): void {
    if (treeVisited.has(sourcePath)) return;
    const document = documentsByPath.get(sourcePath);
    if (!document) return;
    treeVisited.add(sourcePath);
    const children: string[] = [];

    const childNodes = document.data.nodes
      .filter((node) => node.fileKind === "canvas" && node.canvasSourcePath);
    for (const node of childNodes) {
      const childPath = node.fileKind === "canvas" ? node.canvasSourcePath : undefined;
      if (!childPath || treeVisited.has(childPath) || !documentsByPath.has(childPath)) continue;
      children.push(childPath);
      buildTree(childPath);
    }
    treeChildren.set(sourcePath, children);
  }

  buildTree(rootSourcePath);
  for (const document of documents) buildTree(document.sourcePath);

  function collectDescendants(sourcePath: string): void {
    for (const childPath of treeChildren.get(sourcePath) || []) {
      const child = documentsByPath.get(childPath);
      if (!child) continue;
      descendants.push(child);
      collectDescendants(childPath);
    }
  }

  collectDescendants(currentSourcePath);
  const openTarget = exportFormat === "single-html" && currentSourcePath !== rootSourcePath
    ? "_parent" as const
    : undefined;

  return descendants.flatMap((document) => {
    const bounds = getBounds(document.data.nodes);
    return document.data.nodes
      .map((node) => buildSearchEntry(node, bounds.offsetX, bounds.offsetY))
      .filter((entry) => entry.text)
      .map((entry) => ({
        ...entry,
        id: `${document.sourcePath}:${entry.id}`,
        openNodeId: entry.focusNodeId,
        focusNodeId: undefined,
        positionLabel: document.title,
        openHref: document.href,
        openTarget,
        text: `${entry.text} ${document.title}`.trim(),
      }));
  });
}
