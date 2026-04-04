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
  exportImages: boolean;
}

type NodePalette = {
  background: string;
  border: string;
};

const OBSIDIAN_COLORS: Record<string, NodePalette> = {
  "1": { background: "#d73a4a22", border: "#d73a4a" },
  "2": { background: "#e8a83822", border: "#e8a838" },
  "3": { background: "#3eb37022", border: "#3eb370" },
  "4": { background: "#4a90d922", border: "#4a90d9" },
  "5": { background: "#9b59b622", border: "#9b59b6" },
  "6": { background: "#eb6ca022", border: "#eb6ca0" },
};

export function convertCanvasToHtml(data: CanvasData, options: ExportOptions): string {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];

  const bounds = getBounds(nodes);
  const theme = getTheme(options.darkMode);

  const nodeHtml = nodes
    .map((node) => renderNode(node, bounds.offsetX, bounds.offsetY, options, theme))
    .join("\n");

  const edgesData = edges.map((edge) => ({
    fromId: edge.fromNode,
    toId: edge.toNode,
    fromSide: normalizeSide(edge.fromSide),
    toSide: normalizeSide(edge.toSide),
    label: edge.label ?? "",
    color: edge.color ?? "",
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
    .toolbar button:hover {
      background: ${theme.chipBackground};
    }
    .edge-label {
      font-size: 12px;
      fill: ${theme.text};
      pointer-events: none;
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

function renderNode(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
  options: ExportOptions,
  theme: ReturnType<typeof getTheme>,
): string {
  const palette = getNodePalette(node.color, options.darkMode);
  const left = normalizeNumber(node.x) + offsetX;
  const top = normalizeNumber(node.y) + offsetY;
  const width = Math.max(120, normalizeNumber(node.width));
  const height = Math.max(60, normalizeNumber(node.height));
  const type = (node.type || "text").toLowerCase();
  const classes = ["node", escapeAttribute(type === "group" ? "group" : "")].filter(Boolean).join(" ");

  const title = node.label ? `<div class="node-title">${markdownToHtml(node.label)}</div>` : "";
  const content = renderNodeContent(node, options);

  const background = type === "group" ? theme.groupBackground : palette.background;
  const border = type === "group" ? theme.groupBorder : palette.border;

  return `<div
    id="node-${escapeAttribute(node.id)}"
    class="${classes}"
    style="left:${left}px;top:${top}px;width:${width}px;min-height:${height}px;background:${background};border-color:${border};"
  >${title}<div class="node-content">${content}</div></div>`;
}

function renderNodeContent(node: CanvasNode, options: ExportOptions): string {
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
    const filePath = typeof node.file === "string" ? node.file.trim() : "";
    if (!filePath) return "<p>Leerer Datei-Knoten</p>";
    const safePath = escapeAttribute(filePath);
    const filename = escapeHtml(filePath.split("/").pop() || filePath);

    if (options.exportImages && /\.(png|jpe?g|gif|svg|webp)$/i.test(filePath)) {
      return `<p>${filename}</p><img src="${safePath}" alt="${filename}">`;
    }

    return `<p><a class="file-chip" href="${safePath}" target="_blank" rel="noopener noreferrer">${filename}</a></p>`;
  }

  const text = typeof node.text === "string" ? node.text : "";
  if (!text.trim()) {
    return "";
  }

  return markdownToHtml(text);
}

export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = escapeHtml(markdown.replace(/\r\n?/g, "\n"));

  html = html.replace(/```([\w-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
    const className = lang ? ` class="language-${escapeAttribute(lang)}"` : "";
    return `<pre><code${className}>${code.trim()}</code></pre>`;
  });

  html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/~~(.+?)~~/g, "<del>$1</del>");
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  html = html.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '<a href="$1">$2</a>');
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<a href="$1">$1</a>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');
  html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");
  html = html.replace(/^---$/gm, "<hr>");

  const lines = html.split("\n");
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      result.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      result.push("</ol>");
      inOl = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inUl) {
        closeLists();
        result.push("<ul>");
        inUl = true;
      }
      result.push(`<li>${trimmed.replace(/^[-*]\s+/, "")}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOl) {
        closeLists();
        result.push("<ol>");
        inOl = true;
      }
      result.push(`<li>${trimmed.replace(/^\d+\.\s+/, "")}</li>`);
      continue;
    }

    closeLists();

    if (/^<h\d>.*<\/h\d>$/.test(trimmed) || /^<pre>/.test(trimmed) || /^<blockquote>/.test(trimmed) || /^<hr>$/.test(trimmed)) {
      result.push(trimmed);
      continue;
    }

    result.push(`<p>${trimmed}</p>`);
  }

  closeLists();
  return result.join("\n");
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
  if (color && OBSIDIAN_COLORS[color]) {
    return OBSIDIAN_COLORS[color];
  }

  if (color && color.startsWith("#")) {
    return { background: `${color}22`, border: color };
  }

  return darkMode
    ? { background: "#2b2f36", border: "#4a5565" }
    : { background: "#ffffff", border: "#c8d0da" };
}

function getTheme(darkMode: boolean) {
  return darkMode
    ? {
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
