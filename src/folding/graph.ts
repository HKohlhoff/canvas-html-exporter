export interface FoldingGraphNode {
  readonly id: string;
  readonly type: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface FoldingGraphEdge {
  readonly id?: string;
  readonly fromNode: string;
  readonly toNode: string;
}

export interface CanvasFoldingGraph {
  readonly childrenByNode: Readonly<Record<string, readonly string[]>>;
  readonly groupMembersByNode: Readonly<Record<string, readonly string[]>>;
  readonly levelByNode: Readonly<Record<string, number>>;
  readonly maxLevel: number;
  readonly parentsByNode: Readonly<Record<string, readonly string[]>>;
  readonly rootNodeIds: readonly string[];
}

export interface CanvasFoldingVisibility {
  readonly hiddenEdgeIds: ReadonlySet<string>;
  readonly hiddenNodeIds: ReadonlySet<string>;
}

export type RevealedBranchesByRestriction = ReadonlyMap<
  string,
  ReadonlySet<string>
>;

export interface CanvasBranchCollapseState {
  readonly collapsedNodeIds: ReadonlySet<string>;
  readonly revealedBranchesByRestriction: RevealedBranchesByRestriction;
}

export function buildCanvasFoldingGraph(
  nodes: readonly FoldingGraphNode[],
  edges: readonly FoldingGraphEdge[],
): CanvasFoldingGraph {
  const nodeIds = [...new Set(nodes.map((node) => node.id))].sort();
  const knownNodeIds = new Set(nodeIds);
  const children = new Map(nodeIds.map((id) => [id, new Set<string>()]));
  const parents = new Map(nodeIds.map((id) => [id, new Set<string>()]));

  for (const edge of edges) {
    if (!knownNodeIds.has(edge.fromNode) || !knownNodeIds.has(edge.toNode)) continue;
    children.get(edge.fromNode)?.add(edge.toNode);
    parents.get(edge.toNode)?.add(edge.fromNode);
  }

  const childrenByNode = mapSetsToRecord(children);
  const parentsByNode = mapSetsToRecord(parents);
  const rootNodeIds = Object.freeze(
    nodeIds.filter((nodeId) => (parentsByNode[nodeId] ?? []).length === 0),
  );
  const levelByNode = buildRootLevels(rootNodeIds, childrenByNode);
  const maxLevel = Math.max(-1, ...Object.values(levelByNode));
  const groupMembersByNode = Object.fromEntries(
    nodes
      .filter((node) => node.type.toLowerCase() === "group")
      .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0)
      .map((group) => [
        group.id,
        nodes
          .filter((node) => node.type.toLowerCase() !== "group" && isInsideGroup(node, group))
          .map((node) => node.id)
          .sort(),
      ]),
  );
  for (const memberIds of Object.values(groupMembersByNode)) {
    Object.freeze(memberIds);
  }

  return Object.freeze({
    childrenByNode: Object.freeze(childrenByNode),
    groupMembersByNode: Object.freeze(groupMembersByNode),
    levelByNode: Object.freeze(levelByNode),
    maxLevel,
    parentsByNode: Object.freeze(parentsByNode),
    rootNodeIds,
  });
}

export function deriveCollapsedVisibility(
  graph: CanvasFoldingGraph,
  edges: readonly FoldingGraphEdge[],
  collapsedNodeIds: Iterable<string>,
  revealedBranchesByRestriction: RevealedBranchesByRestriction = new Map(),
): CanvasFoldingVisibility {
  const collapsed = new Set(
    [...collapsedNodeIds].filter((nodeId) => getCanvasDescendants(graph, nodeId).length > 0),
  );
  const hiddenNodes = new Set<string>();

  for (const nodeId of [...collapsed].sort()) {
    const hiddenByRestriction = getHiddenNodesForRestriction(
      graph,
      nodeId,
      revealedBranchesByRestriction.get(nodeId) ?? new Set(),
    );
    for (const descendantId of hiddenByRestriction) {
      hiddenNodes.add(descendantId);
    }
  }

  for (const [groupId, memberIds] of Object.entries(graph.groupMembersByNode)) {
    if (memberIds.length > 0 && memberIds.every((memberId) => hiddenNodes.has(memberId))) {
      hiddenNodes.add(groupId);
    }
  }

  const hiddenEdges = new Set<string>();
  for (const edge of edges) {
    if (!edge.id) continue;
    if (
      hiddenNodes.has(edge.fromNode)
      || hiddenNodes.has(edge.toNode)
    ) {
      hiddenEdges.add(edge.id);
    }
  }

  return Object.freeze({
    hiddenEdgeIds: hiddenEdges,
    hiddenNodeIds: hiddenNodes,
  });
}

export function getHiddenNodesForRestriction(
  graph: CanvasFoldingGraph,
  restrictedNodeId: string,
  revealedBranchNodeIds: Iterable<string> = [],
): ReadonlySet<string> {
  const hiddenNodeIds = new Set(getCanvasDescendants(graph, restrictedNodeId));
  for (const revealedNodeId of revealedBranchNodeIds) {
    for (const descendantId of getCanvasDescendants(graph, revealedNodeId)) {
      hiddenNodeIds.delete(descendantId);
    }
  }
  return hiddenNodeIds;
}

export function toggleCollapsedBranch(
  graph: CanvasFoldingGraph,
  state: CanvasBranchCollapseState,
  nodeId: string,
): CanvasBranchCollapseState {
  const descendants = getCanvasDescendants(graph, nodeId);
  const collapsedNodeIds = new Set(state.collapsedNodeIds);
  const revealedBranchesByRestriction = new Map(
    [...state.revealedBranchesByRestriction].map(([restrictedNodeId, revealedNodeIds]) => [
      restrictedNodeId,
      new Set(revealedNodeIds),
    ]),
  );
  if (descendants.length === 0) {
    return { collapsedNodeIds, revealedBranchesByRestriction };
  }

  const childIds = graph.childrenByNode[nodeId] ?? [];
  const hiddenNodeIds = deriveCollapsedHiddenNodeIds(
    graph,
    collapsedNodeIds,
    revealedBranchesByRestriction,
  );
  const hasHiddenBranch = childIds.some((childId) => hiddenNodeIds.has(childId));
  if (hasHiddenBranch) {
    collapsedNodeIds.delete(nodeId);
    revealedBranchesByRestriction.delete(nodeId);
    for (const restrictedNodeId of collapsedNodeIds) {
      const hiddenByRestriction = getHiddenNodesForRestriction(
        graph,
        restrictedNodeId,
        revealedBranchesByRestriction.get(restrictedNodeId) ?? [],
      );
      if (!childIds.some((childId) => hiddenByRestriction.has(childId))) continue;
      const revealedNodeIds = revealedBranchesByRestriction.get(restrictedNodeId) ?? new Set();
      revealedNodeIds.add(nodeId);
      revealedBranchesByRestriction.set(restrictedNodeId, revealedNodeIds);
    }
  } else {
    collapsedNodeIds.add(nodeId);
    revealedBranchesByRestriction.delete(nodeId);
  }
  return { collapsedNodeIds, revealedBranchesByRestriction };
}

function deriveCollapsedHiddenNodeIds(
  graph: CanvasFoldingGraph,
  collapsedNodeIds: Iterable<string>,
  revealedBranchesByRestriction: RevealedBranchesByRestriction,
): ReadonlySet<string> {
  const hiddenNodeIds = new Set<string>();
  for (const restrictedNodeId of collapsedNodeIds) {
    for (const hiddenNodeId of getHiddenNodesForRestriction(
      graph,
      restrictedNodeId,
      revealedBranchesByRestriction.get(restrictedNodeId) ?? [],
    )) {
      hiddenNodeIds.add(hiddenNodeId);
    }
  }
  return hiddenNodeIds;
}

export function getNodesBeyondLevel(
  graph: CanvasFoldingGraph,
  visibleLevel: number,
): ReadonlySet<string> {
  const limit = Math.max(0, Math.floor(visibleLevel));
  return new Set(
    Object.entries(graph.levelByNode)
      .filter(([, level]) => level > limit)
      .map(([nodeId]) => nodeId),
  );
}

function mapSetsToRecord(map: ReadonlyMap<string, ReadonlySet<string>>): Record<string, readonly string[]> {
  return Object.fromEntries(
    [...map.entries()].map(([id, values]) => [id, Object.freeze([...values].sort())]),
  );
}

function buildRootLevels(
  rootNodeIds: readonly string[],
  childrenByNode: Readonly<Record<string, readonly string[]>>,
): Record<string, number> {
  const levels: Record<string, number> = {};
  const pending: Array<{ id: string; level: number }> = rootNodeIds.map((id) => ({ id, level: 0 }));
  let index = 0;

  while (index < pending.length) {
    const current = pending[index];
    index += 1;
    const previousLevel = levels[current.id];
    if (previousLevel !== undefined && previousLevel <= current.level) continue;
    levels[current.id] = current.level;
    for (const childId of childrenByNode[current.id] ?? []) {
      pending.push({ id: childId, level: current.level + 1 });
    }
  }

  return levels;
}

export function getCanvasDescendants(
  graph: CanvasFoldingGraph,
  startId: string,
): readonly string[] {
  return collectDescendants(startId, graph.childrenByNode);
}

export function getCanvasBranchNodeIds(
  graph: CanvasFoldingGraph,
  startId: string,
): ReadonlySet<string> {
  if (!(startId in graph.childrenByNode)) return new Set();
  return new Set([startId, ...getCanvasDescendants(graph, startId)]);
}

function collectDescendants(
  startId: string,
  childrenByNode: Readonly<Record<string, readonly string[]>>,
): readonly string[] {
  const visited = new Set<string>([startId]);
  const pending = [...(childrenByNode[startId] ?? [])].reverse();

  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    visited.add(current);
    const children = childrenByNode[current] ?? [];
    for (let index = children.length - 1; index >= 0; index -= 1) {
      pending.push(children[index]);
    }
  }

  visited.delete(startId);
  return Object.freeze([...visited].sort());
}

function isInsideGroup(node: FoldingGraphNode, group: FoldingGraphNode): boolean {
  const centerX = node.x + node.width / 2;
  const centerY = node.y + node.height / 2;
  return centerX >= group.x
    && centerX <= group.x + group.width
    && centerY >= group.y
    && centerY <= group.y + group.height;
}
