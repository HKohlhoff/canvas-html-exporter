import type { CanvasFoldingGraph } from "../folding/graph";
import type { CanvasFoldState } from "../folding/types";
import type { getTheme } from "./theme";
import type { CanvasEdgeEnd, CanvasNode, ExportOptions } from "./types";
export type BrowserRuntimeParameters = {
  exportFormat: "package" | "single-html";
  options: ExportOptions;
  theme: ReturnType<typeof getTheme>;
  edgePaletteColors: Record<string, string>;
  edgesData: { id: string; fromId: string; toId: string; fromSide: "top" | "bottom" | "left" | "right"; toSide: "top" | "bottom" | "left" | "right"; fromEnd: CanvasEdgeEnd; toEnd: CanvasEdgeEnd; lineStyle: "solid" | "dashed" | "dotted" | "short-dash" | "long-dash" | "dash-dot"; width: number; label: string; color: string; }[];
  searchEntries: { id: string; title: string; snippet: string; text: string; kindLabel: string; positionLabel: string; openHref?: string; openTarget?: "_parent"; }[];
  foldingGraph: CanvasFoldingGraph;
  groupNodeIds: string[];
  initialFoldState: CanvasFoldState | undefined;
  nodes: CanvasNode[];
  foldingInitiallyEnabled: boolean;
  bounds: { width: number; height: number; offsetX: number; offsetY: number; };
  hasImportedFolding: boolean;
};
