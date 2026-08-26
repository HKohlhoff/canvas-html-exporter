import type { CanvasFoldState } from "./types";

export function filterCanvasFoldState(
  state: CanvasFoldState,
  nodeIds: Iterable<string>,
  edgeIds: Iterable<string>,
): CanvasFoldState {
  const exportedNodeIds = new Set(nodeIds);
  const exportedEdgeIds = new Set(edgeIds);

  return Object.freeze({
    hiddenEdgeIds: Object.freeze(filterIds(state.hiddenEdgeIds, exportedEdgeIds)),
    hiddenNodeIds: Object.freeze(filterIds(state.hiddenNodeIds, exportedNodeIds)),
    source: state.source,
  });
}

function filterIds(ids: readonly string[], allowedIds: ReadonlySet<string>): string[] {
  return [...new Set(ids.filter((id) => allowedIds.has(id)))].sort();
}
