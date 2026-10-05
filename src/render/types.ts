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
  canvasSourcePath?: string;
  canvasPreview?: CanvasData;
  displayName?: string;
  fileKind?: "image" | "markdown" | "canvas" | "pdf" | "audio" | "video" | "file";
  previewText?: string;
  previewHtml?: string;
  searchText?: string;
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
  navigationInitiallyOpen?: boolean;
  navigationPageId?: string;
  exportFormat?: "package" | "single-html";
  canvasHomeHref?: string;
  canvasHomeTarget?: "_parent";
  contents?: ContentsNavigation;
  additionalSearchEntries?: SearchEntry[];
  embeddedPages?: EmbeddedPage[];
  initialFoldState?: CanvasFoldState;
}

export interface SearchEntry {
  id: string;
  title: string;
  snippet: string;
  text: string;
  kindLabel: string;
  positionLabel: string;
  dedupeKey?: string;
  focusNodeId?: string;
  openHref?: string;
  openTarget?: "_parent";
  openNodeId?: string;
  openPageHref?: string;
}

export interface ContentsNavigationItem {
  title: string;
  href: string;
  kind: "canvas" | "markdown" | "link" | "pdf";
  current?: boolean;
  target?: "_parent";
  children?: ContentsNavigationItem[];
}

export interface ContentsNavigation {
  canvases: ContentsNavigationItem[];
  pages: ContentsNavigationItem[];
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
