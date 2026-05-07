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

await test("keeps inline markdown styling visible in markdown file previews", async () => {
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
        previewHtml: "<p><strong>Fett</strong>, <em>kursiv</em> und <del>weg</del></p>",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    inlineStyleColors: {
      strong: "rgb(210, 80, 90)",
      em: "rgb(90, 130, 210)",
      del: "rgb(120, 120, 120)",
    },
  });

  assert.match(html, /class="md-card-preview"><p><strong>Fett<\/strong>, <em>kursiv<\/em> und <del>weg<\/del><\/p>/);
  assert.match(html, /\.md-card-preview strong \{ font-weight: 700; color: rgb\(210, 80, 90\); \}/);
  assert.match(html, /\.md-card-preview em \{ font-style: italic; color: rgb\(90, 130, 210\); \}/);
  assert.match(html, /\.md-card-preview del \{ text-decoration: line-through; color: rgb\(120, 120, 120\); \}/);
});

await test("renders single html canvas links with the embedded page id", async () => {
  const data: CanvasData = {
    name: "Single",
    nodes: [
      {
        id: "md-single",
        type: "file",
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        fileKind: "markdown",
        displayName: "Single note",
        canvasHref: "#page-p7",
        previewHtml: "<p>Preview</p>",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    exportFormat: "single-html",
    embeddedPages: [{ id: "p7", title: "Single note", kind: "markdown", bodyHtml: "<article>Body</article>" }],
  });

  assert.match(html, /href="#page-p7" data-inline-page="p7"/);
  assert.match(html, /id="single-page-canvas-link" class="single-page-canvas-link" href="#"/);
  assert.doesNotMatch(html, /window\.open\(/);
});

await test("keeps single html page anchors separate from the embedded page id", async () => {
  const data: CanvasData = {
    name: "Single",
    nodes: [
      {
        id: "md-single",
        type: "file",
        x: 0,
        y: 0,
        width: 320,
        height: 180,
        fileKind: "markdown",
        displayName: "Single note",
        canvasHref: "#page-p7#abschnitt",
        previewHtml: "<p>Preview</p>",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    exportFormat: "single-html",
    embeddedPages: [{ id: "p7", title: "Single note", kind: "markdown", bodyHtml: "<article><h2 id=\"abschnitt\">Abschnitt</h2></article>" }],
  });

  assert.match(html, /href="#page-p7#abschnitt" data-inline-page="p7"/);
  assert.match(html, /const value = decodeHashComponent\(String\(hash \|\| ""\)\.replace\(\/\^#\/, ""\)\);/);
  assert.match(html, /const \[pageRef\] = value\.split\(\/\[\?#\]\//);
  assert.match(html, /const anchor = parsePageAnchorHash\(window\.location\.hash\);/);
  assert.match(html, /\.single-page-body \.target-highlight \{/);
  assert.match(html, /singlePageBody\.querySelector\('\[id="' \+ escapedAnchor \+ '"\]'\)/);
  assert.match(html, /const highlightTarget = target\.closest\("details\.heading-section"\) \|\| target;/);
  assert.match(html, /highlightTarget\.classList\.add\("target-highlight"\)/);
  assert.match(html, /target\.scrollIntoView\(\{ block: "start", behavior: "auto" \}\)/);
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

await test("renders media file nodes with browser controls", async () => {
  const data: CanvasData = {
    name: "Media",
    nodes: [
      {
        id: "audio1",
        type: "file",
        x: 0,
        y: 0,
        width: 320,
        height: 42,
        fileKind: "audio",
        displayName: "sound.mp3",
        exportPath: "assets/files/sound.mp3",
      },
      {
        id: "video1",
        type: "file",
        x: 360,
        y: 0,
        width: 360,
        height: 220,
        fileKind: "video",
        displayName: "clip.mov",
        exportPath: "assets/files/clip.mov",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="node file audio"/);
  assert.match(html, /class="node file video"/);
  assert.match(html, /height:86px/);
  assert.match(html, /class="media-embed audio-embed"/);
  assert.match(html, /<a class="media-title-link" href="assets\/files\/sound\.mp3">sound\.mp3<\/a>/);
  assert.match(html, /<audio src="assets\/files\/sound\.mp3" title="sound\.mp3" controls preload="metadata"><\/audio>/);
  assert.match(html, /class="media-embed video-embed"/);
  assert.match(html, /<a class="media-title-link" href="assets\/files\/clip\.mov">clip\.mov<\/a>/);
  assert.match(html, /<video src="assets\/files\/clip\.mov" title="clip\.mov" controls preload="metadata"><\/video>/);
});

await test("infers media controls for direct file nodes from their paths", async () => {
  const data: CanvasData = {
    name: "Media",
    nodes: [
      {
        id: "audio1",
        type: "file",
        x: 0,
        y: 0,
        width: 320,
        height: 42,
        displayName: "sound.mp3",
        exportPath: "assets/files/sound.mp3",
      },
      {
        id: "video1",
        type: "file",
        x: 360,
        y: 0,
        width: 360,
        height: 220,
        file: "media/clip.mov",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /class="node file audio"/);
  assert.match(html, /class="node file video"/);
  assert.match(html, /height:86px/);
  assert.match(html, /<a class="media-title-link" href="assets\/files\/sound\.mp3">sound\.mp3<\/a>/);
  assert.match(html, /<audio src="assets\/files\/sound\.mp3" title="sound\.mp3" controls preload="metadata"><\/audio>/);
  assert.match(html, /<a class="media-title-link" href="media\/clip\.mov">media\/clip\.mov<\/a>/);
  assert.match(html, /<video src="media\/clip\.mov" title="media\/clip\.mov" controls preload="metadata"><\/video>/);
  assert.doesNotMatch(html, /class="file-chip" href="assets\/files\/sound\.mp3"/);
  assert.doesNotMatch(html, /class="file-chip" href="media\/clip\.mov"/);
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

await test("ends plus-list text nodes before following plain lines", async () => {
  const data: CanvasData = {
    name: "Test",
    nodes: [
      {
        id: "text-list",
        type: "text",
        x: 0,
        y: 0,
        width: 420,
        height: 220,
        text: "Different types of media can be included directly in the canvas:\n+ images (png, jpeg,...)\n+ pdf-files\n+ sound-files (wav, mp3)\n+ videos\nBy clicking on the image, file,... it opens in a new browser-tab or -window.",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /<ul><li>images \(png, jpeg,\.\.\.\)<\/li><li>pdf-files<\/li><li>sound-files \(wav, mp3\)<\/li><li>videos<\/li><\/ul>\n<p>By clicking on the image, file,\.\.\. it opens in a new browser-tab or -window\.<\/p>/);
  assert.match(html, /\.node-content ul, \.node-content ol \{ margin: 0\.45em 0; padding-left: 2em; \}/);
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
  assert.match(html, /meta name="canvas2html-build" content="[0-9]+\.[0-9]+\.[0-9]+-[a-z]+"/);
});

await test("renders standalone markdown documents with wrapper and title", () => {
  const html = buildMarkdownDocumentHtml("Dokument", "<p>Inhalt</p>", true);
  assert.match(html, /<title>Dokument<\/title>/);
  assert.match(html, /<main class="md-page">/);
  assert.match(html, /<h1>Dokument<\/h1>/);
  assert.match(html, /<p>Inhalt<\/p>/);
  assert.match(html, /ul, ol \{ margin: 0\.65em 0; padding-left: 2em; \}/);
  assert.match(html, /table \{ border-collapse: collapse; width: auto; max-width: 100%; margin: 0\.8em 0; \}/);
  assert.match(html, /URLSearchParams\(window\.location\.search\)/);
  assert.match(html, /className = "search-highlight"/);
  assert.match(html, /:target,\n    \.target-highlight \{/);
  assert.match(html, /const highlightTarget = target\.closest\("details\.heading-section"\) \|\| target;/);
  assert.match(html, /highlightTarget\.classList\.add\("target-highlight"\)/);
});

await test("applies exported heading colors to markdown views", async () => {
  const html = await convertCanvasToHtml(
    {
      name: "Headings",
      nodes: [
        {
          id: "text-headings",
          type: "text",
          x: 0,
          y: 0,
          width: 280,
          height: 160,
          text: "# Titel\n## Abschnitt\n##### Fein\n###### Mini",
        },
        {
          id: "md-headings",
          type: "file",
          x: 320,
          y: 0,
          width: 320,
          height: 180,
          fileKind: "markdown",
          displayName: "Notiz",
          canvasHref: "#page-p1",
          previewHtml: "<h3>Preview</h3>",
        },
      ],
      edges: [],
    },
    {
      ...baseOptions,
      exportFormat: "single-html",
      embeddedPages: [{ id: "p1", title: "Notiz", kind: "markdown", bodyHtml: "<article><h4>Seite</h4></article>" }],
      headingColors: {
        h1: "rgb(220, 10, 20)",
        h2: "#224466",
        h3: "rgba(12, 34, 56, 0.8)",
        h4: "rgb(90, 100, 110)",
        h5: "#abcdef",
        h6: "#fedcba",
      },
    },
  );

  assert.match(html, /\.node-content h1 \{ color: rgb\(220, 10, 20\); \}/);
  assert.match(html, /\.node-content h2 \{ color: #224466; \}/);
  assert.match(html, /\.node-content h5 \{ color: #abcdef; \}/);
  assert.match(html, /\.node-content h6 \{ color: #fedcba; \}/);
  assert.match(html, /\.single-page-body h4 \{ color: rgb\(90, 100, 110\); \}/);
  assert.match(html, /\.single-page-body ul, \.single-page-body ol \{ margin: 0\.65em 0; padding-left: 2em; \}/);
  assert.match(html, /\.single-page-body table \{ border-collapse: collapse; width: auto; max-width: 100%; margin: 0\.8em 0; \}/);
  assert.match(html, /\.md-card-preview h3 \{ color: rgba\(12, 34, 56, 0\.8\); \}/);
  assert.match(html, /<details class="heading-section heading-section-h1" open><summary class="heading-summary"><h1 id="titel">Titel<\/h1><\/summary>/);
  assert.match(html, /<details class="heading-section heading-section-h6" open><summary class="heading-summary"><h6 id="mini">Mini<\/h6><\/summary>/);
  assert.match(html, /\.node-content details\.heading-section > summary\.heading-summary \{\s+position: relative;/);
  assert.match(html, /\.node-content details\.heading-section > summary\.heading-summary::before \{ content: "⌄"; position: absolute; left: -1em; top: 50%; transform: translateY\(-50%\); line-height: 1; color: #[0-9a-f]+; font-weight: 600; opacity: 0; transition: opacity 0\.12s ease; \}/);
  assert.match(html, /\.node-content details\.heading-section > summary\.heading-summary:hover::before,/);
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
  assert.match(html, /No internet connection is available\./);
  assert.match(html, /This website may not allow embedded previews\. Use the heading above\./);
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
  assert.match(html, /Empty link node/);
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
  assert.match(html, /Empty file node/);
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

await test("applies canvas colors to group nodes", async () => {
  const data: CanvasData = {
    name: "Colored Group",
    nodes: [
      {
        id: "group-color-1",
        type: "group",
        x: 0,
        y: 0,
        width: 260,
        height: 180,
        text: "Group",
        color: "4",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    canvasColors: { "4": "rgb(12, 34, 56)" },
  });

  assert.match(html, /background:var\(--canvas-color-4-bg, #56ae6c22\);border-color:var\(--canvas-color-4, #56ae6c\);--node-border-color:var\(--canvas-color-4, #56ae6c\);/);
  assert.match(html, /<div class="group-title">Group<\/div><div class="node-content"><\/div>/);
  assert.match(html, /\.group-title \{[\s\S]*color: var\(--node-border-color\);/);
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
  assert.match(html, /2 nodes · 1 connections/);
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
  assert.match(html, /id="minimap-panel" class="minimap" aria-label="Canvas-Minimap" hidden/);
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
  assert.match(html, /Press Enter to jump to the active result/);
  assert.match(html, /window\.openSearch = openSearch/);
  assert.match(html, /event\.key === "\/"/);
  assert.match(html, /"title":"Alpha Beta Gamma"/);
  assert.match(html, /"openHref":"assets\/files\/suche-notiz\.html"|\"openHref\":\"assets\/files\//);
  assert.match(html, /data-search-open="true"/);
  assert.match(html, /search-result-title-link/);
  assert.match(html, /href="' \+ escapeHtml\(appendSearchQueryToHref\(href, query\)\) \+ '"/);
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
