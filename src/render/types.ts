import type { CanvasFoldState } from "../folding/types";

export type CanvasNodeShape =
  | "pill"
  | "diamond"
  | "parallelogram"
  | "circle"
  | "predefined-process"
  | "document"
  | "database";

export type CanvasNodeBorderStyle = "dashed" | "dotted" | "invisible";

export type CanvasNodeTextAlign = "center" | "right";

export type CanvasEdgeEnd =
  | "none"
  | "arrow"
  | "triangle"
  | "triangle-outline"
  | "thin-triangle"
  | "halved-triangle"
  | "circle"
  | "circle-outline"
  | "diamond"
  | "diamond-outline"
  | "square"
  | "bar"
  | "blunt";

export interface CanvasNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  label?: string;
  file?: string;
  url?: string;
  color?: string;
  exportPath?: string;
  exportHtmlPath?: string;
  canvasHref?: string;
  canvasNavigationTarget?: "_parent";
  displayName?: string;
  fileKind?: "image" | "markdown" | "canvas" | "pdf" | "audio" | "video" | "file";
  previewText?: string;
  previewHtml?: string;
  renderedTextHtml?: string;
  shape?: CanvasNodeShape;
  borderStyle?: CanvasNodeBorderStyle;
  textAlign?: CanvasNodeTextAlign;
  advancedGroupCollapsed?: boolean;
}

export interface CanvasEdge {
  id?: string;
  fromNode: string;
  fromSide?: string;
  fromEnd?: string;
  toNode: string;
  toSide?: string;
  toEnd?: string;
  label?: string;
  color?: string;
  lineStyle?: string;
  width?: number;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  name?: string;
}

export interface ExportOptions {
  darkMode: boolean;
  title: string;
  canvasColors?: Record<string, string>;
  calloutColors?: Record<string, string>;
  headingColors?: Record<string, string>;
  inlineStyleColors?: Record<string, string>;
  highlightingTheme?: HighlightingThemeChoice;
  showMinimap?: boolean;
  showSearch?: boolean;
  foldingInitiallyEnabled?: boolean;
  exportFormat?: "package" | "single-html";
  canvasHomeHref?: string;
  embeddedPages?: EmbeddedPage[];
  initialFoldState?: CanvasFoldState;
}

export interface EmbeddedPage {
  id: string;
  title: string;
  kind: "markdown" | "canvas" | "link" | "pdf";
  bodyHtml: string;
}

export type HighlightingThemeChoice = "shiki" | "github" | "vscode" | "catppuccin" | "material";

export type NodePalette = {
  background: string;
  border: string;
};

export type MarkdownRenderOptions = {
  darkMode?: boolean;
  highlightingTheme?: HighlightingThemeChoice;
};
