import assert from "node:assert/strict";
import { collectCanvasColorKeys, normalizeCanvasData, shouldRewriteInternalTarget } from "../src/export/canvas-data";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("rewrites normal internal targets", () => {
  assert.equal(shouldRewriteInternalTarget("Ordner/Ziel.md"), true);
  assert.equal(shouldRewriteInternalTarget("bilder/grafik.png"), true);
});

test("does not rewrite external or anchor targets", () => {
  assert.equal(shouldRewriteInternalTarget("https://example.com"), false);
  assert.equal(shouldRewriteInternalTarget("mailto:test@example.com"), false);
  assert.equal(shouldRewriteInternalTarget("#abschnitt"), false);
});

test("does not rewrite already exported asset paths", () => {
  assert.equal(shouldRewriteInternalTarget("assets/files/test.pdf"), false);
  assert.equal(shouldRewriteInternalTarget("assets/images/test.png"), false);
});

test("normalizes canvas data and falls back to provided name", () => {
  const data = normalizeCanvasData(
    {
      nodes: [
        { id: "n1", type: "text", x: "10", y: 20, width: 300, height: "150", text: "Hallo", color: 4 },
        { id: "", type: "text" },
      ],
      edges: [
        { fromNode: "n1", toNode: "n2", color: 5, label: "Kante" },
        { fromNode: "", toNode: "n2" },
      ],
    },
    "Fallback Canvas",
  );

  assert.equal(data.name, "Fallback Canvas");
  assert.equal(data.nodes.length, 1);
  assert.equal(data.edges.length, 1);
  assert.equal(data.nodes[0]?.x, 10);
  assert.equal(data.nodes[0]?.height, 150);
  assert.equal(data.nodes[0]?.color, "4");
  assert.equal(data.edges[0]?.color, "5");
});

test("prefers embedded canvas name when present", () => {
  const data = normalizeCanvasData({ name: "Mein Canvas", nodes: [], edges: [] }, "Fallback");
  assert.equal(data.name, "Mein Canvas");
});

test("falls back to safe defaults for missing node fields", () => {
  const data = normalizeCanvasData(
    {
      nodes: [
        { id: "n1" },
      ],
      edges: [],
    },
    "Fallback",
  );

  assert.equal(data.nodes.length, 1);
  assert.equal(data.nodes[0]?.type, "text");
  assert.equal(data.nodes[0]?.x, 0);
  assert.equal(data.nodes[0]?.y, 0);
  assert.equal(data.nodes[0]?.width, 0);
  assert.equal(data.nodes[0]?.height, 0);
});

test("drops invalid node and edge entries during normalization", () => {
  const data = normalizeCanvasData(
    {
      nodes: [null, "text", { type: "text" }, { id: "valid", type: "group" }],
      edges: [null, { fromNode: "a" }, { fromNode: "a", toNode: "b" }],
    },
    "Fallback",
  );

  assert.equal(data.nodes.length, 1);
  assert.equal(data.nodes[0]?.id, "valid");
  assert.equal(data.edges.length, 1);
  assert.equal(data.edges[0]?.fromNode, "a");
  assert.equal(data.edges[0]?.toNode, "b");
});

test("preserves edge marker and line style aliases during normalization", () => {
  const data = normalizeCanvasData(
    {
      nodes: [
        { id: "a", type: "text" },
        { id: "b", type: "text" },
      ],
      edges: [
        {
          fromNode: "a",
          toNode: "b",
          fromArrow: "circle",
          endMarker: "diamond",
          strokeStyle: "short-dash",
          strokeWidth: "4",
        },
      ],
    },
    "Fallback",
  );

  assert.equal(data.edges[0]?.fromEnd, "circle");
  assert.equal(data.edges[0]?.toEnd, "diamond");
  assert.equal(data.edges[0]?.lineStyle, "short-dash");
  assert.equal(data.edges[0]?.width, 4);
});

test("normalizes supported Advanced Canvas node and group attributes", () => {
  const data = normalizeCanvasData(
    {
      nodes: [
        {
          id: "styled",
          type: "text",
          styleAttributes: {
            shape: "pill",
            border: "dashed",
            textAlign: "center",
          },
        },
        {
          id: "collapsed-group",
          type: "group",
          collapsed: true,
          styleAttributes: { border: "invisible" },
        },
      ],
      edges: [],
    },
    "Fallback",
  );

  assert.equal(data.nodes[0]?.shape, "pill");
  assert.equal(data.nodes[0]?.borderStyle, "dashed");
  assert.equal(data.nodes[0]?.textAlign, "center");
  assert.equal(data.nodes[0]?.advancedGroupCollapsed, undefined);
  assert.equal(data.nodes[1]?.shape, undefined);
  assert.equal(data.nodes[1]?.borderStyle, "invisible");
  assert.equal(data.nodes[1]?.advancedGroupCollapsed, true);
});

test("ignores unsupported Advanced Canvas style values", () => {
  const data = normalizeCanvasData(
    {
      nodes: [
        {
          id: "custom",
          type: "text",
          styleAttributes: {
            shape: "custom-cloud",
            border: "double",
            textAlign: "justify",
            validationState: "approved",
          },
        },
      ],
      edges: [],
    },
    "Fallback",
  );

  assert.equal(data.nodes[0]?.shape, undefined);
  assert.equal(data.nodes[0]?.borderStyle, undefined);
  assert.equal(data.nodes[0]?.textAlign, undefined);
});

test("uses the Advanced Canvas edge path style when no native alias is present", () => {
  const data = normalizeCanvasData(
    {
      nodes: [],
      edges: [
        {
          fromNode: "a",
          toNode: "b",
          styleAttributes: { path: "long-dashed" },
        },
      ],
    },
    "Fallback",
  );

  assert.equal(data.edges[0]?.lineStyle, "long-dashed");
});

test("ignores unsupported Advanced Canvas edge path styles", () => {
  const data = normalizeCanvasData(
    {
      nodes: [],
      edges: [
        {
          fromNode: "a",
          toNode: "b",
          styleAttributes: { path: "animated-rainbow" },
        },
      ],
    },
    "Fallback",
  );

  assert.equal(data.edges[0]?.lineStyle, undefined);
});

test("collects the numeric palette colors used by nodes, groups and edges", () => {
  const data = normalizeCanvasData(
    {
      nodes: [
        { id: "node", type: "text", color: "7" },
        { id: "group", type: "group", color: 12 },
        { id: "hex", type: "text", color: "#abcdef" },
      ],
      edges: [
        { fromNode: "node", toNode: "group", color: "7" },
        { fromNode: "group", toNode: "hex", color: "2" },
      ],
    },
    "Fallback",
  );

  assert.deepEqual(collectCanvasColorKeys(data), ["2", "7", "12"]);
});
