import assert from "node:assert/strict";
import { buildMarkdownDocumentHtml, CanvasData, convertCanvasToHtml } from "../src/converter";

function test(name: string, fn: () => Promise<void> | void): Promise<void> | void {
  try {
    const result = fn();
    if (result && typeof (result as Promise<void>).then === "function") {
      return (result as Promise<void>).then(
        () => console.log(`PASS ${name}`),
        (error) => {
          console.error(`FAIL ${name}`);
          throw error;
        },
      );
    }
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

(async () => {
await test("renders markdown file nodes with title link and preview", async () => {
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

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="md-card"/);
  assert.match(html, /href="assets\/files\/notiz\.html"/);
  assert.match(html, /class="md-card-preview"><p>Vorschau<\/p>/);
});

await test("renders pdf nodes with viewer link and iframe", async () => {
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

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="node file pdf"/);
  assert.match(html, /class="pdf-title-link" href="assets\/files\/dokument-viewer\.html"/);
  assert.match(html, /<iframe src="assets\/files\/dokument\.pdf"/);
});

await test("renders canvas text nodes with markdown content", async () => {
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

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /<strong>starker<\/strong>/);
  assert.match(html, /class="node text"/);
});

await test("renders highlighted code blocks on the canvas page", async () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "code1",
        type: "text",
        x: 0,
        y: 0,
        width: 360,
        height: 220,
        text: "```php\n<?php echo 'hi';\n```",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="shiki/);
  assert.match(html, /style="color:#[0-9A-Fa-f]{6}/);
  assert.match(html, /&#x3C;/);
  assert.match(html, />\?</);
  assert.match(html, /meta name="canvas-exporter-build" content="0\.2\.0-shiki"/);
});

await test("renders standalone markdown documents with wrapper and title", () => {
  const html = buildMarkdownDocumentHtml("Dokument", "<p>Inhalt</p>", true);
  assert.match(html, /<title>Dokument<\/title>/);
  assert.match(html, /<main class="md-page">/);
  assert.match(html, /<p>Inhalt<\/p>/);
});

await test("escapes markdown document titles", () => {
  const html = buildMarkdownDocumentHtml('A & B <Test>', "<p>X</p>", false);
  assert.match(html, /<title>A &amp; B &lt;Test&gt;<\/title>/);
});

await test("renders link nodes with preview iframe and direct-open action", async () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "link1",
        type: "link",
        x: 0,
        y: 0,
        width: 220,
        height: 80,
        label: "OpenAI",
        url: "https://openai.com/?a=1&b=2",
        canvasHref: "assets/files/openai.html",
        displayName: "https://openai.com/?a=1&b=2",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="node link"/);
  assert.match(html, /class="link-preview-title" href="assets\/files\/openai\.html"/);
  assert.doesNotMatch(html, /link-preview-action/);
  assert.match(html, /<iframe src="https:\/\/openai\.com\/\?a=1&amp;b=2"/);
  assert.match(html, />https:\/\/openai\.com\/\?a=1&amp;b=2<\/a>/);
  assert.match(html, /Es besteht keine Internetverbindung\./);
  assert.match(html, /Diese Website erlaubt moeglicherweise keine Anzeige im eingebetteten Frame\. Nutze die Ueberschrift oben\./);
  assert.match(html, /function syncLinkOfflineState\(\)/);
  assert.match(html, /window\.setTimeout\(\(\) => \{/);
  assert.doesNotMatch(html, /class="link-meta"/);
});

await test("renders empty link nodes with fallback text", async () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "link-empty",
        type: "link",
        x: 0,
        y: 0,
        width: 200,
        height: 80,
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /Leerer Link-Knoten/);
});

await test("renders empty generic file nodes with fallback text", async () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "file-empty",
        type: "file",
        x: 0,
        y: 0,
        width: 220,
        height: 90,
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /Leerer Datei-Knoten/);
});

await test("injects custom canvas color variables into the document", async () => {
  const data: CanvasData = {
    name: "Farben",
    nodes: [
      {
        id: "color1",
        type: "text",
        x: 0,
        y: 0,
        width: 220,
        height: 100,
        text: "Farbtest",
        color: "4",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    canvasColors: { "4": "rgb(12, 34, 56)" },
  });

  assert.match(html, /--canvas-color-4: rgb\(12, 34, 56\);/);
  assert.match(html, /--canvas-color-4-bg: rgba\(12, 34, 56, 0\.18\);/);
  assert.match(html, /var\(--canvas-color-4-bg, /);
});

await test("renders default canvas bounds for empty canvases", async () => {
  const html = await convertCanvasToHtml({ name: "Leer", nodes: [], edges: [] }, baseOptions);
  assert.match(html, /id="canvas"/);
  assert.match(html, /width: 1200px;/);
  assert.match(html, /height: 800px;/);
});

await test("renders page header counts for nodes and edges", async () => {
  const data: CanvasData = {
    name: "Header",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
      { id: "b", type: "text", x: 260, y: 0, width: 200, height: 100, text: "B" },
    ],
    edges: [
      { fromNode: "a", toNode: "b", label: "verbindet" },
    ],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /<h1>Test Canvas<\/h1>/);
  assert.match(html, /2 Knoten · 1 Verbindungen/);
});

await test("renders edge marker and line style metadata into canvas script", async () => {
  const data: CanvasData = {
    name: "Edges",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
      { id: "b", type: "text", x: 260, y: 0, width: 200, height: 100, text: "B" },
    ],
    edges: [
      {
        fromNode: "a",
        fromSide: "right",
        fromEnd: "circle",
        toNode: "b",
        toSide: "left",
        toEnd: "diamond",
        color: "4",
        lineStyle: "dashed",
        width: 3,
        label: "styled",
      },
    ],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /"fromEnd":"circle"/);
  assert.match(html, /"toEnd":"diamond"/);
  assert.match(html, /"lineStyle":"dashed"/);
  assert.match(html, /"width":3/);
  assert.match(html, /function dashArrayFor\(style, width\)/);
  assert.match(html, /marker-start/);
  assert.match(html, /marker-end/);
});
})();
