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
