import assert from "node:assert/strict";
import { filterCanvasFoldState } from "../src/folding/export-state";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("filters imported folding IDs against the exported graph", () => {
  const filtered = filterCanvasFoldState(
    {
      hiddenEdgeIds: ["missing-edge", "edge-b", "edge-b", "edge-a"],
      hiddenNodeIds: ["missing-node", "node-b", "node-b", "node-a"],
      source: "persisted",
    },
    ["node-a", "node-b", "node-c"],
    ["edge-a", "edge-b"],
  );

  assert.deepEqual(filtered, {
    hiddenEdgeIds: ["edge-a", "edge-b"],
    hiddenNodeIds: ["node-a", "node-b"],
    source: "persisted",
  });
});
