import type { CanvasData, ContentsNavigation, ContentsNavigationItem } from "../render/types";
import { getHrefForMarkdownPage } from "../helpers/path-helpers";

export type ContentsCanvasDocument = {
  sourcePath: string;
  title: string;
  href: string;
  data: CanvasData;
};

export function buildContentsNavigation(
  documents: ContentsCanvasDocument[],
  rootSourcePath: string,
  currentSourcePath: string,
  exportFormat: "package" | "single-html",
  currentPageHref?: string,
): ContentsNavigation {
  const documentsByPath = new Map(documents.map((document) => [document.sourcePath, document]));
  const visited = new Set<string>();
  const target = exportFormat === "single-html" && currentSourcePath !== rootSourcePath
    ? "_parent" as const
    : undefined;

  function visitCanvas(sourcePath: string, linkTitle?: string): ContentsNavigationItem | null {
    if (visited.has(sourcePath)) return null;
    const document = documentsByPath.get(sourcePath);
    if (!document) return null;
    visited.add(sourcePath);

    const children = document.data.nodes
      .filter((node) => node.fileKind === "canvas" && node.canvasSourcePath)
      .map((node) => visitCanvas(
        node.canvasSourcePath || "",
        (node.label || node.displayName || node.file || "").trim() || undefined,
      ))
      .filter((item): item is ContentsNavigationItem => item !== null);

    return {
      title: linkTitle || document.title,
      href: document.href,
      kind: "canvas",
      current: !currentPageHref && sourcePath === currentSourcePath,
      target,
      children: children.length ? children : undefined,
    };
  }

  const currentDocument = documentsByPath.get(currentSourcePath);
  const pageHrefs = new Set<string>();
  const pages = (currentDocument?.data.nodes || [])
    .map((node): ContentsNavigationItem | null => {
      const nodeType = (node.type || "").toLowerCase();
      const kind = nodeType === "link"
        ? "link" as const
        : node.fileKind === "markdown"
          ? "markdown" as const
          : node.fileKind === "pdf"
            ? "pdf" as const
            : null;
      const href = node.canvasHref || "";
      if (!kind || !href || pageHrefs.has(href)) return null;
      pageHrefs.add(href);
      return {
        title: (node.label || node.displayName || node.file || node.url || kind).trim(),
        href,
        kind,
        current: href === currentPageHref,
      };
    })
    .filter((item): item is ContentsNavigationItem => item !== null);

  const root = visitCanvas(rootSourcePath);
  const additionalCanvases = documents
    .map((document) => visitCanvas(document.sourcePath))
    .filter((item): item is ContentsNavigationItem => item !== null);
  return {
    canvases: [...(root ? [root] : []), ...additionalCanvases],
    pages,
  };
}

export function rebaseContentsNavigation(
  navigation: ContentsNavigation,
  currentHtmlPath: string,
): ContentsNavigation {
  function rebaseItems(items: ContentsNavigationItem[]): ContentsNavigationItem[] {
    return items.map((item) => ({
      ...item,
      href: getHrefForMarkdownPage(currentHtmlPath, item.href),
      children: item.children ? rebaseItems(item.children) : undefined,
    }));
  }

  return {
    canvases: rebaseItems(navigation.canvases),
    pages: rebaseItems(navigation.pages),
  };
}
