export type FoldingInitialStateChoice = "none" | "expanded" | "current";

export const DEFAULT_FOLDING_INITIAL_STATE: FoldingInitialStateChoice = "none";

export function normalizeFoldingInitialStateChoice(value: unknown): FoldingInitialStateChoice {
  return value === "expanded" || value === "current" || value === "none"
    ? value
    : DEFAULT_FOLDING_INITIAL_STATE;
}

export type CanvasFoldStateSource = "active-leaf" | "persisted";

export interface CanvasFoldState {
  readonly hiddenEdgeIds: readonly string[];
  readonly hiddenNodeIds: readonly string[];
  readonly source: CanvasFoldStateSource;
}
