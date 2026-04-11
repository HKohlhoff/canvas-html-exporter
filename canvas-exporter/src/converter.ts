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
  toNode: string;
  toSide?: string;
  label?: string;
  color?: string;
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

type NodePalette = {
  background: string;
  border: string;
};

// Fallback-Farben, falls keine CSS-Variablen aus Obsidian ausgelesen werden konnten.
// Reihenfolge entspricht dem korrekten Obsidian-Mapping:
// 1=rot, 2=orange, 3=gelb, 4=grün, 5=cyan, 6=lila
const OBSIDIAN_COLORS: Record<string, NodePalette> = {
  "1": { background: "#e6324222", border: "#e63242" }, // red
  "2": { background: "#fa8d3e22", border: "#fa8d3e" }, // orange
  "3": { background: "#f9c74f22", border: "#f9c74f" }, // yellow
  "4": { background: "#56ae6c22", border: "#56ae6c" }, // green
  "5": { background: "#4db6ac22", border: "#4db6ac" }, // cyan
  "6": { background: "#9c6bae22", border: "#9c6bae" }, // purple
};

export function convertCanvasToHtml(data: CanvasData, options: ExportOptions): string {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];

  const bounds = getBounds(nodes);
  const theme = getTheme(options.darkMode);

  const nodeHtml = nodes
    .map((node) => renderNode(node, bounds.offsetX, bounds.offsetY, theme, options.canvasColors))
    .join("\n");

  const edgesData = edges.map((edge) => ({
    fromId: edge.fromNode,
    toId: edge.toNode,
    fromSide: normalizeSide(edge.fromSide),
    toSide: normalizeSide(edge.toSide),
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
      overflow: hidden;
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
      overflow: hidden;
    }
    .md-card-preview-text {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.35em 0 0;
      overflow: hidden;
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
      max-height: 7.5em;
      overflow: hidden;
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

export function buildMarkdownDocumentHtml(title: string, bodyHtml: string, darkMode: boolean, canvasColors?: Record<string, string>): string {
  const theme = getTheme(darkMode);
  return `<!DOCTYPE html>\n<html lang="de">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <title>${escapeHtml(title)}</title>\n  <style>\n    :root { ${buildCanvasColorVariables(canvasColors)} }\n    html, body { margin: 0; padding: 0; }
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

function renderNode(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
  theme: ReturnType<typeof getTheme>,
  canvasColors?: Record<string, string>,
): string {
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

function renderNodeContent(node: CanvasNode): string {
  const type = (node.type || "text").toLowerCase();

  if (type === "group") {
    return node.text ? markdownToHtml(node.text) : "";
  }

  if (type === "link") {
    const url = typeof node.url === "string" ? node.url.trim() : "";
    if (!url) return "<p>Leerer Link-Knoten</p>";
    const label = escapeHtml(node.label || url);
    return `<p><a class="link-chip" href="${escapeAttribute(url)}" target="_blank" rel="noopener noreferrer">${label}</a></p>`;
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

    if (!href) return "<p>Leerer Datei-Knoten</p>";
    return `<p><a class="file-chip" href="${href}" target="_blank" rel="noopener noreferrer">${displayName}</a></p>`;
  }

  const text = typeof node.text === "string" ? node.text : "";
  if (!text.trim()) return "";
  return markdownToHtml(text);
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
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
      const codeLines: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? "")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
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
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? "";
        const currentTrimmed = current.trim();
        if (!currentTrimmed) {
          quoteLines.push("");
          i += 1;
          continue;
        }
        if (!/^>\s?/.test(currentTrimmed)) break;
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
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*[-*+]\s+/, ""));
        i += 1;
      }
      out.push(`<ul>${items.map((item) => `<li>${renderInline(item.trim())}</li>`).join("")}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").replace(/^\s*\d+\.\s+/, ""));
        i += 1;
      }
      out.push(`<ol>${items.map((item) => `<li>${renderInline(item.trim())}</li>`).join("")}</ol>`);
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      const currentTrimmed = current.trim();
      if (!currentTrimmed) break;
      if (/^(#{1,6})\s+/.test(currentTrimmed)) break;
      if (/^```/.test(currentTrimmed)) break;
      if (/^>\s?/.test(currentTrimmed)) break;
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(currentTrimmed)) break;
      if (/^[-*+]\s+/.test(currentTrimmed)) break;
      if (/^\d+\.\s+/.test(currentTrimmed)) break;
      if (isTableStart(lines, i)) break;
      paraLines.push(current.replace(/\s+$/, ""));
      i += 1;
    }
    out.push(`<p>${renderParagraphLines(paraLines)}</p>`);
  }

  return out.join("\n");
}

function renderParagraphLines(lines: string[]): string {
  return renderInline(lines.join("\n")).replace(/\n/g, "<br>\n");
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
  let html = escapeHtml(text);
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
    return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}">`;
  });
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  html = html.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "[[$1|$2]]");
  html = html.replace(/\[\[([^\]]+)\]\]/g, "[[$1]]");
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s(\[{>])\*([^*\n]+)\*(?=$|[\s)\]}<.,!?;:])/g, '$1<em>$2</em>');
  html = html.replace(/(^|[\s(\[{>])_([^_\n]+)_(?=$|[\s)\]}<.,!?;:])/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  return html;
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

function buildCanvasColorVariables(canvasColors?: Record<string, string>): string {
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

function normalizeNumber(value: number | undefined): number {
  return Number.isFinite(value) ? Number(value) : 0;
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
