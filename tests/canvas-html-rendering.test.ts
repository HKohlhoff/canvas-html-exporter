import assert from "node:assert/strict";
import vm from "node:vm";
import { buildMarkdownDocumentHtml, CanvasData, convertCanvasToHtml } from "../src/converter";

function test(name: string, fn: () => Promise<void> | void): Promise<void> | void {
  try {
    const result = fn();
    if (result) {
      return result.then(
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
  foldingInitiallyEnabled: true,
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
  assert.match(html, /meta name="canvas-html-exporter-build" content="[0-9]+\.[0-9]+\.[0-9]+-[a-z]+"/);
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
  assert.match(html, /:target,\n {4}\.target-highlight \{/);
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

await test("preserves Obsidian 1.13 OKLCH theme colors", async () => {
  const data: CanvasData = {
    name: "Modern colors",
    nodes: [
      {
        id: "color-oklch",
        type: "text",
        x: 0,
        y: 0,
        width: 220,
        height: 100,
        text: "# Modern color\n> [!note] Callout",
        color: "4",
      },
    ],
    edges: [],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    canvasColors: { "4": "oklch(62% 0.2 145)" },
    calloutColors: { note: "oklch(70% 0.16 245)" },
    headingColors: { h1: "oklch(65% 0.18 25)" },
  });

  assert.match(html, /--canvas-color-4: oklch\(62% 0\.2 145\);/);
  assert.match(html, /--canvas-color-4-bg: color-mix\(in srgb, oklch\(62% 0\.2 145\) 18%, transparent\);/);
  assert.match(html, /\.callout-note \{ border-color: oklch\(70% 0\.16 245\); \}/);
  assert.match(html, /background: color-mix\(in srgb, oklch\(70% 0\.16 245\) 18%, transparent\);/);
  assert.match(html, /\.node-content h1 \{ color: oklch\(65% 0\.18 25\); \}/);
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

  assert.match(html, /background:var\(--canvas-color-4-bg, #56ae6c22\);border-color:var\(--canvas-color-4, #56ae6c\);--node-background-color:var\(--canvas-color-4-bg, #56ae6c22\);--node-border-color:var\(--canvas-color-4, #56ae6c\);/);
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
      { id: "group", type: "group", x: -20, y: -20, width: 500, height: 140, label: "Group" },
    ],
    edges: [
      { fromNode: "a", toNode: "b", label: "verbindet" },
    ],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /<h1>Test Canvas<\/h1>/);
  assert.match(html, /2 nodes · 1 group · 1 connection/);
  assert.match(html, /<span id="hidden-node-summary" hidden><\/span>/);
  assert.match(html, /const groupNodeIds = new Set\(\["group"\]\)/);
  assert.match(html, /const hiddenGroupCount = \[\.\.\.hiddenNodeIds\]/);
  assert.match(html, /const hiddenNodeCount = hiddenNodeIds\.size - hiddenGroupCount/);
  assert.match(html, /"1 hidden node"/);
  assert.match(html, /hiddenNodeCount \+ " hidden nodes"/);
  assert.match(html, /"1 hidden group"/);
  assert.match(html, /hiddenGroupCount \+ " hidden groups"/);
  assert.match(html, /hiddenNodeSummary\.hidden = hiddenParts\.length === 0/);
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

await test("renders the Advanced Canvas long-dashed edge path", async () => {
  const data: CanvasData = {
    name: "Advanced edge",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
      { id: "b", type: "text", x: 260, y: 0, width: 200, height: 100, text: "B" },
    ],
    edges: [
      {
        fromNode: "a",
        toNode: "b",
        lineStyle: "long-dashed",
      },
    ],
  };

  const html = await convertCanvasToHtml(data, baseOptions);
  assert.match(html, /"lineStyle":"long-dash"/);
  assert.match(html, /style === "long-dash"/);
});

await test("renders Advanced Canvas palette colors for nodes, groups and edges", async () => {
  const data: CanvasData = {
    name: "Advanced colors",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A", color: "7" },
      { id: "group", type: "group", x: 240, y: -20, width: 260, height: 160, label: "Group", color: "8" },
    ],
    edges: [
      { fromNode: "a", toNode: "group", color: "9" },
    ],
  };

  const html = await convertCanvasToHtml(data, {
    ...baseOptions,
    canvasColors: {
      "7": "rgb(10, 20, 30)",
      "8": "#abcdef",
      "9": "oklch(62% 0.2 25)",
    },
  });

  assert.match(html, /--canvas-color-7: rgb\(10, 20, 30\)/);
  assert.match(html, /--canvas-color-8: #abcdef/);
  assert.match(html, /"9":"oklch\(62% 0.2 25\)"/);
  assert.match(html, /resolveEdgeColor\(edge\.color\)/);
});

await test("rejects unsafe Advanced Canvas palette values", async () => {
  const unsafeColor = "red; } </style><script>window.injected = true</script>";
  const html = await convertCanvasToHtml(
    {
      name: "Unsafe Advanced colors",
      nodes: [
        { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A", color: "7" },
      ],
      edges: [],
    },
    {
      ...baseOptions,
      canvasColors: { "7": unsafeColor },
    },
  );

  assert.doesNotMatch(html, /window\.injected/);
  assert.doesNotMatch(html, /--canvas-color-7:/);
});

await test("renders all built-in Advanced Canvas node styles in both export modes", async () => {
  const shapes = [
    "pill",
    "diamond",
    "parallelogram",
    "circle",
    "predefined-process",
    "document",
    "database",
  ] as const;
  const data: CanvasData = {
    name: "Advanced styles",
    nodes: [
      ...shapes.map((shape, index) => ({
        id: shape,
        type: "text",
        x: index * 240,
        y: 0,
        width: 200,
        height: 120,
        text: shape,
        shape,
      })),
      {
        id: "bordered",
        type: "text",
        x: 0,
        y: 180,
        width: 200,
        height: 100,
        text: "Bordered",
        borderStyle: "dotted",
        textAlign: "right",
      },
      {
        id: "invisible",
        type: "text",
        x: 240,
        y: 180,
        width: 200,
        height: 100,
        text: "Invisible",
        borderStyle: "invisible",
        textAlign: "center",
      },
    ],
    edges: [],
  };

  for (const exportFormat of ["package", "single-html"] as const) {
    const html = await convertCanvasToHtml(data, { ...baseOptions, exportFormat });
    for (const shape of shapes) {
      assert.match(html, new RegExp(`data-node-shape="${shape}"`));
    }
    assert.match(html, /data-node-border="dotted"/);
    assert.match(html, /data-node-border="invisible"/);
    assert.match(html, /data-node-text-align="right"/);
    assert.match(html, /data-node-text-align="center"/);
    assert.match(html, /\.node\[data-node-shape="diamond"\]/);
    assert.match(html, /\.node\[data-node-shape="database"\]/);
    assert.match(
      html,
      /\.node\[data-node-shape="database"\]::before,\s+\.node\[data-node-shape="database"\]::after \{[^}]*z-index: 0;/,
    );
    assert.match(html, /> :not\(\.node-controls\)/);
    assert.match(html, /\.node\[data-node-border="invisible"\]/);
    assert.match(html, /\.node\[data-node-text-align="center"\]/);
    assert.match(html, /<polygon class="minimap-node"[^>]+data-node-id="diamond"/);
    assert.match(html, /<ellipse class="minimap-node"[^>]+data-node-id="circle"/);
  }
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
  assert.match(html, /id="minimap-panel" class="minimap" aria-label="Canvas minimap" hidden/);
  assert.match(html, /id="minimap-drag-handle" class="minimap-header"/);
  assert.match(html, /id="minimap-toolbar-button" type="button" onclick="toggleMinimap\(\)"/);
  assert.match(html, /#canvas-shell \{\s+display: flex;\s+flex-direction: column;\s+height: 100vh;\s+height: 100dvh;\s+min-height: 0;/);
  assert.match(html, /#canvas-shell\[hidden\] \{\s+display: none;/);
  assert.match(html, /\.viewport \{\s+overflow: auto;\s+padding: 16px 24px 28px;\s+flex: 1 1 auto;\s+min-height: 0;/);
  assert.doesNotMatch(html, /height: calc\(100vh - 132px\)/);
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
  assert.match(html, /const canvasRect = canvas\.getBoundingClientRect\(\);\s+const viewportRect = viewport\.getBoundingClientRect\(\);\s+const canvasLeft = canvasRect\.left - viewportRect\.left \+ viewport\.scrollLeft;/);
  assert.match(html, /const canvasTop = canvasRect\.top - viewportRect\.top \+ viewport\.scrollTop;/);
  assert.doesNotMatch(html, /canvas\.offsetTop \+ y \* currentScale/);
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

await test("applies an imported Canvas Folding state in both export modes", async () => {
  const data: CanvasData = {
    name: "Folding",
    nodes: [
      { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
      { id: "b", type: "text", x: 300, y: 0, width: 200, height: 100, text: "B" },
    ],
    edges: [
      { id: "edge-ab", fromNode: "a", toNode: "b", label: "child" },
    ],
  };

  for (const exportFormat of ["package", "single-html"] as const) {
    const html = await convertCanvasToHtml(data, {
      ...baseOptions,
      exportFormat,
      initialFoldState: {
        hiddenEdgeIds: ["edge-ab"],
        hiddenNodeIds: ["b"],
        source: "active-leaf",
      },
    });

    assert.match(html, /id="folding-menu" class="toolbar-menu"><summary>Folding<\/summary><div class="toolbar-menu-content">/);
    assert.match(html, /\.toolbar-menu > summary \{[\s\S]*font: inherit;\s+font-size: 0\.875rem;/);
    assert.match(html, /id="folding-expand-all-button"[^>]+onclick="expandAllBranches\(\)"[^>]*>Expand all<\/button>/);
    assert.match(html, /id="folding-mode-button"[^>]+onclick="toggleFoldingMode\(\)"[^>]*>No folding<\/button>/);
    assert.match(html, /id="folding-collapse-all-button"[^>]+onclick="collapseAllBranches\(\)"[^>]*>Collapse all<\/button>/);
    assert.match(html, /id="folding-level-select"[^>]+onchange="setVisibleLevel\(this\.value\)"/);
    assert.match(html, /<option value="all">All levels<\/option><option value="0">Level 0<\/option><option value="1">Level 1<\/option>/);
    assert.match(html, /id="folding-toolbar-button"[^>]+onclick="restoreImportedFolding\(\)"[^>]*>Restore folding<\/button>/);
    assert.doesNotMatch(html, /foldingToolbarButton\.hidden/);
    assert.match(html, /id="node-b"[\s\S]+data-node-id="b"/);
    assert.match(html, /class="minimap-node" data-node-id="b"/);
    assert.match(html, /const importedHiddenNodeIds = new Set\(\["b"\]\)/);
    assert.match(html, /const importedHiddenEdgeIds = new Set\(\["edge-ab"\]\)/);
    assert.match(html, /hiddenEdgeIds\.has\(edge\.id\)/);
    assert.match(html, /hiddenNodeIds\.has\(edge\.fromId\)/);
    assert.match(html, /hiddenNodeIds\.has\(edge\.toId\)/);
    assert.match(html, /function applyImportedFolding\(applied\)/);
    assert.match(html, /workingImportedHiddenNodeIds\.delete\(descendantId\)/);
    assert.match(html, /function branchHasHiddenContent\(nodeId, descendants\)/);
    assert.match(html, /control\.hidden = !foldingControlsEnabled \|\| !foldingNodeControlsVisible/);
    assert.doesNotMatch(html, /if \(importedFoldingApplied \|\| descendants\.length === 0\) return/);
    assert.match(html, /window\.expandAllBranches = function\(\)/);
    assert.match(html, /window\.collapseAllBranches = function\(\)/);
    assert.match(html, /window\.setVisibleLevel = function\(value\)/);
    assert.match(html, /window\.restoreImportedFolding = function\(\)/);
    assert.match(html, /applyImportedFolding\(true\)/);
    assert.match(html, /if \(hiddenNodeIds\.has\(nodeId\)\) \{\s+if \(focusedBranchNodeId !== null\)[\s\S]+if \(hiddenNodeIds\.has\(nodeId\)\) expandAllBranches\(\)/);
    assert.match(html, /\.node\.is-folding-hidden \{\s+display: none;/);
    assert.match(html, /\.minimap-node\.is-folding-hidden \{\s+display: none;/);
    const runtime = html.match(/<script>([\s\S]+)<\/script>/)?.[1] || "";
    assert.ok(runtime);
    assert.doesNotThrow(() => new vm.Script(runtime));
  }
});

await test("renders node focus for an isolated node in both export modes", async () => {
  for (const exportFormat of ["package", "single-html"] as const) {
    const html = await convertCanvasToHtml(
      {
        name: "Expanded",
        nodes: [
          { id: "group", type: "group", x: -100, y: -100, width: 400, height: 300, label: "Area" },
          { id: "a", type: "text", x: 0, y: 0, width: 200, height: 100, text: "A" },
        ],
        edges: [],
      },
      { ...baseOptions, exportFormat },
    );

    assert.match(html, /id="folding-toolbar-button"/);
    assert.match(html, /id="folding-mode-button"/);
    assert.match(html, /data-focus-node-id="a"[^>]+aria-label="Focus node"[^>]+title="Focus node"><svg class="branch-focus-icon"/);
    assert.match(html, /data-focus-node-id="group"[^>]+aria-label="Focus group"[^>]+title="Focus group"><svg class="branch-focus-icon"/);
    assert.doesNotMatch(html, /data-branch-node-id="a"/);
    assert.doesNotMatch(html, /hiddenNodeIds\.delete\(groupId\)/);
    assert.match(html, /Object\.prototype\.hasOwnProperty\.call\(foldingGraph\.childrenByNode, nodeId\)/);
    assert.match(html, /applyImportedFolding\(false\)/);
  }
});

await test("starts in no-folding mode while retaining the menu and controls", async () => {
  const data: CanvasData = {
    name: "No folding",
    nodes: [
      { id: "root", type: "text", x: 0, y: 0, width: 200, height: 100, text: "Root" },
      { id: "leaf", type: "text", x: 280, y: 0, width: 200, height: 100, text: "Leaf" },
    ],
    edges: [{ id: "root-leaf", fromNode: "root", toNode: "leaf" }],
  };

  for (const exportFormat of ["package", "single-html"] as const) {
    for (const foldingInitiallyEnabled of [undefined, false] as const) {
      const html = await convertCanvasToHtml(data, {
        ...baseOptions,
        exportFormat,
        foldingInitiallyEnabled,
        initialFoldState: {
          hiddenEdgeIds: ["root-leaf"],
          hiddenNodeIds: ["leaf"],
          source: "persisted",
        },
      });

      assert.match(html, /id="folding-menu"/);
      assert.match(html, /id="folding-mode-button"[^>]+aria-pressed="true"[^>]*>Enable folding<\/button>/);
      assert.match(html, /class="branch-focus-control"[^>]+hidden>/);
      assert.match(html, /class="branch-control"[^>]+hidden>/);
      assert.match(html, /id="folding-controls-visibility-button"[^>]+hidden>Hide folding controls<\/button>/);
      assert.match(html, /id="folding-expand-all-button"[^>]+hidden>/);
      assert.match(html, /id="folding-toolbar-button"[^>]*>Restore folding<\/button>/);
      assert.match(html, /class="folding-menu-separator folding-action-control" hidden>/);
      assert.match(html, /id="focus-controls-visibility-button"[^>]+hidden>Hide focus controls<\/button>/);
      assert.match(html, /let foldingControlsEnabled = false/);
      assert.match(html, /foldingModeButton\.textContent = foldingControlsEnabled\s+\? "No folding"\s+: "Enable folding"/);
      assert.match(html, /control\.hidden = !foldingControlsEnabled \|\| !foldingNodeControlsVisible/);
      assert.match(html, /const importedHiddenNodeIds = new Set\(\[\]\)/);
      assert.match(html, /const importedHiddenEdgeIds = new Set\(\[\]\)/);
      assert.match(html, /applyImportedFolding\(false\)/);
    }
  }
});

await test("keeps overlaid node controls opaque on hover", async () => {
  const data: CanvasData = {
    name: "Opaque controls",
    nodes: [
      { id: "node", type: "text", x: 0, y: 0, width: 200, height: 100, text: "# Heading under controls" },
    ],
    edges: [],
  };

  for (const [darkMode, expectedBackground] of [[false, "#f4f6f9"], [true, "#15181d"]] as const) {
    const html = await convertCanvasToHtml(data, { ...baseOptions, darkMode });
    const hoverRule = html.match(
      /\.branch-control:hover,[\s\S]*?\.branch-focus-control\.is-active \{([\s\S]*?)\n {4}\}/,
    );

    assert.ok(hoverRule, "expected the shared node-control hover rule");
    assert.match(hoverRule[1], new RegExp(`background: ${expectedBackground.replace("#", "\\#")};`));
    assert.doesNotMatch(hoverRule[1], /background:\s*rgba\(/);
  }
});

await test("renders cycle-safe branch controls in both export modes", async () => {
  const data: CanvasData = {
    name: "Branches",
    nodes: [
      { id: "root", type: "text", x: 0, y: 0, width: 200, height: 100, text: "Root" },
      { id: "child", type: "text", x: 280, y: 0, width: 200, height: 100, text: "Child" },
      { id: "leaf", type: "text", x: 560, y: 0, width: 200, height: 100, text: "Leaf" },
    ],
    edges: [
      { id: "root-child", fromNode: "root", toNode: "child" },
      { id: "child-leaf", fromNode: "child", toNode: "leaf" },
    ],
  };

  for (const exportFormat of ["package", "single-html"] as const) {
    const html = await convertCanvasToHtml(data, { ...baseOptions, exportFormat });

    assert.match(html, /class="node-controls"><button class="branch-focus-control"[\s\S]+<button class="branch-control"/);
    assert.match(html, /data-branch-node-id="root"[^>]+aria-label="Collapse branch · 2 descendants"[^>]+title="Collapse branch · 2 descendants">−<\/button>/);
    assert.match(html, /data-branch-node-id="child"[^>]+aria-label="Collapse branch · 1 descendant"[^>]+title="Collapse branch · 1 descendant">−<\/button>/);
    assert.doesNotMatch(html, /data-branch-node-id="leaf"/);
    assert.match(html, /data-focus-node-id="root"[^>]+title="Focus branch · 2 descendants"><svg class="branch-focus-icon"/);
    assert.match(html, /data-focus-node-id="child"[^>]+title="Focus branch · 1 descendant"><svg class="branch-focus-icon"/);
    assert.match(html, /data-focus-node-id="leaf"[^>]+aria-label="Focus node"[^>]+title="Focus node"><svg class="branch-focus-icon"/);
    assert.match(html, /id="node-root"[\s\S]+data-canvas-width="200"[\s\S]+data-canvas-height="100"/);
    assert.match(html, /<circle cx="12" cy="12" r="3"><\/circle>/);
    assert.match(html, /<path d="M3 7V5a2 2 0 0 1 2-2h2"><\/path>/);
    assert.doesNotMatch(html, />◎<\/button>/);
    assert.match(html, /"childrenByNode":\{"child":\["leaf"\],"leaf":\[\],"root":\["child"\]\}/);
    assert.doesNotMatch(html, /"descendantsByNode"/);
    assert.match(html, /function getDescendants\(nodeId\)/);
    assert.match(html, /function deriveCollapsedVisibility\(baseHiddenNodeIds\)/);
    assert.match(html, /function getNodeIdsHiddenByGroups\(sourceHiddenNodeIds\)/);
    assert.match(html, /function updateFoldingVisibility\(\)/);
    assert.match(html, /function toggleBranch\(nodeId\)/);
    assert.match(html, /id="folding-expand-all-button"[^>]*>Expand all<\/button>/);
    assert.match(html, /id="folding-collapse-all-button"[^>]*>Collapse all<\/button>/);
    assert.match(html, /id="folding-menu" class="toolbar-menu"><summary>Folding<\/summary><div class="toolbar-menu-content">/);
    assert.match(html, /id="folding-focus-exit-button"[^>]+onclick="exitBranchFocus\(\)" disabled>Exit focus<\/button>/);
    assert.match(html, /id="folding-controls-visibility-button"[^>]+onclick="toggleFoldingControlsVisibility\(\)"[^>]*>Hide folding controls<\/button>/);
    assert.match(html, /<button id="folding-toolbar-button"[^>]*>Restore folding<\/button>\s+<hr class="folding-menu-separator folding-action-control">\s+<button id="focus-controls-visibility-button"[^>]*>Hide focus controls<\/button>\s+<button id="folding-focus-exit-button"[^>]*>Exit focus<\/button>/);
    assert.match(html, /id="folding-mode-button"[^>]+onclick="toggleFoldingMode\(\)"[^>]*>No folding<\/button>/);
    assert.doesNotMatch(html, /id="zoom-area-button"|toggleZoomAreaMode|zoomAreaMode/);
    assert.match(html, /id="zoom-area-selection" class="zoom-area-selection" hidden/);
    assert.match(html, /id="zoom-area-hint"[^>]+role="status" hidden>Release to zoom · Esc to cancel<\/div>/);
    assert.match(html, /function startZoomAreaSelection\(event\)/);
    assert.match(html, /event\.pointerType !== "mouse" \|\| event\.button !== 0/);
    assert.match(html, /target\?\.closest\("a, button, input, select, textarea, iframe, audio, video, \[contenteditable='true'\]"\)/);
    assert.match(html, /Math\.hypot\(point\.x - zoomAreaDrag\.startX, point\.y - zoomAreaDrag\.startY\) < 6/);
    assert.match(html, /zoomAreaDrag\.active = true/);
    assert.match(html, /function finishZoomAreaSelection\(event\)/);
    assert.match(html, /selection\.width >= 12 && selection\.height >= 12/);
    assert.match(html, /availableWidth \/ selectedCanvasArea\.width/);
    assert.match(html, /viewport\.addEventListener\("pointerdown", startZoomAreaSelection, true\)/);
    assert.match(html, /event\.key === "Escape" && zoomAreaDrag/);
    assert.match(html, /cancelZoomAreaDrag\(true\)/);
    assert.match(html, /id="folding-level-select"[^>]*>[\s\S]*<option value="2">Level 2<\/option><\/select>/);
    assert.match(html, /"levelByNode":\{"root":0,"child":1,"leaf":2\}/);
    assert.match(html, /"maxLevel":2/);
    assert.match(html, /"rootNodeIds":\["root"\]/);
    assert.match(html, /level > visibleLevelLimit/);
    assert.match(html, /for \(const nodeId of foldingGraph\.rootNodeIds\)/);
    assert.match(html, /let foldingControlsEnabled = true/);
    assert.match(html, /let foldingNodeControlsVisible = true/);
    assert.match(html, /let focusNodeControlsVisible = true/);
    assert.match(html, /let focusedBranchNodeId = null/);
    assert.match(html, /let focusMutedNodeIds = new Set\(\)/);
    assert.match(html, /let groupHiddenNodeIds = new Set\(\)/);
    assert.doesNotMatch(html, /branchStateHiddenNodeIds/);
    assert.match(html, /control\.hidden = !foldingControlsEnabled \|\| !foldingNodeControlsVisible/);
    assert.match(html, /control\.disabled = disabledByHiddenGroup/);
    assert.match(html, /descendants\.every\(\(descendantId\) => groupHiddenNodeIds\.has\(descendantId\)\)/);
    assert.match(html, /"Branch hidden by folded group"/);
    assert.match(html, /control\.hidden = !foldingControlsEnabled \|\| !focusNodeControlsVisible/);
    assert.match(html, /const hiddenDescendantCount = descendants\s+\.filter\(\(descendantId\) => hiddenNodeIds\.has\(descendantId\) && !groupNodeIds\.has\(descendantId\)\)/);
    assert.match(html, /const ownHiddenDescendantCount = collapsedNodeIds\.has\(nodeId\)\s+\? descendants\.filter\(\(descendantId\) => !groupNodeIds\.has\(descendantId\)\)\.length\s+: 0/);
    assert.match(html, /const displayedHiddenBranch = disabledByHiddenGroup\s+\? collapsedNodeIds\.has\(nodeId\)\s+: hasHiddenBranch/);
    assert.match(html, /const displayedHiddenDescendantCount = disabledByHiddenGroup\s+\? ownHiddenDescendantCount\s+: hiddenDescendantCount/);
    assert.match(html, /control\.textContent = displayedHiddenBranch && displayedHiddenDescendantCount > 0\s+\? String\(displayedHiddenDescendantCount\)/);
    assert.match(html, /displayedHiddenBranch && displayedHiddenDescendantCount > 0/);
    assert.match(html, /const hiddenConnectionCount = getHiddenBranchConnectionCount\(nodeId, descendants\)/);
    assert.match(html, /const hasHiddenBranch = collapsedNodeIds\.has\(nodeId\)\s+\|\| hasHiddenDescendant\s+\|\| hiddenConnectionCount > 0/);
    assert.match(html, /hiddenConnectionCount === 1 \? " hidden connection" : " hidden connections"/);
    assert.match(html, /function getHiddenBranchConnectionCount\(nodeId, descendants\)/);
    assert.match(html, /control\.setAttribute\("aria-label", branchControlLabel\)/);
    assert.match(html, /\.node-controls \{[\s\S]+display: flex;[\s\S]+gap: 6px;/);
    assert.match(html, /\.branch-control\.has-hidden-count \{[\s\S]+width: auto;[\s\S]+padding: 0 6px;/);
    assert.match(html, /\.branch-control:disabled \{[\s\S]+cursor: not-allowed;[\s\S]+opacity: 0\.5;/);
    assert.match(html, /function focusBranch\(nodeId\)/);
    assert.match(html, /focusedBranchNodeId = focusedBranchNodeId === nodeId \? null : nodeId/);
    assert.match(html, /function getFocusedNodeIds\(nodeId\)/);
    assert.match(html, /directedFocusNodeIds = new Set\(\[nodeId, \.\.\.getDescendants\(nodeId\)\]\)/);
    assert.match(html, /for \(const groupId of directedFocusNodeIds\)/);
    assert.match(html, /for \(const containedNodeId of foldingGraph\.groupContentsByNode\[groupId\] \|\| \[\]\)/);
    assert.match(html, /const focusedNodeIds = getFocusedNodeIds\(focusedBranchNodeId\)/);
    assert.match(html, /if \(!focusedNodeIds\.has\(nodeId\)\) focusMutedNodeIds\.add\(nodeId\)/);
    assert.match(html, /\.node\.is-focus-muted \{\s+opacity: 0\.2;/);
    assert.match(html, /\.minimap-node\.is-focus-muted \{\s+opacity: 0\.2;/);
    assert.match(html, /if \(focusMuted\) path\.setAttribute\("opacity", "0\.2"\)/);
    assert.match(html, /if \(focusMuted\) label\.setAttribute\("opacity", "0\.2"\)/);
    assert.match(html, /if \(focusMuted\) bg\.setAttribute\("opacity", "0\.2"\)/);
    assert.match(html, /focusedBranchNodeId !== null && focusMutedNodeIds\.has\(nodeId\)/);
    assert.match(html, /function getFitNodeBounds\(\)/);
    assert.match(html, /!hiddenNodeIds\.has\(nodeId\)[\s\S]+&& \(focusedBranchNodeId === null \|\| \([\s\S]+!focusMutedNodeIds\.has\(nodeId\)[\s\S]+&& \(!groupNodeIds\.has\(nodeId\) \|\| nodeId === focusedBranchNodeId\)/);
    assert.match(html, /const fitBounds = getFitNodeBounds\(\)/);
    assert.match(html, /scrollViewportToCanvasPoint\([\s\S]+fitBounds\.left \+ fitBounds\.width \/ 2,[\s\S]+fitBounds\.top \+ fitBounds\.height \/ 2/);
    assert.match(html, /const width = parseFloat\(target\.getAttribute\("data-canvas-width"\) \|\| "0"\)/);
    assert.doesNotMatch(html, /target\.offsetWidth \/ Math\.max\(currentScale/);
    assert.match(html, /window\.focusBranch = focusBranch/);
    assert.match(html, /window\.exitBranchFocus = function\(\) \{\s+focusedBranchNodeId = null;\s+updateFoldingVisibility\(\)/);
    assert.match(html, /foldingFocusExitButton\.disabled = focusedBranchNodeId === null/);
    assert.match(html, /document\.querySelectorAll\("\.branch-focus-control\[data-focus-node-id\]"\)[\s\S]+control\.hidden = !foldingControlsEnabled/);
    assert.match(html, /window\.toggleFoldingMode = function\(\)/);
    assert.match(html, /window\.toggleFoldingControlsVisibility = function\(\)/);
    assert.match(html, /window\.toggleFocusControlsVisibility = function\(\)/);
    assert.match(html, /window\.restoreImportedFolding = function\(\) \{\s+foldingControlsEnabled = true;\s+applyImportedFolding\(false\)/);
    assert.match(html, /foldingMenu\.addEventListener\("mouseleave", \(\) => \{\s+foldingMenu\.removeAttribute\("open"\)/);
    assert.match(html, /foldingModeButton\.textContent = foldingControlsEnabled\s+\? "No folding"\s+: "Enable folding"/);
    assert.match(html, /collapsedNodeIds\.has\(edge\.fromId\)/);
    assert.match(html, /!connectedGroupNodeIds\.has\(groupId\)/);
    assert.match(html, /hasVisibleAlternativeParent/);
    assert.doesNotMatch(html, /revealedNodeIdsByRestriction/);
    assert.match(html, /foldingControlsVisibilityButton\.textContent = foldingNodeControlsVisible\s+\? "Hide folding controls"\s+: "Show folding controls"/);
    assert.match(html, /focusControlsVisibilityButton\.textContent = focusNodeControlsVisible\s+\? "Hide focus controls"\s+: "Show focus controls"/);
    assert.match(html, /control\.addEventListener\("click"/);
    assert.match(html, /document\.querySelectorAll\("\.branch-focus-control\[data-focus-node-id\]"\)/);
    const runtime = html.match(/<script>([\s\S]+)<\/script>/)?.[1] || "";
    assert.doesNotThrow(() => new vm.Script(runtime));
  }
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
  assert.match(html, /\.node\.search-hit \{\s+z-index: 7;\s+outline: 4px solid #ffd43b;\s+outline-offset: 5px;[\s\S]+animation: search-hit-pulse 550ms ease-in-out 4 alternate;/);
  assert.match(html, /@keyframes search-hit-pulse \{/);
  assert.match(html, /@media \(prefers-reduced-motion: reduce\) \{\s+\.node\.search-hit \{\s+animation: none;/);
  assert.match(html, /target\.getBoundingClientRect\(\);\s+target\.classList\.add\("search-hit"\)/);
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
  assert.match(html, /"openHref":"assets\/files\/suche-notiz\.html"|"openHref":"assets\/files\//);
  assert.match(html, /title\.setAttribute\("data-search-open", "true"\)/);
  assert.match(html, /search-result-title-link/);
  assert.match(html, /function applyLinkAttrs\(link, href, query\)/);
  assert.match(html, /link\.setAttribute\("href", appendSearchQueryToHref\(href, query\)\)/);
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
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
