// Stable public entry point for plugin, exporter and existing consumers.
export { convertCanvasToHtml } from "./canvas-document";
export { buildBlockAnchorId, markdownToHtml } from "./markdown";
export { buildMarkdownDocumentHtml } from "./markdown-document";
export { EXPORTER_SIGNATURE, EXPORTER_VERSION } from "./metadata";
export { buildCanvasColorVariables } from "./theme";
export type { CanvasData, CanvasEdge, CanvasNode, CanvasNodeBorderStyle, CanvasNodeShape, CanvasNodeTextAlign, ContentsNavigation, ContentsNavigationItem, EmbeddedPage, ExportOptions, HighlightingThemeChoice } from "./types";
