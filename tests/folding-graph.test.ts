import assert from "node:assert/strict";
import {
  buildCanvasFoldingGraph,
  countHiddenBranchItems,
  deriveAdvancedGroupVisibility,
  deriveCollapsedVisibility,
  getCanvasBranchNodeIds,
  getCanvasDescendants,
  getNodesBeyondLevel,
  getNodeIdsHiddenByGroups,
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

test("keeps shared descendants visible through an uncollapsed alternative branch", () => {
  const nodes = [node("a1"), node("a2"), node("b1"), node("b2"), node("leaf")];
  const edges: FoldingGraphEdge[] = [
    { id: "a1-a2", fromNode: "a1", toNode: "a2" },
    { id: "a1-b2", fromNode: "a1", toNode: "b2" },
    { id: "a2-b2", fromNode: "a2", toNode: "b2" },
    { id: "b1-b2", fromNode: "b1", toNode: "b2" },
    { id: "b2-leaf", fromNode: "b2", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const collapsedB1 = deriveCollapsedVisibility(graph, edges, ["b1"]);
  assert.deepEqual([...collapsedB1.hiddenNodeIds], []);
  assert.deepEqual([...collapsedB1.hiddenEdgeIds], ["b1-b2"]);

  const collapsedA1 = deriveCollapsedVisibility(graph, edges, ["a1"]);
  assert.deepEqual([...collapsedA1.hiddenNodeIds], ["a2"]);
  assert.deepEqual(
    [...collapsedA1.hiddenEdgeIds].sort(),
    ["a1-a2", "a1-b2", "a2-b2"],
  );
  assert.equal(collapsedA1.hiddenEdgeIds.has("b1-b2"), false);
  assert.equal(collapsedA1.hiddenEdgeIds.has("b2-leaf"), false);
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

test("treats connected groups as regular folding descendants", () => {
  const nodes: FoldingGraphNode[] = [
    { ...node("group-root", 0, 0), type: "group" },
    { ...node("group-child", 200, 0), type: "group" },
    { ...node("group-grandchild", 400, 0), type: "group" },
  ];
  const edges: FoldingGraphEdge[] = [
    { id: "root-child", fromNode: "group-root", toNode: "group-child" },
    { id: "child-grandchild", fromNode: "group-child", toNode: "group-grandchild" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const visibility = deriveCollapsedVisibility(graph, edges, ["group-root"]);

  assert.deepEqual(
    [...visibility.hiddenNodeIds],
    ["group-child", "group-grandchild"],
  );
  assert.deepEqual(
    [...visibility.hiddenEdgeIds],
    ["root-child", "child-grandchild"],
  );
});

test("keeps a connected group visible when a separate branch hides its only content", () => {
  const nodes: FoldingGraphNode[] = [
    { id: "group-child", type: "group", x: 0, y: 0, width: 300, height: 200 },
    { id: "group-grandchild", type: "group", x: 400, y: 0, width: 300, height: 200 },
    node("d1", 0, 300),
    node("d1.2", 420, 20),
  ];
  const edges: FoldingGraphEdge[] = [
    { id: "group-branch", fromNode: "group-child", toNode: "group-grandchild" },
    { id: "d-branch", fromNode: "d1", toNode: "d1.2" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);

  const separateBranchFold = deriveCollapsedVisibility(graph, edges, ["d1"]);
  assert.deepEqual([...separateBranchFold.hiddenNodeIds], ["d1.2"]);
  assert.equal(separateBranchFold.hiddenNodeIds.has("group-grandchild"), false);

  const groupBranchFold = deriveCollapsedVisibility(graph, edges, ["group-child"]);
  assert.deepEqual(
    [...groupBranchFold.hiddenNodeIds],
    ["group-grandchild", "d1.2"],
  );
  assert.deepEqual([...groupBranchFold.groupHiddenNodeIds], ["d1.2"]);
  assert.deepEqual(
    [...getNodeIdsHiddenByGroups(graph, new Set(["group-grandchild"]))],
    ["d1.2"],
  );
});

test("collapses Advanced Canvas groups independently of directed branches", () => {
  const nodes: FoldingGraphNode[] = [
    { id: "outer", type: "group", x: 0, y: 0, width: 500, height: 300 },
    { id: "inner", type: "group", x: 200, y: 20, width: 260, height: 220 },
    node("outer-node", 20, 20),
    node("inner-node", 240, 60),
    node("outside", 600, 20),
  ];
  const edges: FoldingGraphEdge[] = [
    { id: "inside-edge", fromNode: "outer-node", toNode: "inner-node" },
    { id: "outside-edge", fromNode: "outside", toNode: "outer" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);

  const inner = deriveAdvancedGroupVisibility(graph, edges, ["inner"]);
  assert.deepEqual([...inner.hiddenNodeIds], ["inner-node"]);
  assert.deepEqual([...inner.hiddenEdgeIds], ["inside-edge"]);

  const outer = deriveAdvancedGroupVisibility(graph, edges, ["outer"]);
  assert.deepEqual(
    [...outer.hiddenNodeIds].sort(),
    ["inner", "inner-node", "outer-node"],
  );
  assert.deepEqual([...outer.hiddenEdgeIds], ["inside-edge"]);
  assert.equal(outer.hiddenNodeIds.has("outer"), false);
  assert.equal(outer.hiddenEdgeIds.has("outside-edge"), false);
});

test("counts hidden groups and geometrically contained nodes in branch controls", () => {
  const nodes: FoldingGraphNode[] = [
    { id: "root", type: "group", x: 0, y: 0, width: 100, height: 100 },
    { id: "child-group", type: "group", x: 200, y: 0, width: 300, height: 220 },
    { id: "inner-group", type: "group", x: 220, y: 20, width: 120, height: 120 },
    node("direct-child", 520, 0),
    node("inside-child", 360, 20),
    node("inside-inner", 230, 30),
  ];
  const edges: FoldingGraphEdge[] = [
    { id: "root-child", fromNode: "root", toNode: "child-group" },
    { id: "root-direct", fromNode: "root", toNode: "direct-child" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const hiddenNodeIds = new Set([
    "child-group",
    "inner-group",
    "direct-child",
    "inside-child",
    "inside-inner",
  ]);

  assert.deepEqual(countHiddenBranchItems(graph, "root", hiddenNodeIds), {
    groupCount: 2,
    itemCount: 5,
    nodeCount: 3,
  });
});

test("expands an entire branch including nested collapsed nodes", () => {
  const nodes = [node("root"), node("child"), node("leaf")];
  const edges: FoldingGraphEdge[] = [
    { id: "root-child", fromNode: "root", toNode: "child" },
    { id: "child-leaf", fromNode: "child", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const nestedVisibility = deriveCollapsedVisibility(graph, edges, ["child"]);

  assert.deepEqual(
    [...toggleCollapsedBranch(graph, ["child"], nestedVisibility.hiddenNodeIds, "root")],
    [],
  );
  assert.deepEqual(
    [...toggleCollapsedBranch(graph, [], new Set(), "root")],
    ["root"],
  );
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
