import assert from "node:assert/strict";
import {
  buildCanvasFoldingGraph,
  deriveCollapsedVisibility,
  getCanvasDescendants,
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

test("keeps a shared descendant visible through an alternative parent", () => {
  const nodes = [node("left"), node("right"), node("shared"), node("leaf")];
  const edges: FoldingGraphEdge[] = [
    { id: "left-shared", fromNode: "left", toNode: "shared" },
    { id: "right-shared", fromNode: "right", toNode: "shared" },
    { id: "shared-leaf", fromNode: "shared", toNode: "leaf" },
  ];
  const graph = buildCanvasFoldingGraph(nodes, edges);
  const visibility = deriveCollapsedVisibility(graph, edges, ["left"]);

  assert.deepEqual([...visibility.hiddenNodeIds], []);
  assert.deepEqual([...visibility.hiddenEdgeIds], ["left-shared"]);
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
