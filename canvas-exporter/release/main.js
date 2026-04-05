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
  "1": { background: "#d73a4a22", border: "#d73a4a" },
  "2": { background: "#e8a83822", border: "#e8a838" },
  "3": { background: "#3eb37022", border: "#3eb370" },
  "4": { background: "#4a90d922", border: "#4a90d9" },
  "5": { background: "#9b59b622", border: "#9b59b6" },
  "6": { background: "#eb6ca022", border: "#eb6ca0" }
};
function convertCanvasToHtml(data, options) {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const bounds = getBounds(nodes);
  const theme = getTheme(options.darkMode);
  const nodeHtml = nodes.map((node) => renderNode(node, bounds.offsetX, bounds.offsetY, theme)).join("\n");
  const edgesData = edges.map((edge) => ({
    fromId: edge.fromNode,
    toId: edge.toNode,
    fromSide: normalizeSide(edge.fromSide),
    toSide: normalizeSide(edge.toSide),
    label: edge.label ?? "",
    color: edge.color ?? ""
  }));
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(options.title)}</title>
  <style>
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
    }
    #canvas {
      position: relative;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      margin: 0 auto;
      background: ${theme.canvasBackground};
      border: 1px solid ${theme.canvasBorder};
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
    }
    .node-content h1, .node-content h2, .node-content h3, .node-content h4 {
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
      height: auto;
      border-radius: 8px;
      margin: 0.6em 0;
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
    .md-card-link {
      display: block;
      color: inherit;
      text-decoration: none;
      margin: -12px -14px;
      padding: 12px 14px;
      min-height: calc(100% + 24px);
      cursor: pointer;
    }
    .md-card-link:hover {
      background: ${theme.chipBackground};
    }
    .md-card-title { font-weight: 700; margin-bottom: 8px; }
    .md-card-preview {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.2em 0 0;
      max-height: calc(100% - 28px);
      overflow: hidden;
    }
    .md-card-preview-text {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.35em 0 0;
      overflow: hidden;
    }
    .md-card-link .md-card-preview h1,
    .md-card-link .md-card-preview h2,
    .md-card-link .md-card-preview h3,
    .md-card-link .md-card-preview h4,
    .md-card-link .md-card-preview h5,
    .md-card-link .md-card-preview h6 {
      margin-top: 0.2em;
      margin-bottom: 0.35em;
      font-size: 1em;
    }
    .md-card-link .md-card-preview pre {
      max-height: 7.5em;
      overflow: hidden;
    }
    .md-card-link .md-card-preview table {
      font-size: 0.9em;
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
      const edgeColor = ${JSON.stringify(theme.edge)};
      const textColor = ${JSON.stringify(theme.text)};
      const obsidianColors = ${JSON.stringify(
    Object.fromEntries(Object.entries(OBSIDIAN_COLORS).map(([key, value]) => [key, value.border]))
  )};
      const edges = ${JSON.stringify(edgesData)};
      let currentScale = 1;

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
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
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

          const color = edge.color ? (obsidianColors[edge.color] || edge.color) : edgeColor;
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
      };

      window.resetZoom = function() {
        currentScale = 1;
        canvas.style.transform = "scale(1)";
      };

      drawEdges();
      window.addEventListener("resize", drawEdges);
    })();
  </script>
</body>
</html>`;
}
function buildMarkdownDocumentHtml(title, bodyHtml, darkMode) {
  const theme = getTheme(darkMode);
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
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
    img { display: block; max-width: 100%; height: auto; border-radius: 8px; margin: 0.8em 0; }
    table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
    th, td { border: 1px solid ${theme.canvasBorder}; padding: 8px 10px; text-align: left; }
  </style>
</head>
<body>
  <main class="md-page">
    ${bodyHtml}
  </main>
</body>
</html>`;
}
function renderNode(node, offsetX, offsetY, theme) {
  const palette = getNodePalette(node.color, theme.darkMode);
  const left = normalizeNumber(node.x) + offsetX;
  const top = normalizeNumber(node.y) + offsetY;
  const width = Math.max(120, normalizeNumber(node.width));
  const height = Math.max(60, normalizeNumber(node.height));
  const type = (node.type || "text").toLowerCase();
  const classes = ["node", escapeAttribute(type === "group" ? "group" : "")].filter(Boolean).join(" ");
  const title = node.label ? `<div class="node-title">${markdownToHtml(node.label)}</div>` : "";
  const content = renderNodeContent(node);
  const background = type === "group" ? theme.groupBackground : palette.background;
  const border = type === "group" ? theme.groupBorder : palette.border;
  return `<div
    id="node-${escapeAttribute(node.id)}"
    class="${classes}"
    style="left:${left}px;top:${top}px;width:${width}px;min-height:${height}px;background:${background};border-color:${border};"
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
    const href = escapeAttribute(node.exportHtmlPath || node.exportPath || node.file || "");
    if (node.fileKind === "image") {
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"><img src="${href}" alt="${displayName}"></a>`;
    }
    if (node.fileKind === "markdown") {
      const preview = node.previewHtml ? `<div class="md-card-preview">${node.previewHtml}</div>` : node.previewText ? `<p class="md-card-preview-text">${escapeHtml(node.previewText)}</p>` : "";
      return `<a class="md-card-link" href="${href}" target="_blank" rel="noopener noreferrer"><div class="md-card-title">${displayName}</div>${preview}</a>`;
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
      paraLines.push(currentTrimmed);
      i += 1;
    }
    out.push(`<p>${renderInline(paraLines.join(" "))}</p>`);
  }
  return out.join("\n");
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
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="$1">$2</a>');
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<a href="$1">$1</a>');
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
function getNodePalette(color, darkMode) {
  if (color && OBSIDIAN_COLORS[color]) {
    return OBSIDIAN_COLORS[color];
  }
  if (color && color.startsWith("#")) {
    return { background: `${color}22`, border: color };
  }
  return darkMode ? { background: "#2b2f36", border: "#4a5565" } : { background: "#ffffff", border: "#c8d0da" };
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
async function exportCanvasPackage(app, canvasFile, settings) {
  const rawContent = await app.vault.read(canvasFile);
  const parsed = JSON.parse(rawContent);
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
  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
  const title = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : canvasFile.basename;
  const ctx = {
    app,
    outputRoot: exportFolder,
    assetsFilesDir: filesDir,
    assetsImagesDir: imagesDir,
    darkMode: settings.darkMode,
    fileMap: /* @__PURE__ */ new Map(),
    htmlMap: /* @__PURE__ */ new Map(),
    counter: 0
  };
  const preparedNodes = [];
  for (const node of nodes) {
    preparedNodes.push(await prepareNode(ctx, node));
  }
  return {
    folderPath: exportFolder,
    data: { nodes: preparedNodes, edges, name: title },
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
    const exportHtmlPath = await exportMarkdownNote(ctx, file);
    const preview = await buildMarkdownPreview(ctx.app, file);
    return {
      ...node,
      displayName: file.basename,
      fileKind: "markdown",
      exportHtmlPath,
      previewText: preview.text,
      previewHtml: preview.html
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
  const cached = ctx.htmlMap.get(file.path);
  if (cached)
    return cached;
  const content = stripFrontmatter(await ctx.app.vault.read(file));
  let htmlBody = markdownToHtml(content);
  htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody);
  const outputName = uniqueOutputName(ctx, file.basename, "html");
  const outputPath = (0, import_obsidian.normalizePath)(`${ctx.assetsFilesDir}/${outputName}`);
  const title = file.basename;
  const htmlDoc = buildMarkdownDocumentHtml(title, htmlBody, ctx.darkMode);
  await writeTextFile(ctx.app, outputPath, htmlDoc);
  const rel = toExportRelativePath(outputPath, ctx.outputRoot);
  ctx.htmlMap.set(file.path, rel);
  return rel;
}
async function rewriteMarkdownHtmlAssets(ctx, sourceFile, html) {
  let result = html;
  const imgMatches = [...result.matchAll(/<img\s+src="([^"]+)"\s+alt="([^"]*)">/g)];
  for (const match of imgMatches) {
    const original = match[0];
    const target = match[1] || "";
    const resolved = await exportLinkedTarget(ctx, sourceFile, target, true);
    if (resolved) {
      const replacement = `<img src="${escapeHtmlAttr(resolved)}" alt="${match[2] || ""}">`;
      result = result.replace(original, replacement);
    }
  }
  const linkMatches = [...result.matchAll(/<a\s+href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
  for (const match of linkMatches) {
    const original = match[0];
    const target = match[1] || "";
    const resolved = await exportLinkedTarget(ctx, sourceFile, target, false);
    if (resolved) {
      const attrs = match[2] || "";
      const label = match[3] || "";
      const replacement = `<a href="${escapeHtmlAttr(resolved)}"${attrs}>${label}</a>`;
      result = result.replace(original, replacement);
    }
  }
  return result;
}
async function exportLinkedTarget(ctx, sourceFile, rawTarget, expectImage) {
  const target = rawTarget.trim();
  if (!target)
    return null;
  if (isExternalLink(target) || target.startsWith("#"))
    return target;
  const cleaned = stripAnchorAndQuery(target);
  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, cleaned);
  if (!(resolved instanceof import_obsidian.TFile))
    return null;
  if (resolved.extension.toLowerCase() === "md") {
    return await exportMarkdownNote(ctx, resolved);
  }
  const rel = await copyVaultFile(ctx, resolved, expectImage || isImageExt(resolved.extension.toLowerCase()) ? "image" : "file");
  return rel;
}
async function buildMarkdownPreview(app, file) {
  const raw = stripFrontmatter(await app.vault.read(file));
  const previewSource = raw.slice(0, 2e3);
  const text = raw.replace(/^```[\s\S]*?```/gm, " ").replace(/!\[[^\]]*\]\([^)]+\)/g, " ").replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2").replace(/\[\[([^\]]+)\]\]/g, "$1").replace(/\[[^\]]+\]\([^)]+\)/g, " ").replace(/[#>*`_~-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 220);
  const html = markdownToHtml(previewSource);
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
function stripAnchorAndQuery(value) {
  return value.split("#")[0]?.split("?")[0] ?? value;
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
      new import_obsidian2.Notice("Keine aktive Canvas-Datei gefunden.", 4e3);
      return;
    }
    try {
      const result = await exportCanvasPackage(this.app, file, this.settings);
      const html = convertCanvasToHtml(result.data, result.options);
      await this.writeIndexFile(result.folderPath, html);
      new import_obsidian2.Notice(`Canvas-Paket exportiert: ${result.folderPath}`, 6e3);
    } catch (error) {
      console.error("[canvas-exporter] Export fehlgeschlagen", error);
      new import_obsidian2.Notice("Canvas-Export fehlgeschlagen. Details in der Entwicklerkonsole.", 6e3);
    }
  }
  async exportAllCanvases() {
    const canvasFiles = this.app.vault.getFiles().filter((file) => file.extension === "canvas");
    if (canvasFiles.length === 0) {
      new import_obsidian2.Notice("Im Vault wurden keine Canvas-Dateien gefunden.", 4e3);
      return;
    }
    let successCount = 0;
    const failed = [];
    for (const file of canvasFiles) {
      try {
        const result = await exportCanvasPackage(this.app, file, this.settings);
        const html = convertCanvasToHtml(result.data, result.options);
        await this.writeIndexFile(result.folderPath, html);
        successCount += 1;
      } catch (error) {
        console.error(`[canvas-exporter] Export fehlgeschlagen f\xFCr ${file.path}`, error);
        failed.push(file.path);
      }
    }
    if (failed.length === 0) {
      new import_obsidian2.Notice(`${successCount} Canvas-Datei(en) exportiert.`, 5e3);
      return;
    }
    new import_obsidian2.Notice(`${successCount} exportiert, ${failed.length} fehlgeschlagen. Details in der Entwicklerkonsole.`, 7e3);
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
