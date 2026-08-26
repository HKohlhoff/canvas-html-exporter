export type FoldingInitialStateChoice = "expanded" | "current";

export type CanvasFoldStateSource = "active-leaf" | "persisted";

export interface CanvasFoldState {
  readonly hiddenEdgeIds: readonly string[];
  readonly hiddenNodeIds: readonly string[];
  readonly source: CanvasFoldStateSource;
}
