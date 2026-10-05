import assert from "node:assert/strict";
import { buildDescendantSearchEntries } from "../src/export/search-index";
import type { ContentsCanvasDocument } from "../src/export/contents";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const documents: ContentsCanvasDocument[] = [
  {
    sourcePath: "root.canvas",
    title: "Overview",
    href: "index.html",
    data: {
      nodes: [
        { id: "child", type: "file", fileKind: "canvas", canvasSourcePath: "child.canvas", x: 0, y: 0, width: 1, height: 1 },
      ],
      edges: [],
    },
  },
  {
    sourcePath: "child.canvas",
    title: "Child",
    href: "canvas-child.html",
    data: {
      nodes: [
        { id: "note", type: "file", fileKind: "markdown", displayName: "Note", previewText: "Visible", searchText: "Hidden full-page term", x: 0, y: 0, width: 1, height: 1 },
        { id: "grand", type: "file", fileKind: "canvas", canvasSourcePath: "grand.canvas", x: 2, y: 0, width: 1, height: 1 },
      ],
      edges: [],
    },
  },
  {
    sourcePath: "grand.canvas",
    title: "Grand",
    href: "canvas-grand.html",
    data: {
      nodes: [
        { id: "cycle", type: "file", fileKind: "canvas", canvasSourcePath: "child.canvas", x: 0, y: 0, width: 1, height: 1 },
        { id: "deep", type: "text", text: "Deep result", x: 2, y: 0, width: 1, height: 1 },
      ],
      edges: [],
    },
  },
];

test("indexes every reachable descendant canvas once", () => {
  const entries = buildDescendantSearchEntries(documents, "root.canvas", "root.canvas", "package");
  assert.equal(entries.length, 2);
  assert.ok(entries.some((entry) => entry.text.includes("Hidden full page term")));
  assert.ok(entries.some((entry) => entry.text.includes("Deep result")));
  assert.ok(entries.every((entry) => entry.focusNodeId === undefined));
  assert.ok(entries.some((entry) => entry.openNodeId === "note"));
  assert.ok(entries.some((entry) => entry.openNodeId === "deep"));
  assert.ok(entries.some((entry) => entry.openHref === "canvas-child.html" && entry.positionLabel === "Child"));
  assert.ok(entries.some((entry) => entry.openHref === "canvas-grand.html" && entry.positionLabel === "Grand"));
});

test("targets the parent document from a single-html subcanvas", () => {
  const singleDocuments = documents.map((document) => ({
    ...document,
    href: document.sourcePath === "root.canvas" ? "#" : `#page-${document.title.toLowerCase()}`,
  }));
  const rootEntries = buildDescendantSearchEntries(singleDocuments, "root.canvas", "root.canvas", "single-html");
  const childEntries = buildDescendantSearchEntries(singleDocuments, "root.canvas", "child.canvas", "single-html");
  assert.ok(rootEntries.every((entry) => entry.openTarget === undefined));
  assert.ok(childEntries.every((entry) => entry.openTarget === "_parent"));
  assert.ok(childEntries.every((entry) => entry.openHref === "#page-grand"));
});
