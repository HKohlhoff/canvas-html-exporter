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
  readonly connectedGroupNodeIds: readonly string[];
  readonly groupContentsByNode: Readonly<Record<string, readonly string[]>>;
  readonly groupMembersByNode: Readonly<Record<string, readonly string[]>>;
  readonly levelByNode: Readonly<Record<string, number>>;
  readonly maxLevel: number;
  readonly parentsByNode: Readonly<Record<string, readonly string[]>>;
  readonly rootNodeIds: readonly string[];
}

export interface CanvasFoldingVisibility {
  readonly groupHiddenNodeIds: ReadonlySet<string>;
  readonly hiddenEdgeIds: ReadonlySet<string>;
  readonly hiddenNodeIds: ReadonlySet<string>;
}

export function buildCanvasFoldingGraph(
  nodes: readonly FoldingGraphNode[],
  edges: readonly FoldingGraphEdge[],
): CanvasFoldingGraph {
  const nodeIds = [...new Set(nodes.map((node) => node.id))].sort();
  const knownNodeIds = new Set(nodeIds);
  const nodeTypeById = new Map(
    nodes.map((node) => [node.id, node.type.toLowerCase()]),
  );
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
  const groups = nodes
    .filter((node) => node.type.toLowerCase() === "group")
    .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const groupContentsByNode = Object.fromEntries(
    groups
      .map((group) => [
        group.id,
        nodes
          .filter((node) => node.id !== group.id && isInsideGroup(node, group))
          .map((node) => node.id)
          .sort(),
      ]),
  );
  const groupMembersByNode = Object.fromEntries(
    groups
      .map((group) => [
        group.id,
        (groupContentsByNode[group.id] ?? []).filter(
          (nodeId) => nodeTypeById.get(nodeId) !== "group",
        ),
      ]),
  );
  const connectedGroupNodeIds = Object.freeze(
    groups
      .filter((group) =>
        (childrenByNode[group.id] ?? []).length > 0 ||
        (parentsByNode[group.id] ?? []).length > 0,
      )
      .map((group) => group.id),
  );
  for (const contentIds of Object.values(groupContentsByNode)) {
    Object.freeze(contentIds);
  }
  for (const memberIds of Object.values(groupMembersByNode)) {
    Object.freeze(memberIds);
  }

  return Object.freeze({
    childrenByNode: Object.freeze(childrenByNode),
    connectedGroupNodeIds,
    groupContentsByNode: Object.freeze(groupContentsByNode),
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
): CanvasFoldingVisibility {
  const collapsed = new Set(
    [...collapsedNodeIds].filter((nodeId) => getCanvasDescendants(graph, nodeId).length > 0),
  );
  const hiddenNodes = new Set<string>();

  for (const nodeId of [...collapsed].sort()) {
    for (const descendantId of getCanvasDescendants(graph, nodeId)) {
      hiddenNodes.add(descendantId);
    }
  }

  let revealedAny = true;
  while (revealedAny) {
    revealedAny = false;
    for (const nodeId of [...hiddenNodes].sort()) {
      const hasVisibleAlternativeParent = (graph.parentsByNode[nodeId] ?? []).some(
        (parentId) => !hiddenNodes.has(parentId) && !collapsed.has(parentId),
      );
      if (hasVisibleAlternativeParent) {
        hiddenNodes.delete(nodeId);
        revealedAny = true;
      }
    }
  }

  const groupHiddenNodeIds = getNodeIdsHiddenByGroups(graph, hiddenNodes);
  for (const nodeId of groupHiddenNodeIds) hiddenNodes.add(nodeId);

  const connectedGroupNodeIds = new Set(graph.connectedGroupNodeIds);
  for (const [groupId, memberIds] of Object.entries(graph.groupMembersByNode)) {
    if (
      !connectedGroupNodeIds.has(groupId) &&
      memberIds.length > 0 &&
      memberIds.every((memberId) => hiddenNodes.has(memberId))
    ) {
      hiddenNodes.add(groupId);
    }
  }

  const hiddenEdges = new Set<string>();
  for (const edge of edges) {
    if (!edge.id) continue;
    if (
      collapsed.has(edge.fromNode)
      || hiddenNodes.has(edge.fromNode)
      || hiddenNodes.has(edge.toNode)
    ) {
      hiddenEdges.add(edge.id);
    }
  }

  return Object.freeze({
    groupHiddenNodeIds,
    hiddenEdgeIds: hiddenEdges,
    hiddenNodeIds: hiddenNodes,
  });
}

export function getNodeIdsHiddenByGroups(
  graph: Pick<CanvasFoldingGraph, "groupContentsByNode">,
  hiddenNodeIds: ReadonlySet<string>,
): ReadonlySet<string> {
  const pendingGroupIds = Object.keys(graph.groupContentsByNode)
    .filter((groupId) => hiddenNodeIds.has(groupId))
    .sort();
  const processedGroupIds = new Set<string>();
  const groupHiddenNodeIds = new Set<string>();
  for (let index = 0; index < pendingGroupIds.length; index += 1) {
    const groupId = pendingGroupIds[index];
    if (!groupId || processedGroupIds.has(groupId)) continue;
    processedGroupIds.add(groupId);
    for (const nodeId of graph.groupContentsByNode[groupId] ?? []) {
      groupHiddenNodeIds.add(nodeId);
      if (
        nodeId in graph.groupContentsByNode &&
        !processedGroupIds.has(nodeId)
      ) {
        pendingGroupIds.push(nodeId);
      }
    }
  }
  return groupHiddenNodeIds;
}

export function toggleCollapsedBranch(
  graph: CanvasFoldingGraph,
  collapsedNodeIds: Iterable<string>,
  hiddenNodeIds: ReadonlySet<string>,
  nodeId: string,
): ReadonlySet<string> {
  const descendants = getCanvasDescendants(graph, nodeId);
  const next = new Set(collapsedNodeIds);
  if (descendants.length === 0) return next;

  const hasHiddenBranch = next.has(nodeId)
    || descendants.some((descendantId) => hiddenNodeIds.has(descendantId));
  if (hasHiddenBranch) {
    next.delete(nodeId);
    for (const descendantId of descendants) {
      next.delete(descendantId);
    }
  } else {
    next.add(nodeId);
  }
  return next;
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
  return node.x >= group.x
    && node.y >= group.y
    && node.x + node.width <= group.x + group.width
    && node.y + node.height <= group.y + group.height;
}
