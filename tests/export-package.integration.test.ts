import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { convertCanvasToHtml } from "../src/render/converter";
import { exportCanvasPackage } from "../src/export/exporter";
import { escapeAttribute } from "../src/render/html";

type MockFile = {
  path: string;
  name: string;
  basename: string;
  extension: string;
  parent: MockFolder | null;
  kind: "text" | "binary";
  text?: string;
  binary?: ArrayBuffer;
};

type MockFolder = {
  path: string;
  name: string;
  parent: MockFolder | null;
};

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

function createMockApp(initialFiles: Array<{ path: string; text?: string; binary?: ArrayBuffer }>) {
  const files = new Map<string, MockFile>();
  const folders = new Set<string>();
  const encoder = new TextEncoder();

  function normalizePath(pathLike: string): string {
    return String(pathLike || "")
      .replace(/\\/g, "/")
      .replace(/\/+/g, "/")
      .replace(/^\/+/, "")
      .replace(/\/+$/, "");
  }

  function ensureFolder(folderPath: string): void {
    const normalized = normalizePath(folderPath);
    if (!normalized) return;
    const parts = normalized.split("/").filter(Boolean);
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      folders.add(current);
    }
  }

  function makeParent(folderPath: string): MockFolder | null {
    const normalized = normalizePath(folderPath);
    if (!normalized) return null;
    const name = normalized.split("/").pop() || normalized;
    const parentPath = normalized.split("/").slice(0, -1).join("/");
    return {
      path: normalized,
      name,
      parent: parentPath ? makeParent(parentPath) : null,
    };
  }

  function addTextFile(path: string, text: string): MockFile {
    const normalized = normalizePath(path);
    const name = normalized.split("/").pop() || normalized;
    const dot = name.lastIndexOf(".");
    const basename = dot >= 0 ? name.slice(0, dot) : name;
    const extension = dot >= 0 ? name.slice(dot + 1) : "";
    const parentPath = normalized.split("/").slice(0, -1).join("/");
    ensureFolder(parentPath);
    const file: MockFile = {
      path: normalized,
      name,
      basename,
      extension,
      parent: makeParent(parentPath),
      kind: "text",
      text,
    };
    files.set(normalized, file);
    return file;
  }

  function addBinaryFile(path: string, binary: ArrayBuffer): MockFile {
    const normalized = normalizePath(path);
    const name = normalized.split("/").pop() || normalized;
    const dot = name.lastIndexOf(".");
    const basename = dot >= 0 ? name.slice(0, dot) : name;
    const extension = dot >= 0 ? name.slice(dot + 1) : "";
    const parentPath = normalized.split("/").slice(0, -1).join("/");
    ensureFolder(parentPath);
    const file: MockFile = {
      path: normalized,
      name,
      basename,
      extension,
      parent: makeParent(parentPath),
      kind: "binary",
      binary,
    };
    files.set(normalized, file);
    return file;
  }

  for (const entry of initialFiles) {
    if (entry.binary) addBinaryFile(entry.path, entry.binary);
    else addTextFile(entry.path, entry.text || "");
  }

  const app = {
    vault: {
      adapter: {
        exists: async (path: string) => {
          const normalized = normalizePath(path);
          return folders.has(normalized) || files.has(normalized);
        },
      },
      read: async (file: MockFile) => file.text || "",
      readBinary: async (file: MockFile) => file.binary || encoder.encode(file.text || "").buffer,
      create: async (path: string, data: string) => addTextFile(path, data),
      createBinary: async (path: string, data: ArrayBuffer) => addBinaryFile(path, data),
      createFolder: async (path: string) => {
        ensureFolder(path);
      },
      modify: async (file: MockFile, data: string) => {
        file.text = data;
        file.kind = "text";
      },
      modifyBinary: async (file: MockFile, data: ArrayBuffer) => {
        file.binary = data;
        file.kind = "binary";
      },
      getAbstractFileByPath: (path: string) => {
        const normalized = normalizePath(path);
        return files.get(normalized) || null;
      },
    },
    workspace: {
      getActiveFile: () => null,
    },
    metadataCache: {
      getFirstLinkpathDest: (linkpath: string) => {
        const normalized = normalizePath(linkpath);
        if (files.has(normalized)) return files.get(normalized) || null;
        const basename = normalized.split("/").pop() || normalized;
        for (const file of files.values()) {
          if (file.path === normalized || file.name === basename || file.basename === basename.replace(/\.[^.]+$/, "")) {
            return file;
          }
        }
        return null;
      },
    },
  };

  return { app, files, folders, addTextFile };
}

(async () => {
  for (const exportFormat of ["package", "single-html"] as const) {
    await test(`rewrites text-node note links and embeds in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([
        { path: "text.canvas", text: JSON.stringify({ nodes: [{ id: "text", type: "text", text: "[[Note]]\n![[image.png]]", x: 0, y: 0, width: 100, height: 100 }], edges: [] }) },
        { path: "Note.md", text: "# Note\nContent" },
        { path: "image.png", binary: new Uint8Array([137, 80, 78, 71]).buffer },
      ]);
      const result = await exportCanvasPackage(app as never, files.get("text.canvas") as never, { darkMode: false, outputDir: "out", exportFormat });
      const html = await convertCanvasToHtml(result.data, result.options);
      const content = result.data.nodes[0].renderedTextHtml!;
      assert.ok(html.includes(content));
      assert.doesNotMatch(content, /\[\[/);
      if (exportFormat === "single-html") {
        assert.match(content, /data-inline-page="p\d+"/);
        assert.match(content, /src="data:image\/png;base64,/);
      } else {
        const targets = [...content.matchAll(/(?:href|src)="(assets\/[^"]+)"/g)];
        assert.equal(targets.length, 2);
        for (const target of targets) assert.ok(files.has(`out/text/${target[1]}`));
      }
    });
  }

  await test("copies binary assets into the absolute export destination", async () => {
    const folder = await fs.mkdtemp(path.join(os.tmpdir(), "canvas-exporter-assets-"));
    try {
      const binary = new Uint8Array([137, 80, 78, 71]).buffer;
      const { app, files } = createMockApp([
        { path: "assets.canvas", text: JSON.stringify({ nodes: [{ id: "img", type: "file", file: "image.png", x: 0, y: 0, width: 100, height: 100 }], edges: [] }) },
        { path: "image.png", binary },
      ]);
      const result = await exportCanvasPackage(app as never, files.get("assets.canvas") as never, { darkMode: false, outputDir: folder });
      const copied = await fs.readFile(path.join(result.outputPath, result.data.nodes[0].exportPath!));
      assert.deepEqual(new Uint8Array(copied), new Uint8Array(binary));
    } finally {
      await fs.rm(folder, { recursive: true, force: true });
    }
  });
  for (const exportFormat of ["package", "single-html"] as const) {
    await test(`does not activate executable link-node URLs in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([{ path: "link.canvas", text: JSON.stringify({ nodes: [{ id: "link", type: "link", url: "javascript:alert(1)", x: 0, y: 0, width: 100, height: 100 }], edges: [] }) }]);
      const result = await exportCanvasPackage(app as never, files.get("link.canvas") as never, { darkMode: false, outputDir: "out", exportFormat });
      const html = exportFormat === "single-html" ? result.options.embeddedPages![0].bodyHtml : files.get(`out/link/${result.data.nodes[0].canvasHref}`)!.text!;
      assert.doesNotMatch(html, /(?:href|src)="javascript:/);
      assert.match(html, /src="about:blank"/);
    });
  }

  for (const exportFormat of ["package", "single-html"] as const) {
    await test(`keeps cyclic note links usable in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([
        { path: "cycle.canvas", text: JSON.stringify({ nodes: [{ id: "a", type: "file", file: "A.md", x: 0, y: 0, width: 200, height: 100 }], edges: [] }) },
        { path: "A.md", text: "# A\n[[B]]" },
        { path: "B.md", text: "# B\n[[A]]" },
      ]);
      const result = await exportCanvasPackage(app as never, files.get("cycle.canvas") as never, { darkMode: false, outputDir: "out", exportFormat });
      if (exportFormat === "single-html") {
        const pages = result.options.embeddedPages!;
        assert.equal(pages.length, 2);
        for (const page of pages) {
          const target = /href="#page-(p\d+)"/.exec(page.bodyHtml)?.[1];
          assert.ok(pages.some((entry) => entry.id === target), page.bodyHtml);
        }
      } else {
        for (const file of [...files.values()].filter((entry) => entry.extension === "html")) {
          const target = /href="(\d+_[AB]\.html)"/.exec(file.text!)?.[1];
          assert.ok(target && files.has(`out/cycle/assets/files/${target}`));
        }
      }
    });

    await test(`terminates recursive section embeds in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([
        { path: "recursive.canvas", text: JSON.stringify({ nodes: [{ id: "a", type: "file", file: "A.md", x: 0, y: 0, width: 200, height: 100 }], edges: [] }) },
        { path: "A.md", text: "# Section\n![[A#Section]]" },
      ]);
      let reads = 0;
      const read = app.vault.read;
      app.vault.read = (file) => {
        assert.ok(++reads < 30, "recursive embed must terminate without unbounded reads");
        return read(file);
      };
      const result = await exportCanvasPackage(app as never, files.get("recursive.canvas") as never, { darkMode: false, outputDir: "out", exportFormat });
      assert.ok(reads < 30);
      const html = exportFormat === "single-html" ? result.options.embeddedPages![0].bodyHtml : files.get(`out/recursive/${result.data.nodes[0].exportHtmlPath}`)?.text;
      assert.match(html || "", /Unresolved embed/);
    });

    await test(`keeps same-name PDF viewers distinct in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([
        { path: "pdf.canvas", text: JSON.stringify({ nodes: ["a", "b"].map((id) => ({ id, type: "file", file: `${id}/Report #1.pdf`, x: 0, y: 0, width: 200, height: 100 })), edges: [] }) },
        { path: "a/Report #1.pdf", binary: new Uint8Array([1]).buffer },
        { path: "b/Report #1.pdf", binary: new Uint8Array([2]).buffer },
      ]);
      const result = await exportCanvasPackage(app as never, files.get("pdf.canvas") as never, { darkMode: false, outputDir: "out", exportFormat });
      assert.notEqual(result.data.nodes[0].canvasHref, result.data.nodes[1].canvasHref);
      if (exportFormat === "package") {
        for (const node of result.data.nodes) {
          assert.doesNotMatch(node.canvasHref!, /[# ]/);
          assert.ok(files.get(`out/pdf/${node.canvasHref}`)?.text?.includes(node.exportPath!.split("/").pop()!));
        }
      }
    });

    await test(`exports to the vault root in ${exportFormat}`, async () => {
      for (const outputDir of [".", "/"]) {
        const { app, files } = createMockApp([{ path: "root.canvas", text: '{"nodes":[],"edges":[]}' }]);
        const result = await exportCanvasPackage(app as never, files.get("root.canvas") as never, { darkMode: false, outputDir, exportFormat });
        assert.equal(result.outputPath, exportFormat === "package" ? "root" : "root.html");
      }
    });
  }

  await test("exports markdown and image file nodes into a package", async () => {
    const png = new Uint8Array([137, 80, 78, 71]).buffer;
    const canvasJson = JSON.stringify({
      name: "Demo Canvas",
      nodes: [
        { id: "md", type: "file", x: 0, y: 0, width: 320, height: 180, file: "notes/main.md", label: "Canvas Titel" },
        { id: "img", type: "file", x: 360, y: 0, width: 240, height: 180, file: "assets/picture.png" },
      ],
      edges: [{ id: "edge-package", fromNode: "md", toNode: "img", label: "zeigt" }],
    });

    const { app, files } = createMockApp([
      { path: "canvases/demo.canvas", text: canvasJson },
      { path: "notes/main.md", text: "# Titel\nSiehe [[second|zweite Notiz]] und ![[picture.png]]\n\n- Punkt eins\n  Fortsetzung\n- Punkt zwei\n\nNormal danach\n\n- Geschützt\\\nFortsetzung\n\n**Fett** und *kursiv*" },
      { path: "notes/second.md", text: "## Abschnitt\nMehr Inhalt" },
      { path: "assets/picture.png", binary: png },
    ]);

    const canvasFile = files.get("canvases/demo.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
      foldingInitiallyEnabled: true,
      initialFoldState: {
        hiddenEdgeIds: ["edge-package"],
        hiddenNodeIds: ["img"],
        source: "active-leaf",
      },
      inlineStyleColors: {
        strong: "rgb(210, 80, 90)",
        em: "rgb(90, 130, 210)",
      },
    });

    assert.equal(result.outputKind, "folder");
    assert.equal(result.outputPath, "Canvas-Exports/demo");
    assert.equal(result.data.nodes.length, 2);
    assert.equal(result.data.edges.length, 1);
    assert.deepEqual(result.options.initialFoldState, {
      hiddenEdgeIds: ["edge-package"],
      hiddenNodeIds: ["img"],
      source: "active-leaf",
    });

    const markdownNode = result.data.nodes.find((node) => node.id === "md");
    const imageNode = result.data.nodes.find((node) => node.id === "img");

    assert.equal(markdownNode?.fileKind, "markdown");
    assert.ok(markdownNode?.exportHtmlPath?.startsWith("assets/files/"));
    assert.ok(markdownNode?.canvasHref?.startsWith("assets/files/"));
    assert.match(markdownNode?.previewHtml || "", /zweite Notiz/);
    assert.match(markdownNode?.previewHtml || "", /assets\/images\//);
    assert.match(markdownNode?.previewHtml || "", /<ul><li>Punkt eins<br>\nFortsetzung<\/li><li>Punkt zwei<\/li><\/ul>/);
    assert.match(markdownNode?.previewHtml || "", /<p>Normal danach<\/p>/);
    assert.match(markdownNode?.previewHtml || "", /<ul><li>Geschützt<br>\nFortsetzung<\/li><\/ul>/);
    assert.match(markdownNode?.previewHtml || "", /<strong>Fett<\/strong>/);
    assert.match(markdownNode?.previewHtml || "", /<em>kursiv<\/em>/);
    assert.equal(result.options.inlineStyleColors?.strong, "rgb(210, 80, 90)");
    assert.equal(result.options.inlineStyleColors?.em, "rgb(90, 130, 210)");

    assert.equal(imageNode?.fileKind, "image");
    assert.ok(imageNode?.exportPath?.startsWith("assets/images/"));

    const exportedMarkdownPath = `Canvas-Exports/demo/${markdownNode?.exportHtmlPath}`;
    const exportedImagePath = `Canvas-Exports/demo/${imageNode?.exportPath}`;
    const exportedMarkdown = files.get(exportedMarkdownPath);
    const exportedImage = files.get(exportedImagePath);

    assert.ok(exportedMarkdown);
    assert.ok(exportedImage);
    assert.match(exportedMarkdown?.text || "", /<h1>Canvas Titel<\/h1>/);
    assert.match(exportedMarkdown?.text || "", /<a class="md-page-canvas-link" href="\.\.\/\.\.\/index\.html">Canvas<\/a>/);
    assert.match(exportedMarkdown?.text || "", /zweite Notiz/);
    assert.doesNotMatch(exportedMarkdown?.text || "", /md-page-back-link/);
    assert.match(exportedMarkdown?.text || "", /<a href="[^"]+\.html">zweite Notiz<\/a>/);
    assert.match(exportedMarkdown?.text || "", /<ul><li>Punkt eins<br>\nFortsetzung<\/li><li>Punkt zwei<\/li><\/ul>/);
    assert.match(exportedMarkdown?.text || "", /<p>Normal danach<\/p>/);
    assert.match(exportedMarkdown?.text || "", /<ul><li>Geschützt<br>\nFortsetzung<\/li><\/ul>/);
    assert.doesNotMatch(exportedMarkdown?.text || "", /__canvasExporterCanvasProxy/);
    assert.match(exportedMarkdown?.text || "", /<img src="\.\.\/images\//);
  });

  await test("throws a readable error for invalid canvas json", async () => {
    const { app, files } = createMockApp([
      { path: "canvases/bad.canvas", text: "{not-json" },
    ]);

    const canvasFile = files.get("canvases/bad.canvas") as MockFile;
    await assert.rejects(
      () =>
        exportCanvasPackage(app as never, canvasFile as never, {
          darkMode: true,
          outputDir: "Canvas-Exports",
        }),
      /Invalid canvas JSON/,
    );
  });

  await test("exports package into an absolute filesystem folder", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "canvas-html-exporter-"));
    try {
      const canvasJson = JSON.stringify({
        name: "Absolute Export",
        nodes: [
          { id: "main", type: "file", x: 0, y: 0, width: 320, height: 180, file: "notes/main.md" },
        ],
        edges: [],
      });

      const { app, files } = createMockApp([
        { path: "canvases/demo.canvas", text: canvasJson },
        { path: "notes/main.md", text: "# Absolute\nContent" },
      ]);

      const canvasFile = files.get("canvases/demo.canvas") as MockFile;
      const result = await exportCanvasPackage(app as never, canvasFile as never, {
        darkMode: true,
        outputDir: tempRoot,
      });

      assert.equal(result.outputKind, "folder");
      assert.equal(result.outputPath, path.join(tempRoot, "demo"));
      const markdownNode = result.data.nodes.find((node) => node.id === "main");
      assert.ok(markdownNode?.exportHtmlPath);

      const exportedMarkdownPath = path.join(result.outputPath, markdownNode?.exportHtmlPath || "");
      const exportedMarkdown = await fs.readFile(exportedMarkdownPath, "utf8");
      assert.match(exportedMarkdown, /<h1>main<\/h1>/);
      assert.match(exportedMarkdown, /<h1 id="absolute">Absolute<\/h1>/);
    } finally {
      await fs.rm(tempRoot, { recursive: true, force: true });
    }
  });

  await test("exports markdown fixtures with heading links and section embeds", async () => {
    const canvasJson = JSON.stringify({
      name: "Wiki Export",
      nodes: [
        { id: "main", type: "file", x: 0, y: 0, width: 360, height: 220, file: "notes/main.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      {
        path: "canvases/wiki.canvas",
        text: canvasJson,
      },
      {
        path: "notes/main.md",
        text: [
          "# Start",
          "Sprung im Dokument zu [[#Start|oben]].",
          "Markdown-Link zu [unten](#Abschnitt).",
          "Link zu [[second#Abschnitt|Kapitel]].",
          "",
          "Embed:",
          "![[second#Abschnitt]]",
          "",
          "Ganzes Dokument: [[third|Dritte Seite]]",
        ].join("\n"),
      },
      {
        path: "notes/second.md",
        text: [
          "# Intro",
          "Vorwort",
          "",
          "## Abschnitt",
          "Nur dieser Teil soll im Embed erscheinen.",
          "",
          "### Unterpunkt",
          "Zusatz",
          "",
          "## Weiter",
          "Nicht mehr Teil des Embeds",
        ].join("\n"),
      },
      {
        path: "notes/third.md",
        text: "# Dritte Seite\nInhalt",
      },
    ]);

    const canvasFile = files.get("canvases/wiki.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const mainNode = result.data.nodes.find((node) => node.id === "main");
    assert.equal(mainNode?.fileKind, "markdown");
    assert.ok(mainNode?.exportHtmlPath);

    const mainExport = files.get(`Canvas-Exports/wiki/${mainNode?.exportHtmlPath || ""}`);
    assert.ok(mainExport);

    const mainHtml = mainExport?.text || "";
    assert.match(mainHtml, /href="#start"/);
    assert.match(mainHtml, />oben<\/a>/);
    assert.match(mainHtml, /href="#abschnitt"/);
    assert.match(mainHtml, />unten<\/a>/);
    assert.match(mainHtml, />Kapitel<\/a>/);
    assert.match(mainHtml, /href="[^"]+#abschnitt"/);
    assert.match(mainHtml, /Nur dieser Teil soll im Embed erscheinen\./);
    assert.match(mainHtml, /<div class="md-embed-block">/);
    assert.match(mainHtml, /<h2 id="abschnitt">Abschnitt<\/h2>/);
    assert.doesNotMatch(mainHtml, /<p>Embed:<br>\s*<h2/);
    assert.doesNotMatch(mainHtml, /Nicht mehr Teil des Embeds/);
    assert.match(mainHtml, />Dritte Seite<\/a>/);

    const exportedSubpages = [...files.keys()].filter(
      (path) => path.startsWith("Canvas-Exports/wiki/assets/files/") && path.endsWith(".html"),
    );
    assert.ok(exportedSubpages.length >= 3);
  });

  await test("exports markdown block references as anchors and embeds", async () => {
    const canvasJson = JSON.stringify({
      name: "Block Export",
      nodes: [
        { id: "main", type: "file", x: 0, y: 0, width: 360, height: 220, file: "notes/main.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      {
        path: "canvases/block.canvas",
        text: canvasJson,
      },
      {
        path: "notes/main.md",
        text: [
          "# Start",
          "Sprung im Dokument zu [[#^kern-aussage|hier]].",
          "Markdown-Link zu [Block](#^kern-aussage).",
          "Direkter Sprung zu [[blocks#^kern-aussage|Kernaussage]].",
          "",
          "Embed:",
          "![[blocks#^kern-aussage]]",
        ].join("\n"),
      },
      {
        path: "notes/blocks.md",
        text: [
          "# Sammlung",
          "",
          "Wichtiger Absatz",
          "^kern-aussage",
          "",
          "Noch ein Absatz",
        ].join("\n"),
      },
    ]);

    const canvasFile = files.get("canvases/block.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const mainNode = result.data.nodes.find((node) => node.id === "main");
    const mainExport = files.get(`Canvas-Exports/block/${mainNode?.exportHtmlPath || ""}`);
    assert.ok(mainExport);

    const mainHtml = mainExport?.text || "";
    assert.match(mainHtml, /href="#block-kern-aussage"/);
    assert.match(mainHtml, />hier<\/a>/);
    assert.match(mainHtml, />Block<\/a>/);
    assert.match(mainHtml, /href="[^"]+#block-kern-aussage"/);
    assert.match(mainHtml, /<div class="md-embed-block"><p id="block-kern-aussage">Wichtiger Absatz<\/p><\/div>/);

    const exportedBlockPagePath = [...files.keys()].find(
      (path) => path.startsWith("Canvas-Exports/block/assets/files/") && path.endsWith(".html") && !path.endsWith(`${mainNode?.exportHtmlPath || ""}`),
    );
    assert.ok(exportedBlockPagePath);

    const exportedBlockPage = files.get(exportedBlockPagePath || "");
    assert.match(exportedBlockPage?.text || "", /<p id="block-kern-aussage">Wichtiger Absatz<\/p>/);
  });

  await test("exports single html note links with heading and block anchors", async () => {
    const canvasJson = JSON.stringify({
      name: "Single Anchor Export",
      nodes: [
        { id: "main", type: "file", x: 0, y: 0, width: 360, height: 220, file: "notes/main.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      {
        path: "canvases/single-anchor.canvas",
        text: canvasJson,
      },
      {
        path: "notes/main.md",
        text: [
          "# Start",
          "Sprung zu [[target#Abschnitt|Abschnitt]].",
          "Sprung zu [[target#^kern-aussage|Block]].",
        ].join("\n"),
      },
      {
        path: "notes/target.md",
        text: [
          "# Ziel",
          "",
          "## Abschnitt",
          "Inhalt",
          "",
          "Wichtiger Absatz",
          "^kern-aussage",
        ].join("\n"),
      },
    ]);

    const canvasFile = files.get("canvases/single-anchor.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
      exportFormat: "single-html",
    });

    assert.equal(result.outputKind, "file");
    const markdownNode = result.data.nodes.find((node) => node.id === "main");
    const mainPageId = markdownNode?.canvasHref?.replace(/^#page-/, "") || "";
    const mainPage = result.options.embeddedPages?.find((page) => page.id === mainPageId);
    assert.ok(mainPage);
    assert.match(mainPage?.bodyHtml || "", /href="#page-p\d+#abschnitt" data-inline-page="p\d+"/);
    assert.match(mainPage?.bodyHtml || "", /href="#page-p\d+#block-kern-aussage" data-inline-page="p\d+"/);
    assert.doesNotMatch(mainPage?.bodyHtml || "", /data-inline-page="p\d+#/);

    const targetPage = result.options.embeddedPages?.find((page) => /<h2 id="abschnitt">Abschnitt<\/h2>/.test(page.bodyHtml));
    assert.ok(targetPage);
    assert.match(targetPage?.bodyHtml || "", /<p id="block-kern-aussage">Wichtiger Absatz<\/p>/);
  });

  await test("renders pdf and file embeds in exported markdown pages", async () => {
    const pdf = new Uint8Array([37, 80, 68, 70]).buffer;
    const zip = new Uint8Array([80, 75, 3, 4]).buffer;
    const canvasJson = JSON.stringify({
      name: "Media Export",
      nodes: [
        { id: "main", type: "file", x: 0, y: 0, width: 360, height: 220, file: "notes/media.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/media.canvas", text: canvasJson },
      {
        path: "notes/media.md",
        text: [
          "# Medien",
          "![[manual.pdf|480x320]]",
          "",
          "![[archive.zip|Download-Paket]]",
        ].join("\n"),
      },
      { path: "files/manual.pdf", binary: pdf },
      { path: "files/archive.zip", binary: zip },
    ]);

    const canvasFile = files.get("canvases/media.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const mainNode = result.data.nodes.find((node) => node.id === "main");
    const mainExport = files.get(`Canvas-Exports/media/${mainNode?.exportHtmlPath || ""}`);
    assert.ok(mainExport);

    const mainHtml = mainExport?.text || "";
    assert.match(mainHtml, /class="pdf-embed-block"/);
    assert.match(mainHtml, /<iframe src="\d+_manual\.pdf" title="manual\.pdf" loading="lazy" width="480" height="320"><\/iframe>/);
    assert.match(mainHtml, /class="file-embed-block"/);
    assert.match(mainHtml, /class="file-chip" href="\d+_archive\.zip"/);
    assert.match(mainHtml, />Download-Paket<\/a>/);
    assert.doesNotMatch(mainHtml, /<p>\s*<div class="pdf-embed-block">/);
    assert.doesNotMatch(mainHtml, /<p>\s*<div class="file-embed-block">/);
  });

  await test("exports media file nodes and embeds with browser controls", async () => {
    const media = new Uint8Array([1, 2, 3, 4]).buffer;
    const canvasJson = JSON.stringify({
      name: "Media",
      nodes: [
        { id: "audio", type: "file", x: 0, y: 0, width: 320, height: 120, file: "media/sound.mp3" },
        { id: "video", type: "file", x: 360, y: 0, width: 360, height: 220, file: "media/clip.mov" },
        { id: "note", type: "file", x: 760, y: 0, width: 360, height: 220, file: "notes/media.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/media.canvas", text: canvasJson },
      { path: "media/sound.mp3", binary: media },
      { path: "media/clip.mov", binary: media },
      { path: "notes/media.md", text: "![[sound.mp3]]\n\n![[clip.mov]]" },
    ]);

    const canvasFile = files.get("canvases/media.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const audioNode = result.data.nodes.find((node) => node.id === "audio");
    const videoNode = result.data.nodes.find((node) => node.id === "video");
    const noteNode = result.data.nodes.find((node) => node.id === "note");

    assert.equal(audioNode?.fileKind, "audio");
    assert.equal(videoNode?.fileKind, "video");
    assert.ok(audioNode?.exportPath?.startsWith("assets/files/"));
    assert.ok(videoNode?.exportPath?.startsWith("assets/files/"));

    const exportedMarkdown = files.get(`Canvas-Exports/media/${noteNode?.exportHtmlPath || ""}`);
    const mainHtml = exportedMarkdown?.text || "";
    assert.match(mainHtml, /<div class="media-embed-block audio-embed-block"><audio src="\d+_sound\.mp3" title="sound\.mp3" controls preload="metadata"><\/audio><\/div>/);
    assert.match(mainHtml, /<div class="media-embed-block video-embed-block"><video src="\d+_clip\.mov" title="clip\.mov" controls preload="metadata"><\/video><\/div>/);
  });

  await test("rewrites markdown image paths for exported markdown subpages", async () => {
    const png = new Uint8Array([137, 80, 78, 71]).buffer;
    const canvasJson = JSON.stringify({
      name: "Image Export",
      nodes: [
        { id: "main", type: "file", x: 0, y: 0, width: 360, height: 220, file: "notes/image-note.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/image.canvas", text: canvasJson },
      {
        path: "notes/image-note.md",
        text: [
          "# Bilder",
          "![Skizze](../assets/picture.png)",
        ].join("\n"),
      },
      { path: "assets/picture.png", binary: png },
    ]);

    const canvasFile = files.get("canvases/image.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const mainNode = result.data.nodes.find((node) => node.id === "main");
    const mainExport = files.get(`Canvas-Exports/image/${mainNode?.exportHtmlPath || ""}`);
    assert.ok(mainExport);

    const mainHtml = mainExport?.text || "";
    assert.match(mainHtml, /<img src="\.\.\/images\/\d+_picture\.png" alt="Skizze">/);
  });

  await test("exports link nodes with local wrapper page and preview target", async () => {
    const canvasJson = JSON.stringify({
      name: "Link Export",
      nodes: [
        {
          id: "link",
          type: "link",
          x: 0,
          y: 0,
          width: 360,
          height: 220,
          label: "OpenAI Docs",
          url: "https://openai.com/index/",
        },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/link.canvas", text: canvasJson },
    ]);

    const canvasFile = files.get("canvases/link.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const linkNode = result.data.nodes.find((node) => node.id === "link");
    assert.ok(linkNode);
    assert.equal(linkNode?.displayName, "https://openai.com/index/");
    assert.ok(linkNode?.exportHtmlPath?.startsWith("assets/files/"));
    assert.ok(linkNode?.canvasHref?.startsWith("assets/files/"));
    assert.equal(linkNode?.url, "https://openai.com/index/");

    const exportedLinkPage = files.get(`Canvas-Exports/link/${linkNode?.exportHtmlPath || ""}`);
    assert.ok(exportedLinkPage);
    const linkHtml = exportedLinkPage?.text || "";
    assert.match(linkHtml, /<a class="link-page-canvas-link" href="\.\.\/\.\.\/index\.html">Canvas<\/a>/);
    assert.match(linkHtml, /No internet connection is available\./);
    assert.match(linkHtml, /This website may not allow embedded previews\. Use the link above\./);
    assert.match(linkHtml, /Use the link above if the website blocks embedding or if you want to open the page in its own browser tab\./);
    assert.match(linkHtml, /<a class="link-page-title" href="https:\/\/openai\.com\/index\/"/);
    assert.doesNotMatch(linkHtml, /link-page-back/);
    assert.doesNotMatch(linkHtml, /class="link-page-action"/);
    assert.match(linkHtml, /<iframe id="link-preview-frame" src="https:\/\/openai\.com\/index\/" title="https:\/\/openai\.com\/index\/" loading="lazy"><\/iframe>/);
    assert.match(linkHtml, /window\.setTimeout\(\(\) => \{/);
  });

  await test("keeps shiki highlighting in exported markdown html pages", async () => {
    const canvasJson = JSON.stringify({
      nodes: [
        { id: "md1", type: "file", file: "notes/code.md", x: 0, y: 0, width: 320, height: 220 },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/code.canvas", text: canvasJson },
      { path: "notes/code.md", text: "```php\n<?php echo 'hi';\n```" },
    ]);

    const canvasFile = files.get("canvases/code.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const markdownNode = result.data.nodes.find((node) => node.id === "md1");
    const markdownPage = files.get(`Canvas-Exports/code/${markdownNode?.exportHtmlPath || ""}`);

    assert.ok(markdownPage);
    assert.match(markdownPage?.text || "", /class="shiki/);
    assert.match(markdownPage?.text || "", /style="color:#[0-9A-Fa-f]{6}/);
    assert.match(markdownPage?.text || "", /&#x3C;\?|&#x3C;<\/span><span[^>]*>\?/);
    assert.match(markdownPage?.text || "", /meta name="canvas-html-exporter-build" content="[0-9]+\.[0-9]+\.[0-9]+-(shiki|github)"/);
  });

  await test("keeps embedded markdown images relative to exported subpages", async () => {
    const png = new Uint8Array([137, 80, 78, 71]).buffer;
    const canvasJson = JSON.stringify({
      name: "Nested Image Export",
      nodes: [
        { id: "main", type: "file", x: 0, y: 0, width: 360, height: 220, file: "notes/main.md" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/nested-image.canvas", text: canvasJson },
      {
        path: "notes/main.md",
        text: [
          "# Start",
          "![[child]]",
        ].join("\n"),
      },
      {
        path: "notes/child.md",
        text: [
          "# Kind",
          "![[picture.png]]",
        ].join("\n"),
      },
      { path: "assets/picture.png", binary: png },
    ]);

    const canvasFile = files.get("canvases/nested-image.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    const mainNode = result.data.nodes.find((node) => node.id === "main");
    const mainExport = files.get(`Canvas-Exports/nested-image/${mainNode?.exportHtmlPath || ""}`);
    assert.ok(mainExport);

    const mainHtml = mainExport?.text || "";
    assert.match(mainHtml, /<div class="md-embed-block">/);
    assert.match(mainHtml, /<img src="\.\.\/images\/\d+_picture\.png" alt="picture\.png">/);
    assert.doesNotMatch(mainHtml, /<img src="assets\/images\//);
  });

  await test("builds a single self-contained html export with inline assets", async () => {
    const png = new Uint8Array([137, 80, 78, 71]).buffer;
    const canvasJson = JSON.stringify({
      name: "Single HTML",
      nodes: [
        { id: "md", type: "file", x: 0, y: 0, width: 320, height: 220, file: "notes/main.md" },
        { id: "link", type: "link", x: 360, y: 0, width: 320, height: 220, url: "https://pandoc.org/" },
      ],
      edges: [],
    });

    const { app, files } = createMockApp([
      { path: "canvases/single.canvas", text: canvasJson },
      { path: "notes/main.md", text: "# Start\n![[picture.png]]\n\nSee [[child]]." },
      { path: "notes/child.md", text: "## Child\nMore text." },
      { path: "assets/picture.png", binary: png },
    ]);

    const canvasFile = files.get("canvases/single.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: false,
      outputDir: "Canvas-Exports",
      exportFormat: "single-html",
      foldingInitiallyEnabled: false,
      initialFoldState: {
        hiddenEdgeIds: [],
        hiddenNodeIds: ["link"],
        source: "persisted",
      },
    });

    assert.equal(result.outputKind, "file");
    assert.equal(result.outputPath, "Canvas-Exports/single.html");
    assert.equal(result.options.foldingInitiallyEnabled, false);
    assert.equal(result.options.initialFoldState, undefined);

    const markdownNode = result.data.nodes.find((node) => node.id === "md");
    const linkNode = result.data.nodes.find((node) => node.id === "link");

    assert.ok(markdownNode?.exportHtmlPath?.startsWith("#page-"));
    assert.ok(markdownNode?.canvasHref?.startsWith("#page-"));
    assert.match(markdownNode?.previewHtml || "", /<img src="data:image\/png;base64,/);
    assert.ok(linkNode?.canvasHref?.startsWith("#page-"));
    assert.equal(files.has("Canvas-Exports/single/assets/files/001_main.html"), false);
    assert.equal(files.has("Canvas-Exports/single/assets/images/"), false);
    assert.ok(result.options.embeddedPages?.some((page) => page.id === markdownNode?.canvasHref?.replace(/^#page-/, "")));
    const markdownPage = result.options.embeddedPages?.find((page) => page.id === markdownNode?.canvasHref?.replace(/^#page-/, ""));
    assert.match(markdownPage?.bodyHtml || "", /data-inline-page="p\d+"/);
    assert.match(markdownPage?.bodyHtml || "", /href="#page-p\d+"/);
  });

  for (const exportFormat of ["package", "single-html"] as const) {
    await test(`exports linked subcanvases recursively and terminates cycles in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([
        {
          path: "root.canvas",
          text: JSON.stringify({
            nodes: [
              { id: "child-card", type: "file", file: "nested/child.canvas", label: "Child canvas", x: 0, y: 0, width: 320, height: 180 },
              { id: "child-link", type: "text", text: "[[nested/child.canvas|Child link]]", x: 360, y: 0, width: 320, height: 180 },
            ],
            edges: [],
          }),
        },
        {
          path: "nested/child.canvas",
          text: JSON.stringify({
            nodes: [
              { id: "root-card", type: "file", file: "root.canvas", x: 0, y: 0, width: 320, height: 180 },
              { id: "grand-card", type: "file", file: "nested/grand.canvas", x: 360, y: 0, width: 320, height: 180 },
              { id: "root-link", type: "text", text: "[[root.canvas|Root link]]", x: 720, y: 0, width: 320, height: 180 },
            ],
            edges: [{ id: "child-edge", fromNode: "grand-card", toNode: "root-link", color: "4" }],
          }),
        },
        {
          path: "nested/grand.canvas",
          text: JSON.stringify({
            nodes: [
              { id: "child-card", type: "file", file: "nested/child.canvas", x: 0, y: 0, width: 320, height: 180 },
            ],
            edges: [],
          }),
        },
      ]);

      const result = await exportCanvasPackage(app as never, files.get("root.canvas") as never, {
        darkMode: false,
        outputDir: "out",
        exportFormat,
      });
      assert.equal(result.canvasPages.length, 2);
      assert.deepEqual(
        new Set(result.canvasPages.map((page) => page.sourcePath)),
        new Set(["nested/child.canvas", "nested/grand.canvas"]),
      );

      const rootCard = result.data.nodes.find((node) => node.id === "child-card");
      const rootText = result.data.nodes.find((node) => node.id === "child-link");
      assert.equal(rootCard?.fileKind, "canvas");
      assert.equal(rootCard?.canvasNavigationTarget, undefined);
      assert.equal(rootCard?.canvasPreview?.edges.length, 1);
      assert.ok(rootCard?.canvasPreview?.nodes.some((node) => node.id === "grand-card"));
      assert.match(rootCard?.canvasHref || "", exportFormat === "single-html" ? /^#page-canvas-c\d+$/ : /^canvas-\d{3}-child\.html$/);
      assert.match(rootText?.renderedTextHtml || "", exportFormat === "single-html" ? /data-inline-page="canvas-c\d+"/ : /href="canvas-\d{3}-child\.html"/);

      const childPage = result.canvasPages.find((page) => page.sourcePath === "nested/child.canvas");
      const grandPage = result.canvasPages.find((page) => page.sourcePath === "nested/grand.canvas");
      assert.ok(childPage);
      assert.ok(grandPage);
      const backToRoot = childPage.data.nodes.find((node) => node.id === "root-card");
      const grandCard = childPage.data.nodes.find((node) => node.id === "grand-card");
      const rootLink = childPage.data.nodes.find((node) => node.id === "root-link");
      assert.equal(backToRoot, undefined);
      assert.equal(childPage.options.canvasHomeHref, exportFormat === "package" ? "index.html" : undefined);
      assert.equal(grandCard?.canvasNavigationTarget, exportFormat === "single-html" ? "_parent" : undefined);
      assert.ok(grandCard?.canvasPreview?.nodes.some((node) => node.id === "child-card"));
      assert.equal(grandPage.data.nodes[0].canvasHref, rootCard?.canvasHref);
      assert.match(
        rootLink?.renderedTextHtml || "",
        exportFormat === "single-html" ? /href="#" target="_parent"/ : /href="index\.html"/,
      );

      const childHtml = await convertCanvasToHtml(childPage.data, childPage.options);
      const rootPreviewHtml = await convertCanvasToHtml(result.data, result.options);
      assert.match(childHtml, /class="canvas-card-link"/);
      assert.match(childHtml, /class="canvas-card-preview"/);
      assert.match(rootPreviewHtml, /class="canvas-card-preview-edges"><line /);
      assert.match(rootPreviewHtml, /class="canvas-card-title">Child canvas<\/span>/);
      assert.doesNotMatch(childHtml, /Open canvas/);
      assert.doesNotMatch(rootPreviewHtml, /Open canvas/);
      if (exportFormat === "single-html") {
        assert.doesNotMatch(childHtml, /class="toolbar-canvas-link"/);
        for (const page of result.canvasPages) {
          const pageHtml = await convertCanvasToHtml(page.data, page.options);
          const embedded = result.options.embeddedPages?.find((entry) => entry.id === page.pageId);
          assert.ok(embedded);
          embedded.bodyHtml = `<div class="single-canvas-page"><iframe class="single-canvas-frame" srcdoc="${escapeAttribute(pageHtml)}" title="${escapeAttribute(page.title)}"></iframe></div>`;
        }
        const rootHtml = await convertCanvasToHtml(result.data, result.options);
        assert.match(rootHtml, /data-page-kind="canvas"/);
        assert.match(rootHtml, /class="single-canvas-frame"/);
        assert.match(rootHtml, /id="single-page-canvas-link"[^>]*>Canvas<\/a>/);
        assert.doesNotMatch(rootHtml, /srcdoc="<!DOCTYPE html>/);
      } else {
        assert.match(childPage?.outputPath || "", /^out\/root\/canvas-\d{3}-child\.html$/);
        assert.match(grandPage?.outputPath || "", /^out\/root\/canvas-\d{3}-grand\.html$/);
        assert.doesNotMatch(childHtml, /target="_parent"/);
        assert.match(childHtml, /class="toolbar-canvas-link" href="index\.html">Canvas<\/a>/);
        assert.match(childHtml, /\.toolbar-canvas-link,\s+\.single-page-canvas-link \{\s+color: #1967d2;/);
      }
    });

    await test(`falls back to a generic file for invalid linked canvases in ${exportFormat}`, async () => {
      const { app, files } = createMockApp([
        {
          path: "root.canvas",
          text: JSON.stringify({
            nodes: [{ id: "broken", type: "file", file: "broken.canvas", x: 0, y: 0, width: 320, height: 180 }],
            edges: [],
          }),
        },
        { path: "broken.canvas", text: "{not valid JSON" },
      ]);
      const originalConsoleError = console.error;
      console.error = () => undefined;
      try {
        const result = await exportCanvasPackage(app as never, files.get("root.canvas") as never, {
          darkMode: false,
          outputDir: "out",
          exportFormat,
        });
        assert.equal(result.canvasPages.length, 0);
        assert.equal(result.data.nodes[0].fileKind, "file");
        if (exportFormat === "single-html") {
          assert.match(result.data.nodes[0].exportPath || "", /^data:application\/octet-stream;base64,/);
        } else {
          const copiedPath = result.data.nodes[0].exportPath || "";
          assert.match(copiedPath, /^assets\/files\/\d{3}_broken\.canvas$/);
          assert.ok(files.has(`out/root/${copiedPath}`));
        }
      } finally {
        console.error = originalConsoleError;
      }
    });
  }
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
