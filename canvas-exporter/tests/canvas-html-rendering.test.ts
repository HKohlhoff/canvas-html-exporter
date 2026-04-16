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
  showMinimap: true,
  showSearch: true,
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
  assert.match(html, /&#x3C;\?|&#x3C;<\/span><span[^>]*>\?/);
  assert.match(html, /meta name="canvas-exporter-build" content="0\.4\.0-[a-z]+"/);
});

await test("renders standalone markdown documents with wrapper and title", () => {
  const html = buildMarkdownDocumentHtml("Dokument", "<p>Inhalt</p>", true);
  assert.match(html, /<title>Dokument<\/title>/);
  assert.match(html, /<main class="md-page">/);
  assert.match(html, /<h1>Dokument<\/h1>/);
  assert.match(html, /<p>Inhalt<\/p>/);
  assert.match(html, /URLSearchParams\(window\.location\.search\)/);
  assert.match(html, /className = "search-highlight"/);
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

await test("renders minimap markup and viewport sync when enabled", async () => {
  const data: CanvasData = {
    name: "Mini",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
      { id: "b", type: "group", x: 320, y: 160, width: 260, height: 180, text: "Gruppe" },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /id="minimap-panel" class="minimap"/);
  assert.match(html, /id="minimap-drag-handle" class="minimap-header"/);
  assert.match(html, /id="minimap-toolbar-button" type="button" onclick="toggleMinimap\(\)"/);
  assert.doesNotMatch(html, />Navigation</);
  assert.match(html, /id="minimap-svg"/);
  assert.match(html, /id="minimap-viewport"/);
  assert.match(html, /function updateMinimapViewport\(\)/);
  assert.match(html, /function startMinimapDrag\(event\)/);
  assert.match(html, /function moveMinimap\(event\)/);
  assert.match(html, /function stopMinimapDrag\(event\)/);
  assert.match(html, /function applyMinimapPosition\(left, top\)/);
  assert.match(html, /function cubicPoint\(p0, p1, p2, p3, t\)/);
  assert.match(html, /function scrollViewportToCanvasPoint\(x, y, behavior\)/);
  assert.match(html, /function startMinimapPan\(event\)/);
  assert.match(html, /function moveMinimapPan\(event\)/);
  assert.match(html, /function stopMinimapPan\(event\)/);
  assert.match(html, /function syncViewportFromMinimap\(event, behavior\)/);
  assert.match(html, /function showMinimap\(\)/);
  assert.match(html, /function hideMinimap\(\)/);
  assert.match(html, /window\.toggleMinimap = function\(\)/);
  assert.match(html, /minimapDragHandle\.addEventListener\("pointerdown", startMinimapDrag\)/);
  assert.doesNotMatch(html, /minimapToolbarButton\.addEventListener\("click"/);
  assert.match(html, /minimapToolbarButton\.classList\.add\("is-active"\)/);
  assert.match(html, /searchToolbarButton\.classList\.add\("is-active"\)/);
  assert.match(html, /window\.addEventListener\("pointermove", moveMinimap/);
  assert.match(html, /minimapSvg\.addEventListener\("pointerdown", startMinimapPan\)/);
  assert.match(html, /minimapSvg\.addEventListener\("click", jumpViaMinimap\)/);
  assert.match(html, /viewport\.addEventListener\("scroll", updateMinimapViewport/);
  assert.doesNotMatch(html, /minimap-hide-button/);
  assert.doesNotMatch(html, /minimap-toggle-button/);
  assert.doesNotMatch(html, /@media print/);
});

await test("renders search overlay and toolbar button when enabled", async () => {
  const data: CanvasData = {
    name: "Suche",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 240, height: 120, text: "Alpha Beta Gamma" },
      { id: "b", type: "file", x: 280, y: 0, width: 280, height: 160, fileKind: "markdown", displayName: "Suche Notiz", previewText: "Enthaelt Beta und Delta", canvasHref: "assets/files/suche-notiz.html" },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /id="search-toolbar-button" type="button" onclick="openSearch\(\)"/);
  assert.match(html, /id="search-overlay" class="search-overlay" hidden/);
  assert.match(html, /id="search-input" class="search-input" type="search"/);
  assert.match(html, /id="search-results" class="search-results"/);
  assert.match(html, /function runSearch\(query\)/);
  assert.match(html, /function openSearch\(\)/);
  assert.match(html, /function closeSearch\(\)/);
  assert.match(html, /function focusNode\(nodeId\)/);
  assert.match(html, /function appendSearchQueryToHref\(href, query\)/);
  assert.match(html, /function updateActiveSearchResult\(\)/);
  assert.match(html, /function moveActiveSearchResult\(direction\)/);
  assert.match(html, /function activateCurrentSearchResult\(\)/);
  assert.match(html, /searchInput\.addEventListener\("keydown"/);
  assert.match(html, /searchInput\.addEventListener\("input"/);
  assert.match(html, /searchResults\.addEventListener\("click"/);
  assert.match(html, /searchResults\.addEventListener\("mousemove"/);
  assert.match(html, /Enter springt zum aktiven Treffer/);
  assert.match(html, /window\.openSearch = openSearch/);
  assert.match(html, /event\.key === "\/"/);
  assert.match(html, /"title":"Alpha Beta Gamma"/);
  assert.match(html, /"openHref":"assets\/files\/suche-notiz\.html"|\"openHref\":\"assets\/files\//);
  assert.match(html, /target="_blank" rel="noopener noreferrer" data-search-open="true"/);
  assert.match(html, /search-result-title-link/);
  assert.match(html, /"kindLabel":"Markdown"/);
});

await test("indexes visible markdown preview html instead of hidden raw preview text", async () => {
  const data: CanvasData = {
    name: "Suche Sichtbar",
    nodes: [
      {
        id: "md1",
        type: "file",
        x: 0,
        y: 0,
        width: 280,
        height: 160,
        fileKind: "markdown",
        displayName: "Teilansicht",
        canvasHref: "assets/files/teilansicht.html",
        previewHtml: "<p>Nur sichtbarer Abschnitt</p>",
        previewText: "Nur sichtbarer Abschnitt VersteckterSuchbegriff",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /"text":"Teilansicht Nur sichtbarer Abschnitt"/);
  assert.doesNotMatch(html, /VersteckterSuchbegriff/);
});

await test("omits minimap when disabled", async () => {
  const data: CanvasData = {
    name: "Ohne Mini",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, { ...baseOptions, showMinimap: false });
  assert.doesNotMatch(html, /class="minimap"/);
  assert.doesNotMatch(html, /id="minimap-svg"/);
});

await test("omits search ui when disabled", async () => {
  const data: CanvasData = {
    name: "Ohne Suche",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, { ...baseOptions, showSearch: false });
  assert.doesNotMatch(html, /id="search-toolbar-button"/);
  assert.doesNotMatch(html, /id="search-overlay"/);
  assert.doesNotMatch(html, /id="search-input"/);
});
})();
