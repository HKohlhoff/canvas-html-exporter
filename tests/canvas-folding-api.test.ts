import assert from "node:assert/strict";
import {
  CANVAS_FOLDING_PLUGIN_ID,
  findCanvasFoldingApi,
  loadCanvasFoldState,
  resolveInitialCanvasFoldState,
} from "../src/integrations/canvas-folding";

async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

function appWithPlugin(plugin: unknown): never {
  return {
    plugins: {
      getPlugin(id: string): unknown {
        return id === CANVAS_FOLDING_PLUGIN_ID ? plugin : null;
      },
    },
  } as never;
}

async function main(): Promise<void> {
  await test("returns null when Canvas Folding is unavailable", async () => {
    assert.equal(findCanvasFoldingApi({} as never), null);
    assert.equal(await loadCanvasFoldState({} as never, "Tree.canvas"), null);
  });

  await test("rejects incompatible or incomplete APIs", () => {
    assert.equal(findCanvasFoldingApi(appWithPlugin({ api: { apiVersion: 2, getFoldState() {} } })), null);
    assert.equal(findCanvasFoldingApi(appWithPlugin({ api: { apiVersion: 1 } })), null);
  });

  await test("loads and deterministically normalizes an API v1 snapshot", async () => {
    const app = appWithPlugin({
      api: {
        apiVersion: 1,
        async getFoldState(canvasPath: string) {
          return {
            canvasPath,
            hiddenEdgeIds: ["edge-b", "edge-a", "edge-b"],
            hiddenNodeIds: ["node-b", "node-a", "node-b"],
            source: "active-leaf",
          };
        },
      },
    });

    assert.deepEqual(await loadCanvasFoldState(app, "Tree.canvas"), {
      hiddenEdgeIds: ["edge-a", "edge-b"],
      hiddenNodeIds: ["node-a", "node-b"],
      source: "active-leaf",
    });
  });

  await test("does not query Canvas Folding without explicit opt-in", async () => {
    let calls = 0;
    const app = appWithPlugin({
      api: {
        apiVersion: 1,
        async getFoldState() {
          calls += 1;
          return null;
        },
      },
    });

    assert.equal(await resolveInitialCanvasFoldState(app, "Tree.canvas", "none"), null);
    assert.equal(await resolveInitialCanvasFoldState(app, "Tree.canvas", "expanded"), null);
    assert.equal(calls, 0);
    assert.equal(await resolveInitialCanvasFoldState(app, "Tree.canvas", "current"), null);
    assert.equal(calls, 1);
  });

  await test("falls back to null for failures and malformed snapshots", async () => {
    const failing = appWithPlugin({
      api: {
        apiVersion: 1,
        async getFoldState() {
          throw new Error("unavailable");
        },
      },
    });
    const wrongCanvas = appWithPlugin({
      api: {
        apiVersion: 1,
        async getFoldState() {
          return {
            canvasPath: "Other.canvas",
            hiddenEdgeIds: [],
            hiddenNodeIds: [],
            source: "persisted",
          };
        },
      },
    });

    assert.equal(await loadCanvasFoldState(failing, "Tree.canvas"), null);
    assert.equal(await loadCanvasFoldState(wrongCanvas, "Tree.canvas"), null);
  });

  await test("falls back to null when plugin discovery itself fails", async () => {
    const app = {
      plugins: {
        getPlugin() {
          throw new Error("plugin manager unavailable");
        },
      },
    } as never;

    assert.equal(await loadCanvasFoldState(app, "Tree.canvas"), null);
  });
}

void main().catch(() => {
  process.exitCode = 1;
});
