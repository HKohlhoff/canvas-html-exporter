"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => CanvasExporterPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");

// src/converter.ts
async function convertCanvasToHtml(data, options = {}) {
  const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
  const rawEdges = Array.isArray(data.edges) ? data.edges : [];
  const norm = normalizeNodes(rawNodes, 40);
  const nodes = norm.nodes;
  const edges = rawEdges;
  const ctx = {
    nodeMap: new Map(nodes.map((n) => [String(n.id), n]))
  };
  const renderedNodes = await Promise.all(nodes.map((n) => renderNode(n, ctx)));
  const nodesHtml = renderedNodes.join("\n");
  const edgesHtml = edges.map((e) => renderEdge(e, ctx)).join("\n");
  return buildHtmlDocument({
    nodesHtml,
    edgesHtml,
    width: norm.width,
    height: norm.height,
    darkMode: !!options.darkMode
  });
}
function normalizeNodes(nodes, margin = 40) {
  if (!nodes.length) {
    return {
      nodes: [],
      offsetX: 0,
      offsetY: 0,
      width: 1200,
      height: 800
    };
  }
  const minX = Math.min(...nodes.map((n) => num(n.x)));
  const minY = Math.min(...nodes.map((n) => num(n.y)));
  const maxX = Math.max(...nodes.map((n) => num(n.x) + num(n.width, 200)));
  const maxY = Math.max(...nodes.map((n) => num(n.y) + num(n.height, 120)));
  const offsetX = margin - minX;
  const offsetY = margin - minY;
  const shifted = nodes.map((n) => ({
    ...n,
    x: num(n.x) + offsetX,
    y: num(n.y) + offsetY
  }));
  const width = Math.max(1200, Math.ceil(maxX - minX + margin * 2));
  const height = Math.max(800, Math.ceil(maxY - minY + margin * 2));
  return {
    nodes: shifted,
    offsetX,
    offsetY,
    width,
    height
  };
}
async function renderNode(node, ctx) {
  switch (String(node.type ?? "")) {
    case "text":
      return renderTextNode(node);
    case "file":
      return renderFileNode(node);
    case "link":
      return renderLinkNode(node);
    case "group":
      return renderGroupNode(node);
    default:
      return renderUnknownNode(node);
  }
}
function renderTextNode(node) {
  const text = escapeHtml(String(node.text ?? "")).replace(/\n/g, "<br>");
  return renderNodeShell({
    node,
    className: "canvas-node canvas-text-node",
    innerHtml: `<div class="canvas-node-inner">${text}</div>`
  });
}
function renderLinkNode(node) {
  const url = String(node.url ?? "");
  const label = escapeHtml(String((node.title ?? url) || "Link"));
  return renderNodeShell({
    node,
    className: "canvas-node canvas-link-node",
    innerHtml: `
      <div class="canvas-node-inner">
        <a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>
      </div>
    `
  });
}
function renderGroupNode(node) {
  const label = escapeHtml(String(node.label ?? node.text ?? ""));
  return `
    <div class="canvas-group"
         style="${nodeBoxStyle(node)}">
      <div class="canvas-group-title">${label}</div>
    </div>
  `;
}
async function renderFileNode(node) {
  const filePath = String(node.file ?? node.path ?? "");
  const ext = getExtension(filePath);
  if (isImageExtension(ext)) {
    return renderImageFileNode(node, filePath);
  }
  if (ext === "md") {
    return renderSimpleFileCard(node, filePath, "Markdown");
  }
  if (ext === "pdf") {
    return renderSimpleFileCard(node, filePath, "PDF");
  }
  return renderSimpleFileCard(node, filePath, "Datei");
}
function renderImageFileNode(node, filePath) {
  const label = escapeHtml(basename(filePath));
  const src = escapeAttr(filePath);
  return renderNodeShell({
    node,
    className: "canvas-node canvas-file-node canvas-image-node",
    innerHtml: `
      <div class="canvas-node-inner canvas-image-wrap">
        <a href="${src}" target="_blank" rel="noopener noreferrer">
          <img src="${src}" alt="${label}" />
        </a>
        <div class="canvas-file-label">${label}</div>
      </div>
    `
  });
}
function renderSimpleFileCard(node, filePath, kind) {
  const label = escapeHtml(basename(filePath));
  const href = escapeAttr(filePath);
  return renderNodeShell({
    node,
    className: "canvas-node canvas-file-node",
    innerHtml: `
      <div class="canvas-node-inner">
        <div class="canvas-file-kind">${escapeHtml(kind)}</div>
        <a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>
      </div>
    `
  });
}
function renderUnknownNode(node) {
  const label = escapeHtml(`Unbekannter Knotentyp: ${String(node.type ?? "unknown")}`);
  return renderNodeShell({
    node,
    className: "canvas-node canvas-unknown-node",
    innerHtml: `<div class="canvas-node-inner">${label}</div>`
  });
}
function renderNodeShell(args) {
  return `
    <div class="${args.className}" style="${nodeBoxStyle(args.node)}">
      ${args.innerHtml}
    </div>
  `;
}
function nodeBoxStyle(node) {
  const x = num(node.x);
  const y = num(node.y);
  const w = num(node.width, 240);
  const h = num(node.height, 120);
  return [
    "position:absolute",
    `left:${x}px`,
    `top:${y}px`,
    `width:${w}px`,
    `height:${h}px`,
    "box-sizing:border-box"
  ].join(";");
}
function renderEdge(edge, ctx) {
  const fromId = String(edge.fromNode ?? edge.from ?? "");
  const toId = String(edge.toNode ?? edge.to ?? "");
  const from = ctx.nodeMap.get(fromId);
  const to = ctx.nodeMap.get(toId);
  if (!from || !to)
    return "";
  const x1 = num(from.x) + num(from.width, 200) / 2;
  const y1 = num(from.y) + num(from.height, 120) / 2;
  const x2 = num(to.x) + num(to.width, 200) / 2;
  const y2 = num(to.y) + num(to.height, 120) / 2;
  return `
    <line
      x1="${x1}"
      y1="${y1}"
      x2="${x2}"
      y2="${y2}"
      class="canvas-edge-line"
    />
  `;
}
function buildHtmlDocument(args) {
  const themeClass = args.darkMode ? "theme-dark" : "theme-light";
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Canvas Export</title>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body.theme-light {
      background: #f5f6f8;
      color: #222;
    }

    body.theme-dark {
      background: #1e1e1e;
      color: #ddd;
    }

    .page {
      min-width: 100%;
      min-height: 100%;
      padding: 24px;
      box-sizing: border-box;
    }

    .canvas-root {
      position: relative;
      width: ${args.width}px;
      height: ${args.height}px;
      margin: 0 auto;
      background: ${args.darkMode ? "#2a2a2a" : "#ffffff"};
      border: 1px solid ${args.darkMode ? "#444" : "#d0d4da"};
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0,0,0,0.08);
    }

    .canvas-edges {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
    }

    .canvas-edge-line {
      stroke: ${args.darkMode ? "#8ab4f8" : "#5b6b87"};
      stroke-width: 2;
    }

    .canvas-node {
      position: absolute;
      border: 1px solid ${args.darkMode ? "#555" : "#aeb7c2"};
      border-radius: 10px;
      background: ${args.darkMode ? "#303134" : "#fff"};
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .canvas-node-inner {
      padding: 10px 12px;
      line-height: 1.4;
      font-size: 14px;
    }

    .canvas-group {
      position: absolute;
      border: 2px dashed ${args.darkMode ? "#777" : "#b7c0ca"};
      border-radius: 14px;
      background: ${args.darkMode ? "rgba(255,255,255,0.03)" : "rgba(80,120,180,0.05)"};
      z-index: 0;
      pointer-events: none;
    }

    .canvas-group-title {
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 600;
      opacity: 0.9;
    }

    .canvas-text-node,
    .canvas-file-node,
    .canvas-link-node,
    .canvas-unknown-node {
      z-index: 2;
    }

    .canvas-link-node a,
    .canvas-file-node a {
      color: ${args.darkMode ? "#8ab4f8" : "#1f5fbf"};
      text-decoration: none;
      word-break: break-word;
    }

    .canvas-link-node a:hover,
    .canvas-file-node a:hover {
      text-decoration: underline;
    }

    .canvas-file-kind {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      opacity: 0.7;
      margin-bottom: 6px;
    }

    .canvas-image-wrap {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      padding: 0;
    }

    .canvas-image-wrap a {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: ${args.darkMode ? "#262626" : "#f8f9fb"};
    }

    .canvas-image-wrap img {
      display: block;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .canvas-file-label {
      padding: 8px 10px;
      font-size: 12px;
      border-top: 1px solid ${args.darkMode ? "#444" : "#dde3ea"};
      background: ${args.darkMode ? "#2b2b2b" : "#fafbfd"};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body class="${themeClass}">
  <div class="page">
    <div class="canvas-root">
      <svg class="canvas-edges" xmlns="http://www.w3.org/2000/svg">
        ${args.edgesHtml}
      </svg>
      ${args.nodesHtml}
    </div>
  </div>
</body>
</html>`;
}
function num(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function getExtension(file) {
  const i = file.lastIndexOf(".");
  return i >= 0 ? file.slice(i + 1).toLowerCase() : "";
}
function isImageExtension(ext) {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
}
function basename(file) {
  return file.split("/").pop()?.split("\\").pop() ?? file;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttr(value) {
  return escapeHtml(value);
}

// src/main.ts
var DEFAULT_SETTINGS = {
  darkMode: true,
  outputDir: "Canvas-Exports",
  exportImages: false
};
var CanvasExporterPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.settings = DEFAULT_SETTINGS;
  }
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("file-down", "Canvas als HTML exportieren", async () => {
      await this.exportCurrentCanvas();
    });
    this.addCommand({
      id: "export-current-canvas-to-html",
      name: "Export: Aktuelles Canvas als HTML speichern",
      callback: async () => {
        await this.exportCurrentCanvas();
      }
    });
    this.addCommand({
      id: "export-all-canvases-to-html",
      name: "Export: Alle Canvas-Dateien als HTML speichern",
      callback: async () => {
        await this.exportAllCanvases();
      }
    });
    this.addSettingTab(new CanvasExporterSettingTab(this.app, this));
  }
  async exportCurrentCanvas() {
    const file = this.getActiveCanvasFile();
    if (!file) {
      new import_obsidian.Notice("Keine aktive Canvas-Datei gefunden.", 4e3);
      return;
    }
    try {
      const html = await this.buildHtmlForCanvasFile(file);
      const savedFile = await this.writeHtmlFile(file.basename, html);
      new import_obsidian.Notice(`HTML exportiert: ${savedFile.path}`, 5e3);
    } catch (error) {
      console.error("[canvas-exporter] Export fehlgeschlagen", error);
      new import_obsidian.Notice("Canvas-Export fehlgeschlagen. Details in der Entwicklerkonsole.", 6e3);
    }
  }
  async exportAllCanvases() {
    const canvasFiles = this.app.vault.getFiles().filter((file) => file.extension === "canvas");
    if (canvasFiles.length === 0) {
      new import_obsidian.Notice("Im Vault wurden keine Canvas-Dateien gefunden.", 4e3);
      return;
    }
    let successCount = 0;
    const failed = [];
    for (const file of canvasFiles) {
      try {
        const html = await this.buildHtmlForCanvasFile(file);
        await this.writeHtmlFile(file.basename, html);
        successCount += 1;
      } catch (error) {
        console.error(`[canvas-exporter] Export fehlgeschlagen f\xFCr ${file.path}`, error);
        failed.push(file.path);
      }
    }
    if (failed.length === 0) {
      new import_obsidian.Notice(`${successCount} Canvas-Datei(en) exportiert.`, 5e3);
      return;
    }
    new import_obsidian.Notice(
      `${successCount} exportiert, ${failed.length} fehlgeschlagen. Details in der Entwicklerkonsole.`,
      7e3
    );
  }
  getActiveCanvasFile() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "canvas") {
      return null;
    }
    return file;
  }
  async buildHtmlForCanvasFile(file) {
    const rawContent = await this.app.vault.read(file);
    const parsed = JSON.parse(rawContent);
    const data = {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : file.basename
    };
    const options = {
      title: data.name ?? file.basename,
      darkMode: this.settings.darkMode,
      exportImages: this.settings.exportImages
    };
    return convertCanvasToHtml(data, options);
  }
  async writeHtmlFile(baseName, html) {
    const outputDir = this.normalizeOutputDir(this.settings.outputDir);
    await this.ensureFolderExists(outputDir);
    const filePath = `${outputDir}/${baseName}.html`;
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof import_obsidian.TFile) {
      await this.app.vault.modify(existing, html);
      return existing;
    }
    return await this.app.vault.create(filePath, html);
  }
  normalizeOutputDir(dir) {
    const cleaned = dir.trim().replace(/^\/+|\/+$/g, "");
    return cleaned || DEFAULT_SETTINGS.outputDir;
  }
  async ensureFolderExists(folderPath) {
    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);
      if (!existing) {
        await this.app.vault.createFolder(currentPath);
      }
    }
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...saved ?? {} };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var CanvasExporterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas to HTML" });
    containerEl.createEl("p", {
      text: "Exportiert .canvas-Dateien als eigenst\xE4ndige HTML-Dateien. Diese stabile Basis unterst\xFCtzt aktuell vor allem Text-, Link-, Datei- und Gruppen-Knoten."
    });
    new import_obsidian.Setting(containerEl).setName("Dunkles Standard-Theme").setDesc("Verwendet beim Export standardm\xE4\xDFig ein dunkles HTML-Layout.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.darkMode).onChange(async (value) => {
        this.plugin.settings.darkMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Ausgabeordner").setDesc("Relativer Zielordner im Vault, zum Beispiel Canvas-Exports.").addText(
      (text) => text.setPlaceholder("Canvas-Exports").setValue(this.plugin.settings.outputDir).onChange(async (value) => {
        this.plugin.settings.outputDir = value || DEFAULT_SETTINGS.outputDir;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Bildpfade als Bilder ausgeben").setDesc("Versucht bei Bild-Dateiknoten ein img-Element mit dem Vault-Pfad zu erzeugen. Das ist nur ein erster Basis-Support, keine echte Einbettung.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.exportImages).onChange(async (value) => {
        this.plugin.settings.exportImages = value;
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=main.js.map
