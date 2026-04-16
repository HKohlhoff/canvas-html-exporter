import assert from "node:assert/strict";
import { exportCanvasPackage } from "../src/exporter";

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
  await test("exports markdown and image file nodes into a package", async () => {
    const png = new Uint8Array([137, 80, 78, 71]).buffer;
    const canvasJson = JSON.stringify({
      name: "Demo Canvas",
      nodes: [
        { id: "md", type: "file", x: 0, y: 0, width: 320, height: 180, file: "notes/main.md", label: "Canvas Titel" },
        { id: "img", type: "file", x: 360, y: 0, width: 240, height: 180, file: "assets/picture.png" },
      ],
      edges: [{ fromNode: "md", toNode: "img", label: "zeigt" }],
    });

    const { app, files } = createMockApp([
      { path: "canvases/demo.canvas", text: canvasJson },
      { path: "notes/main.md", text: "# Titel\nSiehe [[second|zweite Notiz]] und ![[picture.png]]" },
      { path: "notes/second.md", text: "## Abschnitt\nMehr Inhalt" },
      { path: "assets/picture.png", binary: png },
    ]);

    const canvasFile = files.get("canvases/demo.canvas") as MockFile;
    const result = await exportCanvasPackage(app as never, canvasFile as never, {
      darkMode: true,
      outputDir: "Canvas-Exports",
    });

    assert.equal(result.folderPath, "Canvas-Exports/demo");
    assert.equal(result.data.nodes.length, 2);
    assert.equal(result.data.edges.length, 1);

    const markdownNode = result.data.nodes.find((node) => node.id === "md");
    const imageNode = result.data.nodes.find((node) => node.id === "img");

    assert.equal(markdownNode?.fileKind, "markdown");
    assert.ok(markdownNode?.exportHtmlPath?.startsWith("assets/files/"));
    assert.ok(markdownNode?.canvasHref?.startsWith("assets/files/"));
    assert.match(markdownNode?.previewHtml || "", /zweite Notiz/);
    assert.match(markdownNode?.previewHtml || "", /assets\/images\//);

    assert.equal(imageNode?.fileKind, "image");
    assert.ok(imageNode?.exportPath?.startsWith("assets/images/"));

    const exportedMarkdownPath = `Canvas-Exports/demo/${markdownNode?.exportHtmlPath}`;
    const exportedImagePath = `Canvas-Exports/demo/${imageNode?.exportPath}`;
    const exportedMarkdown = files.get(exportedMarkdownPath);
    const exportedImage = files.get(exportedImagePath);

    assert.ok(exportedMarkdown);
    assert.ok(exportedImage);
    assert.match(exportedMarkdown?.text || "", /<h1>Canvas Titel<\/h1>/);
    assert.match(exportedMarkdown?.text || "", /zweite Notiz/);
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
      /Ungültiges Canvas-JSON/,
    );
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
    assert.match(linkHtml, /Es besteht keine Internetverbindung\./);
    assert.match(linkHtml, /Diese Website erlaubt moeglicherweise keine Anzeige im eingebetteten Frame\. Nutze den Link oben\./);
    assert.match(linkHtml, /Nutze den Link oben, wenn die Website das Einbetten blockiert oder du die Seite in einem eigenen Browser-Tab sehen willst\./);
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
    assert.match(markdownPage?.text || "", /meta name="canvas-exporter-build" content="0\.4\.0-(shiki|github)"/);
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
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
