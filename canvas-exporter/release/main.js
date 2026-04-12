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
var import_obsidian2 = require("obsidian");

// src/converter.ts
var OBSIDIAN_COLORS = {
  "1": { background: "#e6324222", border: "#e63242" },
  // red
  "2": { background: "#fa8d3e22", border: "#fa8d3e" },
  // orange
  "3": { background: "#f9c74f22", border: "#f9c74f" },
  // yellow
  "4": { background: "#56ae6c22", border: "#56ae6c" },
  // green
  "5": { background: "#04a5e522", border: "#04a5e5" },
  // cyan  (--color-cyan-rgb: 4, 165, 229)
  "6": { background: "#9c6bae22", border: "#9c6bae" }
  // purple
};
function convertCanvasToHtml(data, options) {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const bounds = getBounds(nodes);
  const theme = getTheme(options.darkMode);
  const nodeHtml = nodes.map((node) => renderNode(node, bounds.offsetX, bounds.offsetY, theme, options.canvasColors)).join("\n");
  const edgesData = edges.map((edge) => ({
    fromId: edge.fromNode,
    toId: edge.toNode,
    fromSide: normalizeSide(edge.fromSide),
    toSide: normalizeSide(edge.toSide),
    label: edge.label ?? "",
    color: edge.color ?? ""
  }));
  const canvasColorVars = buildCanvasColorVariables(options.canvasColors);
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="./">
  <title>${escapeHtml(options.title)}</title>
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
    .node-content pre {
      margin: 0.7em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    .node-content pre code {
      padding: 0;
      background: transparent;
    }
    .node-content blockquote {
      margin: 0.7em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
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
    <button type="button" onclick="zoomBy(1 / 1.15)">Zoom \u2212</button>
    <button type="button" onclick="resetZoom()">Reset</button>
  </div>
  <div class="page-header">
    <h1>${escapeHtml(options.title)}</h1>
    <p>${nodes.length} Knoten \xB7 ${edges.length} Verbindungen</p>
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

      function createMarker(defs, id, fill) {
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", id);
        marker.setAttribute("viewBox", "0 0 8 8");
        marker.setAttribute("markerWidth", "15");
        marker.setAttribute("markerHeight", "13");
        marker.setAttribute("refX", "8");
        marker.setAttribute("refY", "4");
        marker.setAttribute("orient", "auto");
        marker.setAttribute("markerUnits", "userSpaceOnUse");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "0 0, 8 4, 0 8");
        polygon.setAttribute("fill", fill);
        marker.appendChild(polygon);
        defs.appendChild(marker);
      }

      function markerIdForColor(color) {
        return "marker-" + color.replace(/[^a-zA-Z0-9]/g, "_");
      }

      function drawEdges() {
        edgeLayer.innerHTML = "";
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        edgeLayer.appendChild(defs);
        const seenColors = new Set();

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
          const markerId = markerIdForColor(color);
          if (!seenColors.has(markerId)) {
            createMarker(defs, markerId, color);
            seenColors.add(markerId);
          }

          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", "M " + start.x + " " + start.y + " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + end.x + " " + end.y);
          path.setAttribute("fill", "none");
          path.setAttribute("stroke", color);
          path.setAttribute("stroke-width", "2");
          path.setAttribute("marker-end", "url(#" + markerId + ")");
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

      drawEdges();
      window.resetZoom();
      window.addEventListener("resize", () => {
        drawEdges();
        window.resetZoom();
      });
    })();
  </script>
</body>
</html>`;
}
function buildMarkdownDocumentHtml(title, bodyHtml, darkMode, canvasColors) {
  const theme = getTheme(darkMode);
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root { ${buildCanvasColorVariables(canvasColors)} }
    html, body { margin: 0; padding: 0; }
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
    pre {
      margin: 0.9em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    pre code { padding: 0; background: transparent; }
    blockquote {
      margin: 0.9em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
    hr { border: none; border-top: 1px solid ${theme.rule}; margin: 1em 0; }
    img { display: block; max-width: 100%; border-radius: 8px; margin: 0.8em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    th, td { border: 1px solid ${theme.canvasBorder}; padding: 8px 10px; text-align: left; }
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
function renderNode(node, offsetX, offsetY, theme, canvasColors) {
  const left = normalizeNumber(node.x) + offsetX;
  const top = normalizeNumber(node.y) + offsetY;
  const width = Math.max(120, normalizeNumber(node.width));
  const height = Math.max(60, normalizeNumber(node.height));
  const type = (node.type || "text").toLowerCase();
  const classes = ["node", escapeAttribute(type === "group" ? "group" : "")].filter(Boolean).join(" ");
  const title = node.label ? `<div class="node-title">${markdownToHtml(node.label)}</div>` : "";
  const content = renderNodeContent(node);
  const colorKey = String(node.color || "").trim();
  const isNumericColor = /^\d+$/.test(colorKey);
  let background;
  let border;
  if (type === "group") {
    background = theme.groupBackground;
    border = theme.groupBorder;
  } else if (isNumericColor && canvasColors && canvasColors[colorKey]) {
    const bgVar = `--canvas-color-${colorKey}-bg`;
    const borderVar = `--canvas-color-${colorKey}`;
    const fallbackPalette = OBSIDIAN_COLORS[colorKey] || { background: theme.nodeBackground, border: theme.nodeBorder };
    background = `var(${bgVar}, ${fallbackPalette.background})`;
    border = `var(${borderVar}, ${fallbackPalette.border})`;
  } else if (isNumericColor) {
    const palette = OBSIDIAN_COLORS[colorKey] || { background: theme.nodeBackground, border: theme.nodeBorder };
    background = palette.background;
    border = palette.border;
  } else if (colorKey.startsWith("#")) {
    background = `${colorKey}22`;
    border = colorKey;
  } else {
    background = theme.nodeBackground;
    border = theme.nodeBorder;
  }
  return `<div
    id="node-${escapeAttribute(node.id)}"
    class="${classes}"
    style="left:${left}px;top:${top}px;width:${width}px;height:${height}px;background:${background};border-color:${border};"
  >${title}<div class="node-content">${content}</div></div>`;
}
function renderNodeContent(node) {
  const type = (node.type || "text").toLowerCase();
  if (type === "group") {
    return node.text ? markdownToHtml(node.text) : "";
  }
  if (type === "link") {
    const url = typeof node.url === "string" ? node.url.trim() : "";
    if (!url)
      return "<p>Leerer Link-Knoten</p>";
    const label = escapeHtml(node.label || url);
    return `<p><a class="link-chip" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a></p>`;
  }
  if (type === "file") {
    const displayName = escapeHtml(node.displayName || node.file || "Datei");
    const href = escapeAttribute(
      node.fileKind === "markdown" && node.canvasHref ? node.canvasHref : node.exportHtmlPath || node.exportPath || node.file || ""
    );
    if (node.fileKind === "image") {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${href}" alt="${displayName}"></a>`;
    }
    if (node.fileKind === "markdown") {
      const preview = node.previewHtml ? `<div class="md-card-preview">${node.previewHtml}</div>` : node.previewText ? `<p class="md-card-preview-text">${escapeHtml(node.previewText)}</p>` : "";
      return `<div class="md-card"><a class="md-card-title-link" href="${href}" target="_blank" rel="noopener noreferrer"><div class="md-card-title">${displayName}</div></a>${preview}</div>`;
    }
    if (!href)
      return "<p>Leerer Datei-Knoten</p>";
    return `<p><a class="file-chip" href="${href}" target="_blank" rel="noopener noreferrer">${displayName}</a></p>`;
  }
  const text = typeof node.text === "string" ? node.text : "";
  if (!text.trim())
    return "";
  return markdownToHtml(text);
}
function markdownToHtml(markdown) {
  if (!markdown)
    return "";
  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }
    const fence = trimmed.match(/^```([\w-]+)?\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      i += 1;
      const codeLines = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? "")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length)
        i += 1;
      const className = lang ? ` class="language-${escapeAttribute(lang)}"` : "";
      out.push(`<pre><code${className}>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
      out.push("<hr>");
      i += 1;
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i += 1;
      continue;
    }
    if (/^>\s?/.test(trimmed)) {
      const quoteLines = [];
      while (i < lines.length) {
        const current = lines[i] ?? "";
        const currentTrimmed = current.trim();
        if (!currentTrimmed) {
          quoteLines.push("");
          i += 1;
          continue;
        }
        if (!/^>\s?/.test(currentTrimmed))
          break;
        quoteLines.push(current.replace(/^\s*>\s?/, ""));
        i += 1;
      }
      const inner = markdownToHtml(quoteLines.join("\n"));
      out.push(`<blockquote>${inner}</blockquote>`);
      continue;
    }
    if (isTableStart(lines, i)) {
      const table = renderTable(lines, i);
      out.push(table.html);
      i = table.nextIndex;
      continue;
    }
    if (/^[-*+]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      out.push(`<ul>${items.map((item) => `<li>${renderInline(item.trim())}</li>`).join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      out.push(`<ol>${items.map((item) => `<li>${renderInline(item.trim())}</li>`).join("")}</ol>`);
      continue;
    }
    const paraLines = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      const currentTrimmed = current.trim();
      if (!currentTrimmed)
        break;
      if (/^(#{1,6})\s+/.test(currentTrimmed))
        break;
      if (/^```/.test(currentTrimmed))
        break;
      if (/^>\s?/.test(currentTrimmed))
        break;
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(currentTrimmed))
        break;
      if (/^[-*+]\s+/.test(currentTrimmed))
        break;
      if (/^\d+\.\s+/.test(currentTrimmed))
        break;
      if (isTableStart(lines, i))
        break;
      paraLines.push(current.replace(/\s+$/, ""));
      i += 1;
    }
    out.push(`<p>${renderParagraphLines(paraLines)}</p>`);
  }
  return out.join("\n");
}
function renderParagraphLines(lines) {
  return renderInline(lines.join("\n")).replace(/\n/g, "<br>\n");
}
function isTableStart(lines, index) {
  const header = (lines[index] ?? "").trim();
  const separator = (lines[index + 1] ?? "").trim();
  if (!header.includes("|") || !separator.includes("|"))
    return false;
  const cells = splitTableRow(separator);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}
function renderTable(lines, index) {
  const headers = splitTableRow(lines[index] ?? "").map((cell) => renderInline(cell.trim()));
  const alignSpec = splitTableRow(lines[index + 1] ?? "").map((cell) => cell.trim());
  const alignAttrs = alignSpec.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right)
      return ' style="text-align:center"';
    if (right)
      return ' style="text-align:right"';
    return "";
  });
  const rows = [];
  let i = index + 2;
  while (i < lines.length) {
    const raw = (lines[i] ?? "").trim();
    if (!raw || !raw.includes("|"))
      break;
    const cells = splitTableRow(lines[i] ?? "");
    rows.push(`<tr>${cells.map((cell, idx) => `<td${alignAttrs[idx] || ""}>${renderInline(cell.trim())}</td>`).join("")}</tr>`);
    i += 1;
  }
  const thead = `<thead><tr>${headers.map((cell, idx) => `<th${alignAttrs[idx] || ""}>${cell}</th>`).join("")}</tr></thead>`;
  const tbody = rows.length ? `<tbody>${rows.join("")}</tbody>` : "";
  return { html: `<table>${thead}${tbody}</table>`, nextIndex: i };
}
function splitTableRow(row) {
  let text = row.trim();
  if (text.startsWith("|"))
    text = text.slice(1);
  if (text.endsWith("|"))
    text = text.slice(0, -1);
  return text.split("|");
}
function renderInline(text) {
  let html = escapeHtml(text);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[[$1|$2]]");
  html = html.replace(/\[\[([^\]]+)\]\]/g, "[[$1]]");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*\*([^*\n]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/___([^_\n]+)___/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__([^_\n]+)__/g, "<strong>$1</strong>");
  html = html.replace(/(^|[\s(\[{>])\*([^*\n]+)\*(?=$|[\s)\]}<.,!?;:])/g, "$1<em>$2</em>");
  html = html.replace(/(^|[\s(\[{>])_([^_\n]+)_(?=$|[\s)\]}<.,!?;:])/g, "$1<em>$2</em>");
  html = html.replace(/~~([^~\n]+)~~/g, "<del>$1</del>");
  return html;
}
function getBounds(nodes) {
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
    offsetY
  };
}
function buildCanvasColorVariables(canvasColors) {
  const parts = [];
  const source = canvasColors ?? {};
  for (const [key, raw] of Object.entries(source)) {
    const normalizedKey = String(key).trim();
    if (!normalizedKey)
      continue;
    const color = normalizeCssColorValue(raw);
    if (!color)
      continue;
    const bg = toSoftBackground(color);
    parts.push(`--canvas-color-${normalizedKey}: ${color};`);
    parts.push(`--canvas-color-${normalizedKey}-bg: ${bg};`);
  }
  return parts.join(" ");
}
function normalizeCssColorValue(value) {
  const raw = String(value || "").trim();
  if (!raw)
    return "";
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
function clampColor(value) {
  const n = Number(value);
  if (!Number.isFinite(n))
    return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}
function toSoftBackground(color) {
  const rgba = colorToRgba(color);
  if (!rgba)
    return color;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0.18)`;
}
function colorToRgba(color) {
  const raw = color.trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const value = hex[1];
    if (value.length === 3 || value.length === 4) {
      const r2 = parseInt(value[0] + value[0], 16);
      const g2 = parseInt(value[1] + value[1], 16);
      const b2 = parseInt(value[2] + value[2], 16);
      const a2 = value.length === 4 ? parseInt(value[3] + value[3], 16) / 255 : 1;
      return { r: r2, g: g2, b: b2, a: a2 };
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
function getTheme(darkMode) {
  return darkMode ? {
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
    chipBackground: "rgba(255,255,255,0.06)"
  } : {
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
    chipBackground: "rgba(0,0,0,0.04)"
  };
}
function normalizeSide(side) {
  if (side === "top" || side === "bottom" || side === "left" || side === "right") {
    return side;
  }
  return "right";
}
function normalizeNumber(value) {
  return Number.isFinite(value) ? Number(value) : 0;
}
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}
function escapeAttribute(text) {
  return escapeHtml(text).replace(/`/g, "&#96;");
}

// src/exporter.ts
var import_obsidian = require("obsidian");
function stripFrontmatter(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return markdown;
  }
  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return markdown;
  }
  return normalized.slice(end + 5).replace(/^\n+/, "");
}
function normalizeExportHref(href) {
  return (0, import_obsidian.normalizePath)(href).replace(/^\/+/, "");
}
async function exportCanvasPackage(app, canvasFile, settings) {
  const rawContent = await app.vault.read(canvasFile);
  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`Ung\xFCltiges Canvas-JSON in ${canvasFile.path}`);
  }
  const baseFolder = normalizeFolder(settings.outputDir);
  await ensureFolderExists(app, baseFolder);
  const exportFolder = (0, import_obsidian.normalizePath)(`${baseFolder}/${safeSegment(canvasFile.basename)}`);
  const assetsDir = (0, import_obsidian.normalizePath)(`${exportFolder}/assets`);
  const imagesDir = (0, import_obsidian.normalizePath)(`${assetsDir}/images`);
  const filesDir = (0, import_obsidian.normalizePath)(`${assetsDir}/files`);
  await ensureFolderExists(app, exportFolder);
  await ensureFolderExists(app, assetsDir);
  await ensureFolderExists(app, imagesDir);
  await ensureFolderExists(app, filesDir);
  const normalized = normalizeCanvasData(parsed, canvasFile.basename);
  const nodes = normalized.nodes;
  const edges = normalized.edges;
  const title = normalized.name || canvasFile.basename;
  const ctx = {
    app,
    outputRoot: exportFolder,
    assetsFilesDir: filesDir,
    assetsImagesDir: imagesDir,
    darkMode: settings.darkMode,
    fileMap: /* @__PURE__ */ new Map(),
    htmlMap: /* @__PURE__ */ new Map(),
    counter: 0,
    pageStack: /* @__PURE__ */ new Set(),
    inlineStack: /* @__PURE__ */ new Set(),
    canvasColors: settings.canvasColors
  };
  const preparedNodes = [];
  for (const node of nodes) {
    preparedNodes.push(await prepareNode(ctx, node));
  }
  const nodeIds = new Set(preparedNodes.map((node) => node.id));
  const preparedEdges = edges.filter((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode));
  return {
    folderPath: exportFolder,
    data: { nodes: preparedNodes, edges: preparedEdges, name: title },
    options: { darkMode: settings.darkMode, title }
  };
}
async function prepareNode(ctx, node) {
  if ((node.type || "").toLowerCase() !== "file") {
    return { ...node };
  }
  const sourcePath = typeof node.file === "string" ? node.file.trim() : "";
  if (!sourcePath)
    return { ...node };
  const file = resolveVaultFile(ctx.app, sourcePath);
  if (!(file instanceof import_obsidian.TFile)) {
    return { ...node, displayName: sourcePath, fileKind: "file" };
  }
  const ext = file.extension.toLowerCase();
  if (isImageExt(ext)) {
    const exportPath2 = await copyVaultFile(ctx, file, "image");
    return {
      ...node,
      displayName: file.name,
      fileKind: "image",
      exportPath: exportPath2
    };
  }
  if (ext === "md") {
    let exportHtmlPath;
    let previewText;
    let previewHtml;
    let canvasHref;
    try {
      exportHtmlPath = await exportMarkdownNote(ctx, file);
      if (exportHtmlPath) {
        const outputName = exportHtmlPath.split("/").pop() || exportHtmlPath;
        canvasHref = normalizeExportHref(`assets/files/${outputName}`);
      }
    } catch (error) {
      console.error(`[canvas-exporter] Markdown-Seitenexport fehlgeschlagen f\xFCr ${file.path}`, error);
    }
    try {
      const preview = await buildMarkdownPreview(ctx, file);
      previewText = preview.text;
      previewHtml = preview.html;
    } catch (error) {
      console.error(`[canvas-exporter] Markdown-Vorschau fehlgeschlagen f\xFCr ${file.path}`, error);
    }
    if (exportHtmlPath) {
      return {
        ...node,
        displayName: file.basename,
        fileKind: "markdown",
        exportHtmlPath,
        canvasHref,
        previewText: previewText || void 0,
        previewHtml: previewHtml || void 0
      };
    }
    const fallbackExportPath = await copyVaultFile(ctx, file, "file");
    return {
      ...node,
      displayName: file.basename,
      fileKind: "file",
      exportPath: fallbackExportPath,
      previewText: previewText || void 0,
      previewHtml: previewHtml || void 0
    };
  }
  const exportPath = await copyVaultFile(ctx, file, "file");
  return {
    ...node,
    displayName: file.name,
    fileKind: ext === "pdf" ? "pdf" : "file",
    exportPath
  };
}
async function exportMarkdownNote(ctx, file) {
  return renderMarkdownFileToHtml(ctx, file, "page", "page");
}
async function exportMarkdownContentInline(ctx, file) {
  return renderMarkdownFileToHtml(ctx, file, "inline", "canvas");
}
async function exportMarkdownSectionInline(ctx, file, heading) {
  const content = stripFrontmatter(await ctx.app.vault.read(file));
  const section = extractMarkdownHeadingSection(content, heading);
  if (!section)
    return "";
  let htmlBody = markdownToHtml(section);
  htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, "inline", "canvas");
  return htmlBody;
}
function extractMarkdownHeadingSection(markdown, headingRef) {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const ref = normalizeHeadingRef(headingRef);
  if (!ref)
    return markdown;
  let start = -1;
  let level = 0;
  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i] ?? "");
    if (!m)
      continue;
    const text = m[2].trim();
    if (normalizeHeadingRef(text) === ref) {
      start = i;
      level = m[1].length;
      break;
    }
  }
  if (start < 0)
    return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i] ?? "");
    if (!m)
      continue;
    const nextLevel = m[1].length;
    if (nextLevel <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join("\n").trim();
}
function normalizeHeadingRef(value) {
  return String(value || "").trim().toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^[-]+|[-]+$/g, "");
}
async function renderMarkdownFileToHtml(ctx, file, mode, linkBase) {
  const activeStack = mode === "page" ? ctx.pageStack : ctx.inlineStack;
  const cached = mode === "page" ? ctx.htmlMap.get(file.path) : null;
  if (mode === "page" && cached)
    return cached;
  if (activeStack.has(file.path)) {
    return mode === "page" ? normalizeExportHref(ctx.htmlMap.get(file.path) || toExportRelativePath(`${ctx.assetsFilesDir}/${uniqueOutputName(ctx, file.basename, "html")}`, ctx.outputRoot)) : "";
  }
  activeStack.add(file.path);
  try {
    let outputPath = "";
    let rel = "";
    if (mode === "page") {
      const outputName = uniqueOutputName(ctx, file.basename, "html");
      outputPath = (0, import_obsidian.normalizePath)(`${ctx.assetsFilesDir}/${outputName}`);
      rel = normalizeExportHref(toExportRelativePath(outputPath, ctx.outputRoot));
      ctx.htmlMap.set(file.path, rel);
    }
    const content = stripFrontmatter(await ctx.app.vault.read(file));
    let htmlBody = markdownToHtml(content);
    htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, mode, linkBase);
    if (mode === "inline") {
      return htmlBody;
    }
    const title = file.basename;
    const htmlDoc = buildMarkdownDocumentHtml(title, htmlBody, ctx.darkMode, ctx.canvasColors);
    await writeTextFile(ctx.app, outputPath, htmlDoc);
    return rel;
  } finally {
    activeStack.delete(file.path);
  }
}
async function rewriteMarkdownHtmlAssets(ctx, sourceFile, html, mode, linkBase) {
  let result = html;
  const imgMatches = [...result.matchAll(/<img\s+src="([^"]+)"\s+alt="([^"]*)">/g)];
  for (const match of imgMatches) {
    const original = match[0];
    const target = match[1] || "";
    const { path: targetPath } = splitTargetSuffix(target);
    if (!shouldRewriteInternalTarget(targetPath))
      continue;
    const resolved = await exportInternalTarget(ctx, sourceFile, target, true, linkBase);
    if (resolved) {
      const replacement = `<img src="${escapeHtmlAttr(resolved.href)}" alt="${escapeHtmlAttr(match[2] || "")}">`;
      result = result.replace(original, replacement);
    }
  }
  const linkMatches = [...result.matchAll(/<a\s+href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
  for (const match of linkMatches) {
    const original = match[0];
    const target = match[1] || "";
    const { path: targetPath } = splitTargetSuffix(target);
    if (!shouldRewriteInternalTarget(targetPath))
      continue;
    const resolved = await exportInternalTarget(ctx, sourceFile, target, false, linkBase);
    if (resolved) {
      const label = match[3] || "";
      const attrs = match[2] || "";
      const replacement = `<a href="${escapeHtmlAttr(resolved.href)}"${attrs}>${label}</a>`;
      result = result.replace(original, replacement);
    }
  }
  result = await rewriteWikiLinks(ctx, sourceFile, result, mode, linkBase);
  return result;
}
async function rewriteWikiLinks(ctx, sourceFile, html, mode, linkBase) {
  let result = html;
  const embedMatches = [...result.matchAll(/!\[\[([^\]]+)\]\]/g)];
  for (const match of embedMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const parsed = parseWikiReference(raw);
    const target = parsed.core;
    if (!target)
      continue;
    const targetFile = resolveLinkedFileForEmbed(ctx, sourceFile, target);
    let replacement = original;
    if (!targetFile) {
      replacement = `<span class="unresolved-link">Nicht aufl\xF6sbarer Embed: ${escapeHtmlAttr(target)}</span>`;
    } else if (targetFile.extension.toLowerCase() === "md") {
      try {
        if (mode === "page") {
          await exportMarkdownNote(ctx, targetFile);
        }
        replacement = parsedTargetSection(parsed.core) ? await exportMarkdownSectionInline(ctx, targetFile, parsedTargetSection(parsed.core)) : await exportMarkdownContentInline(ctx, targetFile);
        if (!replacement) {
          replacement = `<span class="unresolved-link">Nicht aufl\xF6sbarer Embed: ${escapeHtmlAttr(target)}</span>`;
        }
      } catch (error) {
        console.error(`[canvas-exporter] Markdown-Embed-Export fehlgeschlagen f\xFCr ${targetFile.path}`, error);
        replacement = `<span class="unresolved-link">Nicht aufl\xF6sbarer Embed: ${escapeHtmlAttr(target)}</span>`;
      }
    } else if (isImageExt(targetFile.extension.toLowerCase())) {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, true, false, mode, linkBase);
      if (resolved) {
        replacement = `<img src="${escapeHtmlAttr(resolved.href)}" alt="${escapeHtmlAttr(parsed.display || targetFile.basename || target)}"${embedSizeAttributes(parsed.size)}>`;
      }
    } else {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
      if (resolved) {
        replacement = `<a href="${escapeHtmlAttr(resolved.href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlAttr(target)}</a>`;
      }
    }
    result = result.replace(original, replacement);
  }
  const wikiMatches = [...result.matchAll(/\[\[([^\]]+)\]\]/g)];
  for (const match of wikiMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const parsed = parseWikiReference(raw);
    const target = parsed.core;
    const alias = parsed.display || target;
    const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
    if (!resolved) {
      const fallback = `<span class="unresolved-link">Nicht aufl\xF6sbarer Link: ${escapeHtmlAttr(alias)}</span>`;
      result = result.replace(original, fallback);
      continue;
    }
    const replacement = `<a href="${escapeHtmlAttr(resolved.href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlAttr(alias)}</a>`;
    result = result.replace(original, replacement);
  }
  return result;
}
function resolveLinkedFileForEmbed(ctx, sourceFile, target) {
  const cleaned = splitTargetSuffix(normalizeWikiTarget(target)).path;
  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, cleaned);
  if (!(resolved instanceof import_obsidian.TFile)) {
    return null;
  }
  return resolved;
}
async function exportInternalTarget(ctx, sourceFile, rawTarget, expectImage, linkBase) {
  const resolved = await resolveObsidianTarget(ctx, sourceFile, rawTarget, expectImage, false, "page", linkBase);
  if (!resolved)
    return null;
  return resolved;
}
async function resolveObsidianTarget(ctx, sourceFile, rawTarget, expectImage, allowMarkdownEmbed, mode, linkBase) {
  const parsedTarget = parseWikiReference(rawTarget.trim());
  const target = parsedTarget.core;
  if (!target)
    return null;
  if (!shouldRewriteInternalTarget(target))
    return null;
  if (isExternalLink(target))
    return { href: target, found: true, kind: "external" };
  if (target.startsWith("#"))
    return { href: target, found: true, kind: "anchor" };
  const { path: cleaned, suffix } = splitTargetSuffix(target);
  if (!shouldRewriteInternalTarget(cleaned))
    return null;
  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, cleaned);
  if (!(resolved instanceof import_obsidian.TFile)) {
    return {
      href: `#missing-${encodeURIComponent(cleaned)}`,
      found: false,
      kind: "missing",
      displayText: cleaned
    };
  }
  if (resolved.extension.toLowerCase() === "md") {
    const cached = ctx.htmlMap.get(resolved.path);
    const exported = cached || await exportMarkdownNote(ctx, resolved);
    const href2 = linkBase === "page" ? getHrefForMarkdownPage(ctx.htmlMap.get(sourceFile.path) || "", exported) : `${exported}`;
    return { href: `${href2}${suffix}`, found: true, kind: "markdown", displayText: resolved.basename };
  }
  const rel = await copyVaultFile(ctx, resolved, expectImage || isImageExt(resolved.extension.toLowerCase()) ? "image" : "file");
  const href = linkBase === "page" ? getHrefForMarkdownPage(ctx.htmlMap.get(sourceFile.path) || "", rel) : rel;
  return {
    href: `${href}${suffix}`,
    found: true,
    kind: isImageExt(resolved.extension.toLowerCase()) ? "image" : "file",
    displayText: resolved.basename
  };
}
function getHrefForMarkdownPage(currentHtmlPath, targetHtmlPath) {
  const current = normalizeExportHref(currentHtmlPath || "");
  const target = normalizeExportHref(targetHtmlPath);
  const currentDir = current.split("/").slice(0, -1).join("/");
  const relative = currentDir ? pathRelative(currentDir, target) : target;
  return normalizeExportHref(relative);
}
function pathRelative(fromDir, toPath) {
  const fromParts = (0, import_obsidian.normalizePath)(fromDir).split("/").filter(Boolean);
  const toParts = (0, import_obsidian.normalizePath)(toPath).split("/").filter(Boolean);
  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }
  const up = "../".repeat(fromParts.length);
  return `${up}${toParts.join("/")}`;
}
async function buildMarkdownPreview(ctx, file) {
  const raw = stripFrontmatter(await ctx.app.vault.read(file));
  const previewSource = raw.slice(0, 2e3);
  const text = raw.replace(/^```[\s\S]*?```/gm, " ").replace(/!\[[^\]]*\]\([^)]+\)/g, " ").replace(/!\[\[([^\]]+)\]\]/g, " $1 ").replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\[[^\]]+\]\([^)]+\)/g, " ").replace(/[#>*`_~-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
  let html = markdownToHtml(previewSource);
  try {
    html = await rewriteMarkdownHtmlAssets(ctx, file, html, "inline", "canvas");
  } catch (error) {
    console.error(`[canvas-exporter] Vorschau-Render fehlgeschlagen f\xFCr ${file.path}`, error);
    html = markdownToHtml(previewSource);
  }
  return { text, html };
}
async function copyVaultFile(ctx, file, kind) {
  const cached = ctx.fileMap.get(file.path);
  if (cached)
    return cached;
  const folder = kind === "image" ? ctx.assetsImagesDir : ctx.assetsFilesDir;
  const outputName = uniqueOutputName(ctx, file.basename, file.extension);
  const outputPath = (0, import_obsidian.normalizePath)(`${folder}/${outputName}`);
  const bytes = await ctx.app.vault.readBinary(file);
  await writeBinaryFile(ctx.app, outputPath, bytes);
  const rel = toExportRelativePath(outputPath, ctx.outputRoot);
  ctx.fileMap.set(file.path, rel);
  return rel;
}
function uniqueOutputName(ctx, basename, extension) {
  ctx.counter += 1;
  const safeBase = safeSegment(basename);
  const ext = extension.startsWith(".") ? extension.slice(1) : extension;
  return `${String(ctx.counter).padStart(3, "0")}_${safeBase}.${ext}`;
}
function safeSegment(value) {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^[-.]+|[-.]+$/g, "");
  return normalized || "item";
}
function normalizeFolder(dir) {
  const cleaned = dir.trim().replace(/^\/+|\/+$/g, "");
  return cleaned || "Canvas-Exports";
}
function toExportRelativePath(targetPath, rootPath) {
  const targetParts = (0, import_obsidian.normalizePath)(targetPath).split("/").filter(Boolean);
  const rootParts = (0, import_obsidian.normalizePath)(rootPath).split("/").filter(Boolean);
  if (targetParts.length <= rootParts.length)
    return targetParts.join("/");
  return targetParts.slice(rootParts.length).join("/");
}
async function ensureFolderExists(app, folderPath) {
  const parts = (0, import_obsidian.normalizePath)(folderPath).split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!await app.vault.adapter.exists(current)) {
      await app.vault.createFolder(current);
    }
  }
}
async function writeTextFile(app, filePath, content) {
  const existing = app.vault.getAbstractFileByPath(filePath);
  if (existing instanceof import_obsidian.TFile) {
    await app.vault.modify(existing, content);
    return;
  }
  await app.vault.create(filePath, content);
}
async function writeBinaryFile(app, filePath, data) {
  const existing = app.vault.getAbstractFileByPath(filePath);
  if (existing instanceof import_obsidian.TFile) {
    await app.vault.modifyBinary(existing, data);
    return;
  }
  await app.vault.createBinary(filePath, data);
}
function resolveVaultFile(app, pathLike) {
  return app.vault.getAbstractFileByPath((0, import_obsidian.normalizePath)(pathLike));
}
function resolveLinkedVaultFile(app, sourceFile, target) {
  const normalizedTarget = (0, import_obsidian.normalizePath)(target);
  const direct = app.vault.getAbstractFileByPath(normalizedTarget);
  if (direct)
    return direct;
  const folder = sourceFile.parent?.path ?? "";
  if (folder) {
    const relative = (0, import_obsidian.normalizePath)(`${folder}/${normalizedTarget}`);
    const relFile = app.vault.getAbstractFileByPath(relative);
    if (relFile)
      return relFile;
  }
  const basename = normalizedTarget.split("/").pop() || normalizedTarget;
  const byName = app.metadataCache.getFirstLinkpathDest(normalizedTarget, sourceFile.path) ?? app.metadataCache.getFirstLinkpathDest(basename, sourceFile.path);
  return byName ?? null;
}
function isExternalLink(value) {
  return /^(https?:|mailto:|file:)/i.test(value);
}
function shouldRewriteInternalTarget(target) {
  const cleaned = target.trim();
  if (!cleaned)
    return false;
  if (isExternalLink(cleaned))
    return false;
  if (cleaned.startsWith("#"))
    return false;
  const normalized = normalizeExportHref(cleaned);
  if (normalized.startsWith("assets/files/") || normalized.startsWith("assets/images/")) {
    return false;
  }
  return true;
}
function normalizeCanvasData(input, fallbackName) {
  const raw = input && typeof input === "object" ? input : {};
  const nodes = Array.isArray(raw.nodes) ? raw.nodes.filter((item) => item && typeof item === "object").map((item) => normalizeCanvasNode(item)).filter((node) => node !== null) : [];
  const edges = Array.isArray(raw.edges) ? raw.edges.filter((item) => item && typeof item === "object").map((item) => normalizeCanvasEdge(item)).filter((edge) => edge !== null) : [];
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : fallbackName;
  return { nodes, edges, name };
}
function normalizeCanvasNode(input) {
  const id = typeof input.id === "string" && input.id.trim() ? input.id.trim() : "";
  if (!id)
    return null;
  const type = typeof input.type === "string" ? input.type : "text";
  const x = toFiniteNumber(input.x);
  const y = toFiniteNumber(input.y);
  const width = toFiniteNumber(input.width);
  const height = toFiniteNumber(input.height);
  const text = typeof input.text === "string" ? input.text : void 0;
  const label = typeof input.label === "string" ? input.label : void 0;
  const file = typeof input.file === "string" ? input.file : void 0;
  const url = typeof input.url === "string" ? input.url : void 0;
  const color = typeof input.color === "string" || typeof input.color === "number" ? String(input.color).trim() : void 0;
  return {
    id,
    type,
    x,
    y,
    width,
    height,
    text,
    label,
    file,
    url,
    color: color || void 0
  };
}
function normalizeCanvasEdge(input) {
  const fromNode = typeof input.fromNode === "string" && input.fromNode.trim() ? input.fromNode.trim() : "";
  const toNode = typeof input.toNode === "string" && input.toNode.trim() ? input.toNode.trim() : "";
  if (!fromNode || !toNode)
    return null;
  const id = typeof input.id === "string" ? input.id : void 0;
  const fromSide = typeof input.fromSide === "string" ? input.fromSide : void 0;
  const toSide = typeof input.toSide === "string" ? input.toSide : void 0;
  const label = typeof input.label === "string" ? input.label : void 0;
  const color = typeof input.color === "string" || typeof input.color === "number" ? String(input.color).trim() : void 0;
  return {
    id,
    fromNode,
    fromSide,
    toNode,
    toSide,
    label,
    color: color || void 0
  };
}
function toFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function parsedTargetSection(target) {
  const hashIndex = target.indexOf("#");
  if (hashIndex < 0)
    return null;
  const section = target.slice(hashIndex + 1).trim();
  return section || null;
}
function splitTargetSuffix(value) {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  let cut = -1;
  if (hashIndex >= 0 && queryIndex >= 0)
    cut = Math.min(hashIndex, queryIndex);
  else
    cut = Math.max(hashIndex, queryIndex);
  if (cut < 0)
    return { path: value, suffix: "" };
  return { path: value.slice(0, cut), suffix: value.slice(cut) };
}
function parseWikiReference(value) {
  const normalized = normalizeWikiTarget(value);
  const pipeIndex = normalized.indexOf("|");
  const core = (pipeIndex >= 0 ? normalized.slice(0, pipeIndex) : normalized).trim();
  const displayRaw = pipeIndex >= 0 ? normalized.slice(pipeIndex + 1).trim() : "";
  return { core, display: displayRaw || null, size: parseEmbedSize(displayRaw) };
}
function parseEmbedSize(value) {
  const raw = (value || "").trim();
  if (!raw)
    return null;
  const cleaned = raw.replace(/\s+/g, "");
  const pair = cleaned.match(/^(\d+)x(\d+)$/i);
  if (pair) {
    return { width: Number(pair[1]), height: Number(pair[2]) };
  }
  const single = cleaned.match(/^(\d+)$/);
  if (single) {
    return { width: Number(single[1]) };
  }
  return null;
}
function embedSizeAttributes(size) {
  if (!size)
    return "";
  const attrs = [];
  if (size.width && Number.isFinite(size.width))
    attrs.push(` width="${Math.max(1, Math.round(size.width))}"`);
  if (size.height && Number.isFinite(size.height))
    attrs.push(` height="${Math.max(1, Math.round(size.height))}"`);
  return attrs.join("");
}
function normalizeWikiTarget(value) {
  let out = value.trim();
  if (!out)
    return out;
  if (out.startsWith("![[") && out.endsWith("]]")) {
    out = out.slice(3, -2);
  } else if (out.startsWith("[[") && out.endsWith("]]")) {
    out = out.slice(2, -2);
  }
  return out.trim();
}
function isImageExt(ext) {
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext.toLowerCase());
}
function escapeHtmlAttr(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// src/main.ts
var DEFAULT_SETTINGS = {
  darkMode: true,
  outputDir: "Canvas-Exports"
};
var CanvasExporterPlugin = class extends import_obsidian2.Plugin {
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
    this.addSettingTab(new CanvasExporterSettingTab(this.app, this));
  }
  async exportCurrentCanvas() {
    const file = this.getActiveCanvasFile();
    if (!file) {
      new import_obsidian2.Notice("Keine aktive Canvas-Datei gefunden.", 4e3);
      return;
    }
    try {
      const canvasColors = this.readCanvasPaletteColors();
      const result = await exportCanvasPackage(this.app, file, { ...this.settings, canvasColors });
      const html = convertCanvasToHtml(result.data, result.options);
      await this.writeIndexFile(result.folderPath, html);
      new import_obsidian2.Notice(`Canvas-Paket exportiert: ${result.folderPath}`, 6e3);
    } catch (error) {
      console.error("[canvas-exporter] Export fehlgeschlagen", error);
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      new import_obsidian2.Notice(`Canvas-Export fehlgeschlagen: ${message}`, 7e3);
    }
  }
  async writeIndexFile(folderPath, html) {
    const filePath = `${folderPath}/index.html`;
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof import_obsidian2.TFile) {
      await this.app.vault.modify(existing, html);
      return;
    }
    await this.app.vault.create(filePath, html);
  }
  getActiveCanvasFile() {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "canvas")
      return null;
    return file;
  }
  readCanvasPaletteColors() {
    if (typeof window === "undefined" || typeof document === "undefined" || !document.body) {
      return {};
    }
    const result = {};
    const colorMap = {
      "1": "--color-red-rgb",
      "2": "--color-orange-rgb",
      "3": "--color-yellow-rgb",
      "4": "--color-green-rgb",
      "5": "--color-cyan-rgb",
      "6": "--color-purple-rgb"
    };
    for (const [colorIndex, cssVar] of Object.entries(colorMap)) {
      const resolved = this.resolveCssVariable(cssVar);
      if (resolved) {
        result[colorIndex] = resolved;
      }
    }
    return result;
  }
  resolveCssVariable(cssVar) {
    if (typeof document === "undefined" || !document.body)
      return "";
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
    if (!value)
      return "";
    const rgbMatch = value.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
    if (rgbMatch) {
      return `rgb(${value})`;
    }
    if (/^(rgb|#)/.test(value) || /^rgba?\(/.test(value)) {
      return value;
    }
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.width = "1px";
    probe.style.height = "1px";
    probe.style.pointerEvents = "none";
    probe.style.opacity = "0";
    probe.style.backgroundColor = `var(${cssVar})`;
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor.trim();
    probe.remove();
    if (!resolved || resolved === "rgba(0, 0, 0, 0)" || resolved === "transparent") {
      return "";
    }
    return resolved;
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = { ...DEFAULT_SETTINGS, ...saved ?? {} };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var CanvasExporterSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas to HTML" });
    containerEl.createEl("p", {
      text: "Exportiert ein portables Paket pro Canvas mit index.html sowie assets/images und assets/files. Markdown-Dateiknoten werden dabei zus\xE4tzlich als einfache HTML-Unterseiten exportiert."
    });
    new import_obsidian2.Setting(containerEl).setName("Dunkles Standard-Theme").setDesc("Verwendet beim Export standardm\xE4\xDFig ein dunkles HTML-Layout.").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.darkMode).onChange(async (value) => {
        this.plugin.settings.darkMode = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName("Ausgabeordner").setDesc("Relativer Zielordner im Vault, zum Beispiel Canvas-Exports.").addText(
      (text) => text.setPlaceholder("Canvas-Exports").setValue(this.plugin.settings.outputDir).onChange(async (value) => {
        this.plugin.settings.outputDir = value || DEFAULT_SETTINGS.outputDir;
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=main.js.map
