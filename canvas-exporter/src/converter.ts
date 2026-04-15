import katex from "katex";
import { getSingletonHighlighter } from "shiki/bundle/web";
import type { BundledTheme, Highlighter } from "shiki/bundle/web";
import csharpLanguage from "shiki/langs/csharp.mjs";
import latexLanguage from "shiki/langs/latex.mjs";
import texLanguage from "shiki/langs/tex.mjs";

export interface CanvasNode {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text?: string;
  label?: string;
  file?: string;
  url?: string;
  color?: string;
  exportPath?: string;
  exportHtmlPath?: string;
  canvasHref?: string;
  displayName?: string;
  fileKind?: "image" | "markdown" | "pdf" | "file";
  previewText?: string;
  previewHtml?: string;
}

export interface CanvasEdge {
  id?: string;
  fromNode: string;
  fromSide?: string;
  fromEnd?: string;
  toNode: string;
  toSide?: string;
  toEnd?: string;
  label?: string;
  color?: string;
  lineStyle?: string;
  width?: number;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  name?: string;
}

export interface ExportOptions {
  darkMode: boolean;
  title: string;
  canvasColors?: Record<string, string>;
}

export const EXPORTER_VERSION = "0.2.0";
export const EXPORTER_SIGNATURE = `canvas-exporter v${EXPORTER_VERSION}`;

type NodePalette = {
  background: string;
  border: string;
};

type MarkdownRenderOptions = {
  darkMode?: boolean;
};

// Fallback-Farben, falls keine CSS-Variablen aus Obsidian ausgelesen werden konnten.
// Reihenfolge entspricht dem korrekten Obsidian-Mapping:
// 1=rot, 2=orange, 3=gelb, 4=grün, 5=cyan, 6=lila
const OBSIDIAN_COLORS: Record<string, NodePalette> = {
  "1": { background: "#e6324222", border: "#e63242" }, // red
  "2": { background: "#fa8d3e22", border: "#fa8d3e" }, // orange
  "3": { background: "#f9c74f22", border: "#f9c74f" }, // yellow
  "4": { background: "#56ae6c22", border: "#56ae6c" }, // green
  "5": { background: "#04a5e522", border: "#04a5e5" }, // cyan  (--color-cyan-rgb: 4, 165, 229)
  "6": { background: "#9c6bae22", border: "#9c6bae" }, // purple
};

const SHIKI_DARK_THEME: BundledTheme = "github-dark-default";
const SHIKI_LIGHT_THEME: BundledTheme = "github-light-default";
const SHIKI_FALLBACK_LANGUAGE = "text";
const shikiLanguageModules: Record<string, unknown> = {
  csharp: csharpLanguage,
  latex: latexLanguage,
  tex: texLanguage,
};
let shikiHighlighterPromise: Promise<Highlighter> | null = null;

async function getShikiHighlighter(): Promise<Highlighter> {
  if (!shikiHighlighterPromise) {
    shikiHighlighterPromise = (async () => {
      return getSingletonHighlighter({
        themes: [SHIKI_DARK_THEME, SHIKI_LIGHT_THEME],
      });
    })();
  }

  return shikiHighlighterPromise;
}

function normalizeCodeLanguage(lang: string): string {
  const normalized = String(lang || "").trim().toLowerCase();
  const aliases: Record<string, string> = {
    "": SHIKI_FALLBACK_LANGUAGE,
    js: "javascript",
    ts: "typescript",
    "c#": "csharp",
    csharp: "csharp",
    cs: "csharp",
    sh: "bash",
    shell: "bash",
    zsh: "bash",
    ps1: "powershell",
    yml: "yaml",
    md: "markdown",
    tex: "latex",
    txt: "text",
    plaintext: "text",
  };

  return aliases[normalized] ?? normalized;
}

async function renderCodeBlock(code: string, lang: string, darkMode: boolean): Promise<string> {
  const normalizedLang = normalizeCodeLanguage(lang);

  try {
    const highlighter = await getShikiHighlighter();
    const loaded = new Set(highlighter.getLoadedLanguages());
    if (!loaded.has(normalizedLang)) {
      const languageModule = shikiLanguageModules[normalizedLang];
      if (languageModule) {
        await highlighter.loadLanguage(languageModule as never);
      } else {
        await highlighter.loadLanguage(normalizedLang as never);
      }
    }
    return highlighter.codeToHtml(code, {
      lang: normalizedLang as never,
      theme: darkMode ? SHIKI_DARK_THEME : SHIKI_LIGHT_THEME,
    });
  } catch {
    const className = lang ? ` class="language-${escapeAttribute(lang)}"` : "";
    return `<pre><code${className}>${escapeHtml(code)}</code></pre>`;
  }
}

export async function convertCanvasToHtml(data: CanvasData, options: ExportOptions): Promise<string> {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];

  const bounds = getBounds(nodes);
  const theme = getTheme(options.darkMode);

  const nodeHtml = (await Promise.all(
    nodes.map((node) => renderNode(node, bounds.offsetX, bounds.offsetY, theme, options.darkMode, options.canvasColors)),
  )).join("\n");

  const edgesData = edges.map((edge) => ({
    fromId: edge.fromNode,
    toId: edge.toNode,
    fromSide: normalizeSide(edge.fromSide),
    toSide: normalizeSide(edge.toSide),
    fromEnd: normalizeEdgeEnd(edge.fromEnd, "none"),
    toEnd: normalizeEdgeEnd(edge.toEnd, "arrow"),
    lineStyle: normalizeEdgeLineStyle(edge.lineStyle),
    width: normalizeEdgeWidth(edge.width),
    label: edge.label ?? "",
    color: edge.color ?? "",
  }));

  // CSS-Variablen für benutzerdefinierte Canvas-Farben (überschreiben die Obsidian-Defaults)
  const canvasColorVars = buildCanvasColorVariables(options.canvasColors);

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="${EXPORTER_SIGNATURE}">
  <meta name="canvas-exporter-build" content="${EXPORTER_VERSION}-shiki">
  <base href="./">
  <title>${escapeHtml(options.title)}</title>
  <!-- Exported by ${EXPORTER_SIGNATURE} -->
  <style>
    :root { ${canvasColorVars} }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${theme.bodyBackground};
      color: ${theme.text};
      overflow: auto;
    }
    .page-header {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px 24px 8px;
    }
    .page-header h1 {
      margin: 0 0 8px;
      font-size: 1.4rem;
    }
    .page-header p {
      margin: 0;
      color: ${theme.mutedText};
      font-size: 0.95rem;
    }
    .viewport {
      overflow: auto;
      padding: 16px 24px 28px;
      height: calc(100vh - 132px);
    }
    #canvas {
      position: relative;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      margin: 0 auto;
      transform-origin: top left;
    }
    #edge-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
      z-index: 1;
    }
    .node {
      position: absolute;
      border-radius: 12px;
      padding: 12px 14px;
      color: ${theme.text};
      background: ${theme.nodeBackground};
      border: 2px solid ${theme.nodeBorder};
      box-shadow: 0 3px 14px rgba(0,0,0,0.12);
      z-index: 2;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .node.group {
      background: ${theme.groupBackground};
      border-style: dashed;
      z-index: 0;
    }
    .node.pdf,
    .node.link {
      padding: 0;
    }
    .node.pdf .node-title,
    .node.link .node-title {
      padding: 6px 14px;
    }
    .node.pdf .node-content,
    .node.link .node-content {
      overflow: hidden;
    }
    .node.link .node-content {
      display: flex;
      flex-direction: column;
      padding: 10px 12px 12px;
    }
    .pdf-embed {
      display: flex;
      flex-direction: column;
      height: 100%;
    }
    .pdf-embed iframe {
      flex: 1;
      width: 100%;
      border: none;
      display: block;
    }
    .pdf-title-link {
      display: block;
      text-decoration: none;
      color: inherit;
    }
    .pdf-title {
      padding: 6px 14px;
      font-size: 0.85em;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px solid rgba(128,128,128,0.2);
    }
    .pdf-title:hover {
      text-decoration: underline;
    }
    .node-title {
      font-weight: 700;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${theme.rule};
    }
    .node-content {
      line-height: 1.55;
      word-break: break-word;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }
    .node-content h1, .node-content h2, .node-content h3, .node-content h4, .node-content h5, .node-content h6 {
      margin: 0.5em 0 0.35em;
      line-height: 1.25;
    }
    .node-content p { margin: 0.45em 0; }
    .node-content ul, .node-content ol { margin: 0.45em 0 0.45em 1.2em; }
    .node-content li { margin: 0.2em 0; }
    .node-content a { color: ${theme.link}; text-decoration: none; }
    .node-content a:hover { text-decoration: underline; }
    .node-content code {
      background: ${theme.inlineCodeBackground};
      border-radius: 4px;
      padding: 0.1em 0.35em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
    }
    .node-content pre,
    .node-content .shiki {
      margin: 0.7em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    .node-content pre code,
    .node-content .shiki code {
      padding: 0;
      background: transparent;
    }
    .node-content blockquote {
      margin: 0.7em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
    .node-content .callout { border-radius: 6px; margin: 0.7em 0; overflow: hidden; border: 1px solid #888; }
    .node-content .callout-title { padding: 5px 10px; font-weight: 600; font-size: 0.88em; letter-spacing: 0.01em; }
    .node-content .callout-content { padding: 4px 10px 6px; }
    .node-content .callout-icon { margin-right: 5px; font-style: normal; }
    .node-content .callout-note, .node-content .callout-info, .node-content .callout-todo, .node-content .callout-abstract, .node-content .callout-summary, .node-content .callout-tldr { border-color: #4a9eff; }
    .node-content .callout-note .callout-title, .node-content .callout-info .callout-title, .node-content .callout-todo .callout-title, .node-content .callout-abstract .callout-title, .node-content .callout-summary .callout-title, .node-content .callout-tldr .callout-title { background: rgba(74,158,255,0.15); color: #4a9eff; }
    .node-content .callout-tip, .node-content .callout-hint, .node-content .callout-important, .node-content .callout-success, .node-content .callout-check, .node-content .callout-done { border-color: #4ade80; }
    .node-content .callout-tip .callout-title, .node-content .callout-hint .callout-title, .node-content .callout-important .callout-title, .node-content .callout-success .callout-title, .node-content .callout-check .callout-title, .node-content .callout-done .callout-title { background: rgba(74,222,128,0.15); color: #2d9e57; }
    .node-content .callout-warning, .node-content .callout-caution, .node-content .callout-attention, .node-content .callout-question, .node-content .callout-help, .node-content .callout-faq { border-color: #f59e0b; }
    .node-content .callout-warning .callout-title, .node-content .callout-caution .callout-title, .node-content .callout-attention .callout-title, .node-content .callout-question .callout-title, .node-content .callout-help .callout-title, .node-content .callout-faq .callout-title { background: rgba(245,158,11,0.15); color: #b97a10; }
    .node-content .callout-danger, .node-content .callout-error, .node-content .callout-failure, .node-content .callout-fail, .node-content .callout-missing, .node-content .callout-bug { border-color: #ef4444; }
    .node-content .callout-danger .callout-title, .node-content .callout-error .callout-title, .node-content .callout-failure .callout-title, .node-content .callout-fail .callout-title, .node-content .callout-missing .callout-title, .node-content .callout-bug .callout-title { background: rgba(239,68,68,0.15); color: #c93535; }
    .node-content .callout-example { border-color: #a855f7; }
    .node-content .callout-example .callout-title { background: rgba(168,85,247,0.15); color: #8b3ec9; }
    .node-content .callout-quote, .node-content .callout-cite { border-color: #94a3b8; }
    .node-content .callout-quote .callout-title, .node-content .callout-cite .callout-title { background: rgba(148,163,184,0.15); color: #64748b; }
    .node-content details.callout { display: block; }
    .node-content details.callout > summary.callout-title { cursor: pointer; list-style: none; user-select: none; }
    .node-content details.callout > summary.callout-title::-webkit-details-marker { display: none; }
    .node-content details.callout > summary.callout-title::after { content: " ›"; font-size: 0.85em; }
    .node-content details.callout[open] > summary.callout-title::after { content: " ⌄"; }
    .node-content hr {
      border: none;
      border-top: 1px solid ${theme.rule};
      margin: 0.8em 0;
    }
    .node-content img {
      display: block;
      max-width: 100%;
      border-radius: 8px;
      margin: 0.6em 0;
    }
    .node-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.7em 0;
    }
    .node-content th,
    .node-content td {
      border: 1px solid ${theme.canvasBorder};
      padding: 6px 8px;
      text-align: left;
    }
    .file-chip, .link-chip {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: ${theme.chipBackground};
      border: 1px solid ${theme.canvasBorder};
      color: ${theme.text};
      text-decoration: none;
      margin-top: 6px;
    }
    .link-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
      flex: 1 1 auto;
      height: 100%;
    }
    .link-preview-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .link-preview-title {
      font-weight: 700;
      color: inherit;
      text-decoration: none;
      word-break: break-all;
      flex: 1 1 220px;
    }
    .link-preview-title:hover {
      text-decoration: underline;
    }
    .link-offline-note {
      color: ${theme.mutedText};
      font-size: 0.86em;
      line-height: 1.4;
    }
    .link-offline-note[hidden] {
      display: none;
    }
    .link-blocked-action {
      margin-top: 0.35em;
    }
    .link-preview-frame {
      flex: 1 1 auto;
      min-height: 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.canvasBackground};
    }
    .link-preview-frame iframe {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100%;
      border: none;
      background: ${theme.canvasBackground};
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 10px 24px 0;
      background: linear-gradient(to bottom, ${theme.bodyBackground}, transparent);
    }
    .toolbar button {
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
    }
    .toolbar button:hover { background: ${theme.chipBackground}; }
    .edge-label {
      font-size: 12px;
      fill: ${theme.text};
      pointer-events: none;
    }
    .edge-label-background {
      fill: #ffffff;
      stroke: none;
      pointer-events: none;
    }
    .md-card {
      display: flex;
      flex-direction: column;
      color: inherit;
      margin: -12px -14px;
      padding: 12px 14px;
      height: calc(100% + 24px);
      overflow: hidden;
      overflow-y: auto;
    }
    .md-card-title-link {
      color: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .md-card-title-link:hover {
      text-decoration: underline;
    }
    .md-card-title { font-weight: 700; margin-bottom: 8px; }
    .md-card-preview {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.2em 0 0;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }
    .md-card-preview-text {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.35em 0 0;
      overflow-y: auto;
    }
    .md-card-preview h1,
    .md-card-preview h2,
    .md-card-preview h3,
    .md-card-preview h4,
    .md-card-preview h5,
    .md-card-preview h6 {
      margin-top: 0.2em;
      margin-bottom: 0.35em;
      line-height: 1.2;
    }
    .md-card-preview h1 { font-size: 1.35em; }
    .md-card-preview h2 { font-size: 1.22em; }
    .md-card-preview h3 { font-size: 1.12em; }
    .md-card-preview h4 { font-size: 1.04em; }
    .md-card-preview h5 { font-size: 0.98em; }
    .md-card-preview h6 { font-size: 0.94em; }
    .md-card-preview pre {
      overflow: auto;
    }
    .md-card-preview table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
      margin: 0.5em 0;
    }
    .md-card-preview th,
    .md-card-preview td {
      border: 1px solid ${theme.canvasBorder};
      padding: 4px 6px;
      text-align: left;
    }
    .md-embed-block {
      margin: 0.8em 0;
    }
    .pdf-embed-block {
      margin: 0.8em 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.nodeBackground};
    }
    .pdf-embed-block iframe {
      display: block;
      width: 100%;
      min-height: 420px;
      border: none;
      background: ${theme.canvasBackground};
    }
    .md-page {
      max-width: 960px;
      margin: 32px auto;
      padding: 32px;
      background: ${theme.canvasBackground};
      border: 1px solid ${theme.canvasBorder};
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .unresolved-link {
      color: #d64545;
      font-style: italic;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" onclick="zoomBy(1.15)">Zoom +</button>
    <button type="button" onclick="zoomBy(1 / 1.15)">Zoom −</button>
    <button type="button" onclick="resetZoom()">Reset</button>
  </div>
  <div class="page-header">
    <h1>${escapeHtml(options.title)}</h1>
    <p>${nodes.length} Knoten · ${edges.length} Verbindungen</p>
  </div>
  <div class="viewport">
    <div id="canvas">
      <svg id="edge-layer"></svg>
      ${nodeHtml}
    </div>
  </div>
  <script>
    (() => {
      const edgeLayer = document.getElementById("edge-layer");
      const canvas = document.getElementById("canvas");
      const viewport = document.querySelector(".viewport");
      const edgeColor = ${JSON.stringify(theme.edge)};
      const textColor = ${JSON.stringify(theme.text)};
      const obsidianColors = ${JSON.stringify(
        Object.fromEntries(Object.entries(OBSIDIAN_COLORS).map(([key, value]) => [key, value.border]))
      )};
      const edges = ${JSON.stringify(edgesData)};
      let currentScale = 1;

      function resolveEdgeColor(color) {
        const normalized = String(color || "").trim();
        if (!normalized) return edgeColor;
        if (obsidianColors[normalized]) return obsidianColors[normalized];
        if (normalized.startsWith("#")) return normalized;
        return edgeColor;
      }

      function getAnchor(el, side) {
        const left = parseFloat(el.style.left || "0");
        const top = parseFloat(el.style.top || "0");
        const width = el.offsetWidth;
        const height = el.offsetHeight;

        switch (side) {
          case "top": return { x: left + width / 2, y: top };
          case "bottom": return { x: left + width / 2, y: top + height };
          case "left": return { x: left, y: top + height / 2 };
          case "right": return { x: left + width, y: top + height / 2 };
          default: return { x: left + width / 2, y: top + height / 2 };
        }
      }

      function createMarker(defs, id, type, color) {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", id);
        marker.setAttribute("viewBox", "0 0 12 12");
        marker.setAttribute("markerWidth", "12");
        marker.setAttribute("markerHeight", "12");
        marker.setAttribute("refX", type === "bar" ? "6" : "10");
        marker.setAttribute("refY", "6");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "userSpaceOnUse");
        if (type === "circle") {
          const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
          circle.setAttribute("cx", "6");
          circle.setAttribute("cy", "6");
          circle.setAttribute("r", "3.25");
          circle.setAttribute("fill", color);
          marker.appendChild(circle);
        } else if (type === "diamond") {
          const diamond = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          diamond.setAttribute("points", "1 6, 6 1, 11 6, 6 11");
          diamond.setAttribute("fill", color);
          marker.appendChild(diamond);
        } else if (type === "square") {
          const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
          square.setAttribute("x", "2");
          square.setAttribute("y", "2");
          square.setAttribute("width", "8");
          square.setAttribute("height", "8");
          square.setAttribute("fill", color);
          marker.appendChild(square);
        } else if (type === "bar") {
          const line = document.createElementNS("http://www.w3.org/2000/svg", "path");
          line.setAttribute("d", "M 6 1 L 6 11");
          line.setAttribute("stroke", color);
          line.setAttribute("stroke-width", "2");
          line.setAttribute("fill", "none");
          marker.appendChild(line);
        } else {
          const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
          polygon.setAttribute("points", "2 1, 11 6, 2 11");
          polygon.setAttribute("fill", color);
          marker.appendChild(polygon);
        }
        defs.appendChild(marker);
      }

      function markerIdFor(color, type) {
        return "marker-" + type + "-" + color.replace(/[^a-zA-Z0-9]/g, "_");
      }

      function dashArrayFor(style, width) {
        const stroke = Math.max(1, Number(width) || 2);
        if (style === "dotted") return stroke + " " + (stroke * 3);
        if (style === "short-dash") return (stroke * 3) + " " + (stroke * 3);
        if (style === "dashed") return (stroke * 6) + " " + (stroke * 4);
        if (style === "dash-dot") return (stroke * 6) + " " + (stroke * 3) + " " + stroke + " " + (stroke * 3);
        return "";
      }

      function drawEdges() {
        edgeLayer.innerHTML = "";
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        edgeLayer.appendChild(defs);
        const seenMarkers = new Set();

        for (const edge of edges) {
          const fromEl = document.getElementById("node-" + edge.fromId);
          const toEl = document.getElementById("node-" + edge.toId);
          if (!fromEl || !toEl) continue;

          const start = getAnchor(fromEl, edge.fromSide);
          const end = getAnchor(toEl, edge.toSide);
          const dx = Math.max(Math.abs(end.x - start.x) * 0.35, 28);
          const dy = Math.max(Math.abs(end.y - start.y) * 0.35, 28);
          let c1x = start.x;
          let c1y = start.y;
          let c2x = end.x;
          let c2y = end.y;

          if (edge.fromSide === "right") c1x += dx;
          if (edge.fromSide === "left") c1x -= dx;
          if (edge.fromSide === "top") c1y -= dy;
          if (edge.fromSide === "bottom") c1y += dy;
          if (edge.toSide === "right") c2x += dx;
          if (edge.toSide === "left") c2x -= dx;
          if (edge.toSide === "top") c2y -= dy;
          if (edge.toSide === "bottom") c2y += dy;

          const color = resolveEdgeColor(edge.color);
          const strokeWidth = Math.max(1, Number(edge.width) || 2);
          const dashArray = dashArrayFor(edge.lineStyle, strokeWidth);

          if (edge.fromEnd && edge.fromEnd !== "none") {
            const startMarkerId = markerIdFor(color, edge.fromEnd);
            if (!seenMarkers.has(startMarkerId)) {
              createMarker(defs, startMarkerId, edge.fromEnd, color);
              seenMarkers.add(startMarkerId);
            }
          }

          if (edge.toEnd && edge.toEnd !== "none") {
            const endMarkerId = markerIdFor(color, edge.toEnd);
            if (!seenMarkers.has(endMarkerId)) {
              createMarker(defs, endMarkerId, edge.toEnd, color);
              seenMarkers.add(endMarkerId);
            }
          }

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", "M " + start.x + " " + start.y + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + end.x + " " + end.y);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", color);
          path.setAttribute("stroke-width", String(strokeWidth));
          if (dashArray) {
            path.setAttribute("stroke-dasharray", dashArray);
          }
          if (edge.fromEnd && edge.fromEnd !== "none") {
            path.setAttribute("marker-start", "url(#" + markerIdFor(color, edge.fromEnd) + ")");
          }
          if (edge.toEnd && edge.toEnd !== "none") {
            path.setAttribute("marker-end", "url(#" + markerIdFor(color, edge.toEnd) + ")");
          }
          edgeLayer.appendChild(path);

          if (edge.label) {
            const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
            label.setAttribute("x", String((start.x + end.x) / 2));
            label.setAttribute("y", String((start.y + end.y) / 2 - 6));
            label.setAttribute("text-anchor", "middle");
            label.setAttribute("class", "edge-label");
            label.setAttribute("fill", textColor);
            label.textContent = edge.label;
            edgeLayer.appendChild(label);

            const bbox = label.getBBox();
            const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            bg.setAttribute("x", String(bbox.x - 6));
            bg.setAttribute("y", String(bbox.y - 3));
            bg.setAttribute("width", String(bbox.width + 12));
            bg.setAttribute("height", String(bbox.height + 6));
            bg.setAttribute("rx", "6");
            bg.setAttribute("ry", "6");
            bg.setAttribute("class", "edge-label-background");
            edgeLayer.insertBefore(bg, label);
          }
        }
      }

      window.zoomBy = function(factor) {
        currentScale = Math.max(0.2, Math.min(4, currentScale * factor));
        canvas.style.transform = "scale(" + currentScale + ")";
        drawEdges();
      };

      window.resetZoom = function() {
        const padding = 24;
        const availableWidth = Math.max(100, viewport.clientWidth - padding * 2);
        const availableHeight = Math.max(100, viewport.clientHeight - padding * 2);
        const baseWidth = ${JSON.stringify(bounds.width)};
        const baseHeight = ${JSON.stringify(bounds.height)};
        const scaleX = availableWidth / baseWidth;
        const scaleY = availableHeight / baseHeight;
        currentScale = Math.min(scaleX, scaleY, 1);
        canvas.style.transform = "scale(" + currentScale + ")";
        viewport.scrollTo({ left: 0, top: 0, behavior: "auto" });
        drawEdges();
      };

      function syncLinkOfflineState() {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        document.querySelectorAll(".link-preview").forEach((preview) => {
          const offlineNote = preview.querySelector("[data-link-offline]");
          const blockedNote = preview.querySelector("[data-link-blocked]");
          const frame = preview.querySelector(".link-preview-frame");
          const iframe = preview.querySelector("iframe");
          if (offlineNote) offlineNote.hidden = !offline;
          if (blockedNote) blockedNote.hidden = true;
          if (frame) frame.hidden = offline;
          if (iframe && !iframe.dataset.linkFallbackBound) {
            iframe.dataset.linkFallbackBound = "true";
            iframe.addEventListener("load", () => {
              iframe.dataset.linkLoaded = "true";
              if (blockedNote) blockedNote.hidden = true;
            });
            window.setTimeout(() => {
              const currentlyOffline = typeof navigator !== "undefined" && navigator.onLine === false;
              if (!currentlyOffline && iframe.dataset.linkLoaded !== "true") {
                if (blockedNote) blockedNote.hidden = false;
                if (frame) frame.hidden = true;
              }
            }, 4000);
          }
        });
      }

      drawEdges();
      syncLinkOfflineState();
      window.resetZoom();
      window.addEventListener("resize", () => {
        drawEdges();
        window.resetZoom();
      });
      window.addEventListener("online", syncLinkOfflineState);
      window.addEventListener("offline", syncLinkOfflineState);
    })();
  </script>
</body>
</html>`;
}

export function buildMarkdownDocumentHtml(title: string, bodyHtml: string, darkMode: boolean, canvasColors?: Record<string, string>): string {
  const theme = getTheme(darkMode);
  return `<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="generator" content="${EXPORTER_SIGNATURE}">\n  <meta name="canvas-exporter-build" content="${EXPORTER_VERSION}-shiki">\n  <title>${escapeHtml(title)}</title>\n  <!-- Exported by ${EXPORTER_SIGNATURE} -->\n  <style>\n    :root { ${buildCanvasColorVariables(canvasColors)} }\n    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${theme.bodyBackground};
      color: ${theme.text};
      line-height: 1.65;
    }
    .md-page {
      max-width: 960px;
      margin: 32px auto;
      padding: 32px;
      background: ${theme.canvasBackground};
      border: 1px solid ${theme.canvasBorder};
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    h1, h2, h3, h4 { line-height: 1.25; margin-top: 1.1em; }
    h1 { margin-top: 0; }
    a { color: ${theme.link}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code {
      background: ${theme.inlineCodeBackground};
      border-radius: 4px;
      padding: 0.1em 0.35em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
    }
    pre, .shiki {
      margin: 0.9em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    pre code, .shiki code { padding: 0; background: transparent; }
    blockquote {
      margin: 0.9em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
    .callout { border-radius: 6px; margin: 0.9em 0; overflow: hidden; border: 1px solid #888; }
    .callout-title { padding: 5px 10px; font-weight: 600; font-size: 0.88em; letter-spacing: 0.01em; }
    .callout-content { padding: 4px 10px 6px; }
    .callout-icon { margin-right: 5px; font-style: normal; }
    .callout-note, .callout-info, .callout-todo, .callout-abstract, .callout-summary, .callout-tldr { border-color: #4a9eff; }
    .callout-note .callout-title, .callout-info .callout-title, .callout-todo .callout-title, .callout-abstract .callout-title, .callout-summary .callout-title, .callout-tldr .callout-title { background: rgba(74,158,255,0.15); color: #4a9eff; }
    .callout-tip, .callout-hint, .callout-important, .callout-success, .callout-check, .callout-done { border-color: #4ade80; }
    .callout-tip .callout-title, .callout-hint .callout-title, .callout-important .callout-title, .callout-success .callout-title, .callout-check .callout-title, .callout-done .callout-title { background: rgba(74,222,128,0.15); color: #2d9e57; }
    .callout-warning, .callout-caution, .callout-attention, .callout-question, .callout-help, .callout-faq { border-color: #f59e0b; }
    .callout-warning .callout-title, .callout-caution .callout-title, .callout-attention .callout-title, .callout-question .callout-title, .callout-help .callout-title, .callout-faq .callout-title { background: rgba(245,158,11,0.15); color: #b97a10; }
    .callout-danger, .callout-error, .callout-failure, .callout-fail, .callout-missing, .callout-bug { border-color: #ef4444; }
    .callout-danger .callout-title, .callout-error .callout-title, .callout-failure .callout-title, .callout-fail .callout-title, .callout-missing .callout-title, .callout-bug .callout-title { background: rgba(239,68,68,0.15); color: #c93535; }
    .callout-example { border-color: #a855f7; }
    .callout-example .callout-title { background: rgba(168,85,247,0.15); color: #8b3ec9; }
    .callout-quote, .callout-cite { border-color: #94a3b8; }
    .callout-quote .callout-title, .callout-cite .callout-title { background: rgba(148,163,184,0.15); color: #64748b; }
    details.callout { display: block; }
    details.callout > summary.callout-title { cursor: pointer; list-style: none; user-select: none; }
    details.callout > summary.callout-title::-webkit-details-marker { display: none; }
    details.callout > summary.callout-title::after { content: " ›"; font-size: 0.85em; }
    details.callout[open] > summary.callout-title::after { content: " ⌄"; }
    hr { border: none; border-top: 1px solid ${theme.rule}; margin: 1em 0; }
    img { display: block; max-width: 100%; border-radius: 8px; margin: 0.8em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    th, td { border: 1px solid ${theme.canvasBorder}; padding: 8px 10px; text-align: left; }
    .md-embed-block {
      margin: 0.8em 0;
    }
    .pdf-embed-block {
      margin: 0.8em 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.nodeBackground};
    }
    .pdf-embed-block iframe {
      display: block;
      width: 100%;
      min-height: 420px;
      border: none;
      background: ${theme.canvasBackground};
    }
    .file-embed-block {
      margin: 0.8em 0;
    }
    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.4em 0.7em;
      border-radius: 999px;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      font-weight: 600;
      text-decoration: none;
    }
    .file-chip:hover {
      text-decoration: underline;
    }
    .unresolved-link {
      color: #d64545;
      font-style: italic;
    }
  </style>
</head>
<body>
  <main class="md-page">
    ${bodyHtml}
  </main>
</body>
</html>`;
}

async function renderNode(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
  theme: ReturnType<typeof getTheme>,
  darkMode: boolean,
  canvasColors?: Record<string, string>,
): Promise<string> {
  const left = normalizeNumber(node.x) + offsetX;
  const top = normalizeNumber(node.y) + offsetY;
  const width = Math.max(120, normalizeNumber(node.width));
  const height = Math.max(60, normalizeNumber(node.height));
  const type = (node.type || "text").toLowerCase();
  const isPdf = node.fileKind === "pdf";
  const classes = ["node", type, type === "group" ? "group" : "", isPdf ? "pdf" : ""].filter(Boolean).join(" ");

  const title = type !== "link" && node.label ? `<div class="node-title">${await markdownToHtml(node.label, { darkMode })}</div>` : "";
  const content = await renderNodeContent(node, darkMode);

  const colorKey = String(node.color || "").trim();
  const isNumericColor = /^\d+$/.test(colorKey);

  let background: string;
  let border: string;

  if (type === "group") {
    background = theme.groupBackground;
    border = theme.groupBorder;
  } else if (isNumericColor && canvasColors && canvasColors[colorKey]) {
    // Benutzerdefinierte Farbe aus Obsidian CSS-Variablen vorhanden
    const bgVar = `--canvas-color-${colorKey}-bg`;
    const borderVar = `--canvas-color-${colorKey}`;
    const fallbackPalette = OBSIDIAN_COLORS[colorKey] || { background: theme.nodeBackground, border: theme.nodeBorder };
    background = `var(${bgVar}, ${fallbackPalette.background})`;
    border = `var(${borderVar}, ${fallbackPalette.border})`;
  } else if (isNumericColor) {
    // Keine CSS-Variable ausgelesen – nutze Obsidian-Fallback-Farben direkt
    const palette = OBSIDIAN_COLORS[colorKey] || { background: theme.nodeBackground, border: theme.nodeBorder };
    background = palette.background;
    border = palette.border;
  } else if (colorKey.startsWith("#")) {
    // Hex-Farbe direkt im Canvas angegeben
    background = `${colorKey}22`;
    border = colorKey;
  } else {
    // Keine Farbe – Theme-Defaults
    background = theme.nodeBackground;
    border = theme.nodeBorder;
  }

  return `<div
    id="node-${escapeAttribute(node.id)}"
    class="${classes}"
    style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:${background};border-color:${border};"
  >${title}<div class="node-content">${content}</div></div>`;
}

async function renderNodeContent(node: CanvasNode, darkMode: boolean): Promise<string> {
  const type = (node.type || "text").toLowerCase();

  if (type === "group") {
    return node.text ? markdownToHtml(node.text, { darkMode }) : "";
  }

  if (type === "link") {
    const url = typeof node.url === "string" ? node.url.trim() : "";
    if (!url) return "<p>Leerer Link-Knoten</p>";
    const displayName = escapeHtml(node.displayName || url);
    const iframeSrc = escapeAttribute(url);
    const href = escapeAttribute(node.canvasHref || node.exportHtmlPath || url);
    return `<div class="link-preview">
      <div class="link-preview-header">
        <a class="link-preview-title" href="${href}" target="_blank" rel="noopener noreferrer">${displayName}</a>
      </div>
      <div class="link-offline-note" data-link-offline hidden>Es besteht keine Internetverbindung.</div>
      <div class="link-offline-note" data-link-blocked hidden>Diese Website erlaubt moeglicherweise keine Anzeige im eingebetteten Frame. Nutze die Ueberschrift oben.</div>
      <div class="link-preview-frame"><iframe src="${iframeSrc}" title="${escapeAttribute(node.displayName || url)}" loading="lazy"></iframe></div>
    </div>`;
  }

  if (type === "file") {
    const displayName = escapeHtml(node.displayName || node.file || "Datei");
    const href = escapeAttribute(
      node.fileKind === "markdown" && node.canvasHref
        ? node.canvasHref
        : node.exportHtmlPath || node.exportPath || node.file || "",
    );

    if (node.fileKind === "image") {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${href}" alt="${displayName}"></a>`;
    }

    if (node.fileKind === "markdown") {
      const preview = node.previewHtml
        ? `<div class="md-card-preview">${node.previewHtml}</div>`
        : (node.previewText ? `<p class="md-card-preview-text">${escapeHtml(node.previewText)}</p>` : "");

      return `<div class="md-card"><a class="md-card-title-link" href="${href}" target="_blank" rel="noopener noreferrer"><div class="md-card-title">${displayName}</div></a>${preview}</div>`;
    }

    if (node.fileKind === "pdf") {
      const pdfHref = escapeAttribute(node.exportPath || node.file || "");
      if (!pdfHref) return "<p>Leerer PDF-Knoten</p>";
      const viewerHref = escapeAttribute(node.canvasHref || node.exportPath || node.file || "");
      const pdfTitle = escapeHtml(node.displayName || node.file || "PDF");
      const pdfTitleAttr = escapeAttribute(node.displayName || node.file || "PDF");
      return `<div class="pdf-embed"><a class="pdf-title-link" href="${viewerHref}" target="_blank" rel="noopener noreferrer"><div class="pdf-title">${pdfTitle}</div></a><iframe src="${pdfHref}" title="${pdfTitleAttr}" loading="lazy"></iframe></div>`;
    }

    if (!href) return "<p>Leerer Datei-Knoten</p>";
    return `<p><a class="file-chip" href="${href}" target="_blank" rel="noopener noreferrer">${displayName}</a></p>`;
  }

  const text = typeof node.text === "string" ? node.text : "";
  if (!text.trim()) return "";
  return markdownToHtml(text, { darkMode });
}

export async function markdownToHtml(markdown: string, options: MarkdownRenderOptions = {}): Promise<string> {
  if (!markdown) return "";

  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
  const headingIds = new Map<string, number>();
  const darkMode = options.darkMode ?? true;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (parseStandaloneBlockRef(trimmed)) {
      i += 1;
      continue;
    }

    // Single-line block math: $$content$$
    const singleBlockMath = trimmed.match(/^\$\$(.+)\$\$$/);
    if (singleBlockMath) {
      let html = renderMath(singleBlockMath[1].trim(), true);
      i += 1;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    // Multi-line block math: $$ ... $$
    if (trimmed === "$$") {
      i += 1;
      const mathLines: string[] = [];
      while (i < lines.length && lines[i]?.trim() !== "$$") {
        mathLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      let html = renderMath(mathLines.join("\n"), true);
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    const fence = trimmed.match(/^```([^\s`]+)?\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? "")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      let html = await renderCodeBlock(codeLines.join("\n"), lang, darkMode);
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
      let html = "<hr>";
      i += 1;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const headingText = heading[2].trim();
      const headingId = buildHeadingId(headingText, headingIds);
      const idAttr = headingId ? ` id="${escapeAttribute(headingId)}"` : "";
      let html = `<h${level}${idAttr}>${renderInline(headingText)}</h${level}>`;
      i += 1;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? "";
        const currentTrimmed = current.trim();
        if (!currentTrimmed) {
          break;
        }
        if (!/^>\s?/.test(currentTrimmed)) break;
        quoteLines.push(current.replace(/^\s*>\s?/, ""));
        i += 1;
      }
      const firstLine = quoteLines[0] ?? "";
      const calloutIcons: Record<string, string> = {
        note: "✎", abstract: "≡", summary: "≡", tldr: "≡",
        info: "ℹ", todo: "☐",
        tip: "🔥", hint: "🔥", important: "🔥",
        success: "✓", check: "✓", done: "✓",
        question: "?", help: "?", faq: "?",
        warning: "⚠", caution: "⚠", attention: "⚠",
        failure: "✗", fail: "✗", missing: "✗",
        danger: "⚡", error: "⚡", bug: "✗",
        example: "≫", quote: "❝", cite: "❝",
      };
      const calloutMatch = firstLine.match(/^\[!([\w-]+)\]([+-])?(?:\s+(.*))?$/i);
      if (calloutMatch) {
        const type = calloutMatch[1].toLowerCase();
        const indicator = calloutMatch[2];
        const title = calloutMatch[3]?.trim() || (type.charAt(0).toUpperCase() + type.slice(1));
        const icon = calloutIcons[type] ?? "◆";
        const contentLines = quoteLines.slice(1);
        const inner = await markdownToHtml(contentLines.join("\n"), { darkMode });
        if (indicator === "+" || indicator === "-") {
          const openAttr = indicator === "+" ? " open" : "";
          let html = `<details class="callout callout-${escapeAttribute(type)}"${openAttr}><summary class="callout-title"><span class="callout-icon">${icon}</span>${escapeHtml(title)}</summary><div class="callout-content">${inner}</div></details>`;
          const blockAnchor = consumeFollowingBlockAnchor(lines, i);
          html = applyBlockAnchor(html, blockAnchor.anchorId);
          i = blockAnchor.nextIndex;
          out.push(html);
        } else {
          let html = `<div class="callout callout-${escapeAttribute(type)}"><div class="callout-title"><span class="callout-icon">${icon}</span>${escapeHtml(title)}</div><div class="callout-content">${inner}</div></div>`;
          const blockAnchor = consumeFollowingBlockAnchor(lines, i);
          html = applyBlockAnchor(html, blockAnchor.anchorId);
          i = blockAnchor.nextIndex;
          out.push(html);
        }
      } else {
        const inner = await markdownToHtml(quoteLines.join("\n"), { darkMode });
        let html = `<blockquote>${inner}</blockquote>`;
        const blockAnchor = consumeFollowingBlockAnchor(lines, i);
        html = applyBlockAnchor(html, blockAnchor.anchorId);
        i = blockAnchor.nextIndex;
        out.push(html);
      }
      continue;
    }

    if (isTableStart(lines, i)) {
      const table = renderTable(lines, i);
      let html = table.html;
      i = table.nextIndex;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      let html = `<ul>${items.map((item) => `<li>${renderInline(item.trim())}</li>`).join("")}</ul>`;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      let html = `<ol>${items.map((item) => `<li>${renderInline(item.trim())}</li>`).join("")}</ol>`;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      const currentTrimmed = current.trim();
      if (!currentTrimmed) break;
      if (/^(#{1,6})\s+/.test(currentTrimmed)) break;
      if (/^```/.test(currentTrimmed)) break;
      if (/^\$\$/.test(currentTrimmed)) break;
      if (/^>\s?/.test(currentTrimmed)) break;
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(currentTrimmed)) break;
      if (/^[-*+]\s+/.test(currentTrimmed)) break;
      if (/^\d+\.\s+/.test(currentTrimmed)) break;
      if (isTableStart(lines, i)) break;
      if (parseStandaloneBlockRef(currentTrimmed)) break;
      paraLines.push(current.replace(/\s+$/, ""));
      i += 1;
    }
    let html = `<p>${renderParagraphLines(paraLines)}</p>`;
    const blockAnchor = consumeFollowingBlockAnchor(lines, i);
    html = applyBlockAnchor(html, blockAnchor.anchorId);
    i = blockAnchor.nextIndex;
    out.push(html);
  }

  return out.join("\n");
}

function renderParagraphLines(lines: string[]): string {
  return renderInline(lines.join("\n")).replace(/\n/g, "<br>\n");
}

function parseStandaloneBlockRef(value: string): string | null {
  const match = /^\^([A-Za-z0-9_-]+)$/.exec(String(value || "").trim());
  return match ? match[1] : null;
}

function consumeFollowingBlockAnchor(lines: string[], index: number): { anchorId: string; nextIndex: number } {
  const blockRef = parseStandaloneBlockRef(lines[index] ?? "");
  if (!blockRef) {
    return { anchorId: "", nextIndex: index };
  }
  return { anchorId: buildBlockAnchorId(blockRef), nextIndex: index + 1 };
}

function applyBlockAnchor(html: string, anchorId: string): string {
  if (!anchorId) return html;
  const openingTag = /^<([a-z0-9-]+)([^>]*)>/i;
  const match = openingTag.exec(html);
  if (!match) return html;
  if (/\sid=/.test(match[0])) {
    return `<div id="${escapeAttribute(anchorId)}">${html}</div>`;
  }
  return html.replace(openingTag, `<$1$2 id="${escapeAttribute(anchorId)}">`);
}

function isTableStart(lines: string[], index: number): boolean {
  const header = (lines[index] ?? "").trim();
  const separator = (lines[index + 1] ?? "").trim();
  if (!header.includes("|") || !separator.includes("|")) return false;
  const cells = splitTableRow(separator);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function renderTable(lines: string[], index: number): { html: string; nextIndex: number } {
  const headers = splitTableRow(lines[index] ?? "").map((cell) => renderInline(cell.trim()));
  const alignSpec = splitTableRow(lines[index + 1] ?? "").map((cell) => cell.trim());
  const alignAttrs = alignSpec.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return ' style="text-align:center"';
    if (right) return ' style="text-align:right"';
    return "";
  });

  const rows: string[] = [];
  let i = index + 2;
  while (i < lines.length) {
    const raw = (lines[i] ?? "").trim();
    if (!raw || !raw.includes("|")) break;
    const cells = splitTableRow(lines[i] ?? "");
    rows.push(`<tr>${cells.map((cell, idx) => `<td${alignAttrs[idx] || ""}>${renderInline(cell.trim())}</td>`).join("")}</tr>`);
    i += 1;
  }

  const thead = `<thead><tr>${headers.map((cell, idx) => `<th${alignAttrs[idx] || ""}>${cell}</th>`).join("")}</tr></thead>`;
  const tbody = rows.length ? `<tbody>${rows.join("")}</tbody>` : "";
  return { html: `<table>${thead}${tbody}</table>`, nextIndex: i };
}

function splitTableRow(row: string): string[] {
  let text = row.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|")) text = text.slice(0, -1);
  return text.split("|");
}

function renderInline(text: string): string {
  const codeStore: string[] = [];
  const withCodePlaceholders = text.replace(/`([^`]+)`/g, (_match, content) => {
    codeStore.push(`<code>${escapeHtml(content)}</code>`);
    return `@@CODE_${codeStore.length - 1}@@`;
  });

  const escapedDollarStore: string[] = [];
  const withEscapedDollarPlaceholders = withCodePlaceholders.replace(/\\\$/g, () => {
    escapedDollarStore.push("$");
    return `@@EDOLLAR_${escapedDollarStore.length - 1}@@`;
  });

  const mediaStore: string[] = [];
  const withMediaPlaceholders = replaceMarkdownMedia(withEscapedDollarPlaceholders, mediaStore);

  // Extract inline math before HTML escaping to protect LaTeX content.
  // Code spans are already protected above and must remain literal.
  const mathStore: string[] = [];
  const withMathPlaceholders = withMediaPlaceholders.replace(
    /(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g,
    (_match, content) => {
      mathStore.push(renderMath(content.trim(), false));
      return `@@MATH_${mathStore.length - 1}@@`;
    },
  );

  let html = escapeHtml(withMathPlaceholders);
  html = html.replace(
    /(^|[\s(>])((?:https?:\/\/|mailto:|file:)[^\s<]*[^\s<.,:;"')\]\}])/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>',
  );
  html = html.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[[$1|$2]]");
  html = html.replace(/\[\[([^\]]+)\]\]/g, "[[$1]]");
  html = html.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s(\[{>])\*([^*\n]+)\*(?=$|[\s)\]}<.,!?;:])/g, '$1<em>$2</em>');
  html = html.replace(/(^|[\s(\[{>])_([^_\n]+)_(?=$|[\s)\]}<.,!?;:])/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  if (codeStore.length > 0) {
    html = html.replace(/@@CODE_(\d+)@@/g, (_m, idx) => codeStore[parseInt(idx, 10)] ?? "");
  }
  if (mediaStore.length > 0) {
    html = html.replace(/@@MEDIA_(\d+)@@/g, (_m, idx) => mediaStore[parseInt(idx, 10)] ?? "");
  }
  if (escapedDollarStore.length > 0) {
    html = html.replace(/@@EDOLLAR_(\d+)@@/g, (_m, idx) => escapedDollarStore[parseInt(idx, 10)] ?? "$");
  }
  // Restore inline math after text-level markdown transforms.
  if (mathStore.length > 0) {
    html = html.replace(/@@MATH_(\d+)@@/g, (_m, idx) => mathStore[parseInt(idx, 10)] ?? "");
  }
  return html;
}

function replaceMarkdownMedia(text: string, mediaStore: string[]): string {
  let out = "";
  let i = 0;

  while (i < text.length) {
    const imageMatch = tryParseMarkdownMedia(text, i, true);
    if (imageMatch) {
      mediaStore.push(`<img src="${escapeAttribute(imageMatch.target)}" alt="${escapeAttribute(imageMatch.label)}">`);
      out += `@@MEDIA_${mediaStore.length - 1}@@`;
      i = imageMatch.end;
      continue;
    }

    const linkMatch = tryParseMarkdownMedia(text, i, false);
    if (linkMatch) {
      mediaStore.push(
        `<a href="${escapeAttribute(linkMatch.target)}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkMatch.label)}</a>`,
      );
      out += `@@MEDIA_${mediaStore.length - 1}@@`;
      i = linkMatch.end;
      continue;
    }

    out += text[i];
    i += 1;
  }

  return out;
}

function tryParseMarkdownMedia(
  text: string,
  start: number,
  isImage: boolean,
): { label: string; target: string; end: number } | null {
  const prefix = isImage ? "![" : "[";
  if (!text.startsWith(prefix, start)) return null;

  const labelStart = start + prefix.length;
  const labelEnd = text.indexOf("]", labelStart);
  if (labelEnd < 0 || text[labelEnd + 1] !== "(") return null;

  let depth = 1;
  let pos = labelEnd + 2;
  while (pos < text.length) {
    const ch = text[pos];
    if (ch === "\\") {
      pos += 2;
      continue;
    }
    if (ch === "(") depth += 1;
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          label: text.slice(labelStart, labelEnd),
          target: text.slice(labelEnd + 2, pos),
          end: pos + 1,
        };
      }
    }
    pos += 1;
  }

  return null;
}

function getBounds(nodes: CanvasNode[]): { width: number; height: number; offsetX: number; offsetY: number } {
  if (nodes.length === 0) {
    return { width: 1200, height: 800, offsetX: 120, offsetY: 120 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const x = normalizeNumber(node.x);
    const y = normalizeNumber(node.y);
    const width = Math.max(120, normalizeNumber(node.width));
    const height = Math.max(60, normalizeNumber(node.height));
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  }

  const padding = 120;
  const offsetX = padding - minX;
  const offsetY = padding - minY;

  return {
    width: Math.max(1200, Math.ceil(maxX - minX + padding * 2)),
    height: Math.max(800, Math.ceil(maxY - minY + padding * 2)),
    offsetX,
    offsetY,
  };
}

function buildHeadingId(text: string, seen: Map<string, number>): string {
  const base = normalizeHeadingId(text);
  if (!base) return "";
  const current = seen.get(base) ?? 0;
  seen.set(base, current + 1);
  return current === 0 ? base : `${base}-${current}`;
}

function normalizeHeadingId(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

export function buildBlockAnchorId(value: string): string {
  const raw = String(value || "").trim().replace(/^#?\^/, "");
  const normalized = raw.replace(/[^A-Za-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^[-]+|[-]+$/g, "");
  return normalized ? `block-${normalized}` : "";
}

function getNodePalette(color: string | undefined, darkMode: boolean): NodePalette {
  const normalized = (color || "").trim();

  if (normalized && OBSIDIAN_COLORS[normalized]) {
    return OBSIDIAN_COLORS[normalized];
  }

  if (normalized.startsWith("#")) {
    return { background: `${normalized}22`, border: normalized };
  }

  return darkMode
    ? { background: "#2b2f36", border: "#4a5565" }
    : { background: "#ffffff", border: "#c8d0da" };
}

export function buildCanvasColorVariables(canvasColors?: Record<string, string>): string {
  const parts: string[] = [];
  const source = canvasColors ?? {};
  for (const [key, raw] of Object.entries(source)) {
    const normalizedKey = String(key).trim();
    if (!normalizedKey) continue;
    const color = normalizeCssColorValue(raw);
    if (!color) continue;
    const bg = toSoftBackground(color);
    parts.push(`--canvas-color-${normalizedKey}: ${color};`);
    parts.push(`--canvas-color-${normalizedKey}-bg: ${bg};`);
  }
  return parts.join(" ");
}

function normalizeCssColorValue(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^rgba?\(/i.test(raw) || /^hsla?\(/i.test(raw) || raw.startsWith("#")) {
    return raw;
  }
  const rgbMatch = raw.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?$/);
  if (rgbMatch) {
    const r = clampColor(rgbMatch[1]);
    const g = clampColor(rgbMatch[2]);
    const b = clampColor(rgbMatch[3]);
    if (typeof rgbMatch[4] === "string") {
      const a = Math.max(0, Math.min(1, Number(rgbMatch[4])));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }
  return raw;
}

function clampColor(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toSoftBackground(color: string): string {
  const rgba = colorToRgba(color);
  if (!rgba) return color;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0.18)`;
}

function colorToRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const raw = color.trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const value = hex[1];
    if (value.length === 3 || value.length === 4) {
      const r = parseInt(value[0] + value[0], 16);
      const g = parseInt(value[1] + value[1], 16);
      const b = parseInt(value[2] + value[2], 16);
      const a = value.length === 4 ? parseInt(value[3] + value[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  const rgba = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1].split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const r = clampColor(parts[0]);
      const g = clampColor(parts[1]);
      const b = clampColor(parts[2]);
      const a = parts.length >= 4 ? Math.max(0, Math.min(1, Number(parts[3]))) : 1;
      return { r, g, b, a };
    }
  }
  return null;
}

function getTheme(darkMode: boolean) {
  return darkMode
    ? {
        darkMode: true,
        bodyBackground: "#15181d",
        canvasBackground: "#1d2229",
        canvasBorder: "#313843",
        text: "#e7edf5",
        mutedText: "#aeb8c5",
        nodeBackground: "#2b2f36",
        nodeBorder: "#4a5565",
        groupBackground: "rgba(255,255,255,0.03)",
        groupBorder: "#596273",
        link: "#7cb7ff",
        edge: "#7cb7ff",
        rule: "#404855",
        inlineCodeBackground: "rgba(255,255,255,0.08)",
        codeBlockBackground: "rgba(0,0,0,0.28)",
        chipBackground: "rgba(255,255,255,0.06)",
      }
    : {
        darkMode: false,
        bodyBackground: "#f4f6f9",
        canvasBackground: "#ffffff",
        canvasBorder: "#d6dde7",
        text: "#24303d",
        mutedText: "#5f6b7a",
        nodeBackground: "#ffffff",
        nodeBorder: "#c8d0da",
        groupBackground: "rgba(0,0,0,0.03)",
        groupBorder: "#aab5c4",
        link: "#1967d2",
        edge: "#1967d2",
        rule: "#d6dde7",
        inlineCodeBackground: "rgba(0,0,0,0.06)",
        codeBlockBackground: "rgba(0,0,0,0.05)",
        chipBackground: "rgba(0,0,0,0.04)",
      };
}

function normalizeSide(side: string | undefined): "top" | "bottom" | "left" | "right" {
  if (side === "top" || side === "bottom" || side === "left" || side === "right") {
    return side;
  }
  return "right";
}

function normalizeEdgeEnd(end: string | undefined, fallback: "none" | "arrow"): "none" | "arrow" | "triangle" | "circle" | "diamond" | "square" | "bar" {
  const value = String(end || "").trim().toLowerCase();
  if (!value) return fallback;
  if (value === "none") return "none";
  if (value.includes("diamond")) return "diamond";
  if (value.includes("square")) return "square";
  if (value.includes("circle") || value.includes("dot")) return "circle";
  if (value.includes("bar") || value.includes("line")) return "bar";
  if (value.includes("triangle")) return "triangle";
  if (value.includes("arrow")) return "arrow";
  return fallback;
}

function normalizeEdgeLineStyle(style: string | undefined): "solid" | "dashed" | "dotted" | "short-dash" | "dash-dot" {
  const value = String(style || "").trim().toLowerCase();
  if (!value) return "solid";
  if (value.includes("dash") && value.includes("dot")) return "dash-dot";
  if (value.includes("short")) return "short-dash";
  if (value.includes("dot")) return "dotted";
  if (value.includes("dash")) return "dashed";
  return "solid";
}

function normalizeEdgeWidth(width: number | undefined): number {
  const value = Number(width);
  return Number.isFinite(value) ? Math.max(1, value) : 2;
}

function normalizeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
}

function renderMath(content: string, displayMode: boolean): string {
  try {
    return katex.renderToString(content, {
      output: "mathml",
      displayMode,
      throwOnError: true,
    });
  } catch {
    return `<code>${escapeHtml(content)}</code>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(text: string): string {
  return escapeHtml(text).replace(/`/g, "&#96;");
}
