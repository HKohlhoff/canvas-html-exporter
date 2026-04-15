import assert from "node:assert/strict";
import { normalizeCanvasData, shouldRewriteInternalTarget } from "../src/exporter-helpers";

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
