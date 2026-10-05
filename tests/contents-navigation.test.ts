import assert from "node:assert/strict";
import { buildContentsNavigation, type ContentsCanvasDocument } from "../src/export/contents";

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
        { id: "child-a", type: "file", label: "First act", fileKind: "canvas", canvasSourcePath: "a.canvas", canvasHref: "canvas-a.html", x: 0, y: 0, width: 1, height: 1 },
        { id: "child-a-again", type: "file", fileKind: "canvas", canvasSourcePath: "a.canvas", canvasHref: "canvas-a.html", x: 0, y: 0, width: 1, height: 1 },
      ],
      edges: [],
    },
  },
  {
    sourcePath: "a.canvas",
    title: "Act I",
    href: "canvas-a.html",
    data: {
      nodes: [
        { id: "cycle", type: "file", fileKind: "canvas", canvasSourcePath: "root.canvas", canvasHref: "index.html", x: 0, y: 0, width: 1, height: 1 },
        { id: "note", type: "file", label: "Chapter 1", fileKind: "markdown", canvasHref: "assets/files/chapter-1.html", x: 0, y: 0, width: 1, height: 1 },
        { id: "note-copy", type: "file", label: "Chapter 1 duplicate", fileKind: "markdown", canvasHref: "assets/files/chapter-1.html", x: 0, y: 0, width: 1, height: 1 },
        { id: "pdf", type: "file", displayName: "Appendix.pdf", fileKind: "pdf", canvasHref: "assets/files/appendix.html", x: 0, y: 0, width: 1, height: 1 },
      ],
      edges: [],
    },
  },
];

test("builds a finite canvas tree and lists direct HTML pages once", () => {
  const contents = buildContentsNavigation(documents, "root.canvas", "a.canvas", "package");
  assert.equal(contents.canvases.length, 1);
  assert.equal(contents.canvases[0]?.title, "Overview");
  assert.equal(contents.canvases[0]?.children?.length, 1);
  assert.equal(contents.canvases[0]?.children?.[0]?.title, "First act");
  assert.equal(contents.canvases[0]?.children?.[0]?.current, true);
  assert.equal(contents.canvases[0]?.children?.[0]?.children, undefined);
  assert.deepEqual(contents.pages.map((page) => [page.title, page.kind]), [
    ["Chapter 1", "markdown"],
    ["Appendix.pdf", "pdf"],
  ]);
});

test("uses parent navigation for canvas links inside a single-html subcanvas", () => {
  const singleDocuments = documents.map((document) => ({
    ...document,
    href: document.sourcePath === "root.canvas" ? "#" : "#page-canvas-c1",
  }));
  const contents = buildContentsNavigation(singleDocuments, "root.canvas", "a.canvas", "single-html");
  assert.equal(contents.canvases[0]?.target, "_parent");
  assert.equal(contents.canvases[0]?.children?.[0]?.target, "_parent");
  assert.equal(contents.pages[0]?.target, undefined);
});
