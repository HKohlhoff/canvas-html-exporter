import assert from "node:assert/strict";
import {
  buildCanvasFoldingGraph,
  deriveCollapsedVisibility,
  getCanvasBranchNodeIds,
  getCanvasDescendants,
  getNodesBeyondLevel,
  toggleCollapsedBranch,
  type FoldingGraphEdge,
  type FoldingGraphNode,
} from "../src/folding/graph";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const node = (id: string, x = 0, y = 0): FoldingGraphNode => ({
  id,
  type: "text",
  x,
  y,
  width: 100,
  height: 60,
});

test("derives descendants deterministically and collapses a simple branch", () => {
  const nodes = [node("root"), node("child"), node("leaf"), node("isolated")];
  const edges: FoldingGraphEdge[] = [
    { id: "root-child", fromNode: "root", toNode: "child" },
    { id: "child-leaf", fromNode: "child", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);

  assert.deepEqual(getCanvasDescendants(graph, "root"), ["child", "leaf"]);
  const visibility = deriveCollapsedVisibility(graph, edges, ["root"]);
  assert.deepEqual([...visibility.hiddenNodeIds].sort(), ["child", "leaf"]);
  assert.deepEqual([...visibility.hiddenEdgeIds].sort(), ["child-leaf", "root-child"]);
  assert.equal(visibility.hiddenNodeIds.has("isolated"), false);
});

test("keeps a shared descendant hidden until an alternative parent is explicitly revealed", () => {
  const nodes = [node("a1"), node("a2"), node("b1"), node("b2"), node("leaf")];
  const edges: FoldingGraphEdge[] = [
    { id: "a1-a2", fromNode: "a1", toNode: "a2" },
    { id: "a1-b2", fromNode: "a1", toNode: "b2" },
    { id: "a2-b2", fromNode: "a2", toNode: "b2" },
    { id: "b1-b2", fromNode: "b1", toNode: "b2" },
    { id: "b2-leaf", fromNode: "b2", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const visibility = deriveCollapsedVisibility(graph, edges, ["b1"]);

  assert.deepEqual([...visibility.hiddenNodeIds].sort(), ["b2", "leaf"]);
  assert.equal(visibility.hiddenNodeIds.has("a1"), false);
  assert.equal(visibility.hiddenNodeIds.has("a2"), false);
  assert.deepEqual(
    [...visibility.hiddenEdgeIds].sort(),
    ["a1-b2", "a2-b2", "b1-b2", "b2-leaf"],
  );

  const revealedVisibility = deriveCollapsedVisibility(
    graph,
    edges,
    ["b1"],
    new Map([["b1", new Set(["a1"])]]),
  );
  assert.deepEqual([...revealedVisibility.hiddenNodeIds], []);
  assert.deepEqual([...revealedVisibility.hiddenEdgeIds], []);
});

test("collapses a directed cycle finitely without hiding the selected node", () => {
  const nodes = [node("a"), node("b"), node("c")];
  const edges: FoldingGraphEdge[] = [
    { id: "a-b", fromNode: "a", toNode: "b" },
    { id: "b-c", fromNode: "b", toNode: "c" },
    { id: "c-a", fromNode: "c", toNode: "a" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const visibility = deriveCollapsedVisibility(graph, edges, ["a"]);

  assert.deepEqual([...visibility.hiddenNodeIds].sort(), ["b", "c"]);
  assert.deepEqual([...visibility.hiddenEdgeIds].sort(), ["a-b", "b-c", "c-a"]);
  assert.deepEqual([...getCanvasBranchNodeIds(graph, "a")].sort(), ["a", "b", "c"]);
  assert.deepEqual([...getCanvasBranchNodeIds(graph, "missing")], []);
});

test("hides a non-empty group only when all contained nodes are hidden", () => {
  const nodes: FoldingGraphNode[] = [
    node("root", -200, 0),
    { id: "group", type: "group", x: 0, y: 0, width: 400, height: 200 },
    node("inside-a", 40, 40),
    node("inside-b", 220, 40),
  ];
  const edges: FoldingGraphEdge[] = [
    { id: "root-a", fromNode: "root", toNode: "inside-a" },
    { id: "a-b", fromNode: "inside-a", toNode: "inside-b" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const visibility = deriveCollapsedVisibility(graph, edges, ["root"]);

  assert.deepEqual(graph.groupMembersByNode.group, ["inside-a", "inside-b"]);
  assert.equal(visibility.hiddenNodeIds.has("group"), true);
});

test("preserves nested restrictions and reveals only the selected shared branch", () => {
  const nodes = [node("root"), node("child"), node("leaf")];
  const edges: FoldingGraphEdge[] = [
    { id: "root-child", fromNode: "root", toNode: "child" },
    { id: "child-leaf", fromNode: "child", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const collapsedChildState = {
    collapsedNodeIds: new Set(["child"]),
    revealedBranchesByRestriction: new Map<string, ReadonlySet<string>>(),
  };
  const collapsedRootState = toggleCollapsedBranch(graph, collapsedChildState, "root");
  assert.deepEqual([...collapsedRootState.collapsedNodeIds].sort(), ["child", "root"]);

  const expandedRootState = toggleCollapsedBranch(graph, collapsedRootState, "root");
  assert.deepEqual([...expandedRootState.collapsedNodeIds], ["child"]);
  assert.deepEqual(
    [...deriveCollapsedVisibility(
      graph,
      edges,
      expandedRootState.collapsedNodeIds,
      expandedRootState.revealedBranchesByRestriction,
    ).hiddenNodeIds],
    ["leaf"],
  );
});

test("reveals a shared branch without restoring a hidden sibling", () => {
  const nodes = [node("a1"), node("a2"), node("b"), node("shared"), node("leaf")];
  const edges: FoldingGraphEdge[] = [
    { id: "a1-a2", fromNode: "a1", toNode: "a2" },
    { id: "a1-shared", fromNode: "a1", toNode: "shared" },
    { id: "b-shared", fromNode: "b", toNode: "shared" },
    { id: "shared-leaf", fromNode: "shared", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const collapsedState = {
    collapsedNodeIds: new Set(["a1"]),
    revealedBranchesByRestriction: new Map<string, ReadonlySet<string>>(),
  };

  const revealedState = toggleCollapsedBranch(graph, collapsedState, "b");
  const visibility = deriveCollapsedVisibility(
    graph,
    edges,
    revealedState.collapsedNodeIds,
    revealedState.revealedBranchesByRestriction,
  );

  assert.deepEqual([...revealedState.collapsedNodeIds], ["a1"]);
  assert.deepEqual([...revealedState.revealedBranchesByRestriction.get("a1") ?? []], ["b"]);
  assert.deepEqual([...visibility.hiddenNodeIds], ["a2"]);
  assert.deepEqual([...visibility.hiddenEdgeIds], ["a1-a2"]);
});

test("assigns shortest root levels and keeps rootless cycles outside the level view", () => {
  const nodes = [
    node("root-a"),
    node("root-b"),
    node("shared"),
    node("leaf"),
    node("cycle-a"),
    node("cycle-b"),
    node("isolated"),
  ];
  const edges: FoldingGraphEdge[] = [
    { fromNode: "root-a", toNode: "shared" },
    { fromNode: "root-b", toNode: "leaf" },
    { fromNode: "leaf", toNode: "shared" },
    { fromNode: "shared", toNode: "leaf" },
    { fromNode: "cycle-a", toNode: "cycle-b" },
    { fromNode: "cycle-b", toNode: "cycle-a" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);

  assert.deepEqual(graph.rootNodeIds, ["isolated", "root-a", "root-b"]);
  assert.deepEqual(graph.levelByNode, {
    isolated: 0,
    "root-a": 0,
    "root-b": 0,
    leaf: 1,
    shared: 1,
  });
  assert.equal(graph.maxLevel, 1);
  assert.deepEqual([...getNodesBeyondLevel(graph, 0)].sort(), ["leaf", "shared"]);
  assert.equal(getNodesBeyondLevel(graph, 0).has("cycle-a"), false);
});
