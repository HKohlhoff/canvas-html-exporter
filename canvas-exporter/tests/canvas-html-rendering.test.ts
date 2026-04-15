import assert from "node:assert/strict";
import { CanvasData, convertCanvasToHtml } from "../src/converter";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const baseOptions = {
  darkMode: true,
  title: "Test Canvas",
};

test("renders markdown file nodes with title link and preview", () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "md1",
        type: "file",
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        fileKind: "markdown",
        displayName: "Notiz",
        canvasHref: "assets/files/notiz.html",
        previewHtml: "<p>Vorschau</p>",
      },
    ],
    edges: [],
  };

  const html = convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="md-card"/);
  assert.match(html, /href="assets\/files\/notiz\.html"/);
  assert.match(html, /class="md-card-preview"><p>Vorschau<\/p>/);
});

test("renders pdf nodes with viewer link and iframe", () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "pdf1",
        type: "file",
        x: 10,
        y: 20,
        width: 400,
        height: 260,
        fileKind: "pdf",
        displayName: "Dokument",
        exportPath: "assets/files/dokument.pdf",
        canvasHref: "assets/files/dokument-viewer.html",
      },
    ],
    edges: [],
  };

  const html = convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="node pdf"/);
  assert.match(html, /class="pdf-title-link" href="assets\/files\/dokument-viewer\.html"/);
  assert.match(html, /<iframe src="assets\/files\/dokument\.pdf"/);
});

test("renders canvas text nodes with markdown content", () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "text1",
        type: "text",
        x: 0,
        y: 0,
        width: 240,
        height: 120,
        text: "Ein **starker** Text",
      },
    ],
    edges: [],
  };

  const html = convertCanvasToHtml(data, baseOptions);
  assert.match(html, /<strong>starker<\/strong>/);
  assert.match(html, /class="node"/);
});
