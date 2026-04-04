/**
 * ============================================================
 * Obsidian Canvas → HTML Konverter
 * ============================================================
 * Wandelt Obsidian Canvas JSON in eine eigenständige,
 * portable HTML-Seite um — keine externen Abhängigkeiten.
 */

// ─────────────────────────────────────────────────────────────
// Datentypen
// ─────────────────────────────────────────────────────────────

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  text?: string;
  label?: string;
  color?: string;
  file?: string;
  url?: string;
  groupNodes?: string[];
  subpath?: string;
  fileSrc?: string;
  [key: string]: unknown;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide: string;
  toSide: string;
  fromEnd: string;
  toEnd: string;
  color?: string;
  label?: string;
}

export interface CanvasData {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  name?: string;
  backgroundColor?: string;
  nodesMap?: Record<string, CanvasNode>;
}

export interface ExportOptions {
  darkMode?: boolean;
  title?: string;
  vaultPath?: string;
  exportImages?: boolean;
  outputDir?: string;
}

// ─────────────────────────────────────────────────────────────
// Farben
// ─────────────────────────────────────────────────────────────

const OBSIDIAN_COLORS: Record<string, string> = {
  "1": "#fb464c",
  "2": "#e9973f",
  "3": "#e0de71",
  "4": "#44cf6e",
  "5": "#53dfdd",
  "6": "#a882ff",
};

function resolveColor(color?: string): string {
  if (!color) return "";
  return OBSIDIAN_COLORS[color] ?? (color.startsWith("#") ? color : "");
}

// ─────────────────────────────────────────────────────────────
// HTML-Escaping
// ─────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ─────────────────────────────────────────────────────────────
// Inline-Formatierung (Bold, Italic, Links, etc.)
// ─────────────────────────────────────────────────────────────

function inlineFormat(text: string): string {
  let result = escapeHtml(text).replace(/\n/g, "<br>");

  result = result.replace(
    /\[\^(\w+)\]/g,
    '<sup class="footnote-ref">[$1]</sup>'
  );

  result = result.replace(
    /(?<!\w)#(\w[\w\/-]*)/g,
    '<span class="tag">#$1</span>'
  );

  result = result.replace(/==([^=]+)==/g, '<mark>$1</mark>');

  result = result.replace(/~~(.+?)~~/g, "<del>$1</del>");

  result = result.replace(
    /\*\*\*(.+?)\*\*\*/g,
    "<strong><em>$1</em></strong>"
  );
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(
    /(?<!\*)\*([^*]+)\*(?!\*)/g,
    "<em>$1</em>"
  );
  result = result.replace(/__(.+?)__/g, "<strong>$1</strong>");
  result = result.replace(
    /_(?![^_]*_)((?:[^_]|_(?!_))*?)_/g,
    "<em>$1</em>"
  );

  result = result.replace(/`([^`]+)`/g, "<code>$1</code>");

  result = result.replace(
    /!\[\[([^\]]+?)(?:\|(\d+)(?:x(\d+))?)?\]\]/g,
    (_m, src, w, h) => {
      const styles: string[] = [];
      if (w) styles.push(`width:${w}px`);
      if (h) styles.push(`height:${h}px`);
      const style = styles.length ? ` style="${styles.join(";")}"` : "";
      return `<img src="${src}" alt="${src}"${style}>`;
    }
  );

  result = result.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1">'
  );

  result = result.replace(
    /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
    '<a class="internal-link" href="#n-$1">$2</a>'
  );

  result = result.replace(
    /\[\[([^\]]+)\]\]/g,
    '<a class="internal-link" href="#n-$1">$1</a>'
  );

  result = result.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  return result;
}

// ─────────────────────────────────────────────────────────────
// Block-Markdown → HTML Konverter
// ─────────────────────────────────────────────────────────────

function markdownToHtml(md: string): string {
  if (!md) return "";

  const lines = md.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      output.push(
        `<pre><code class="language-${lang}">${codeLines.join("\n")}</code></pre>`
      );
      i++;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      output.push(`<h${level}>${inlineFormat(headingMatch[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      output.push("<hr>");
      i++;
      continue;
    }

    const taskMatch = trimmed.match(/^(\s*)-\s\[([ xX])\]\s+(.*)/);
    if (taskMatch) {
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].trim().match(/^(\s*)-\s\[([ xX])\]\s+(.*)/);
        if (!m) break;
        const checked = m[2].toLowerCase() === "x" ? "checked" : "";
        items.push(
          `<li class="task-item"><input type="checkbox" ${checked} disabled> ${inlineFormat(m[3])}</li>`
        );
        i++;
      }
      output.push(`<ul class="checklist">${items.join("")}</ul>`);
      continue;
    }

    if (trimmed.match(/^[-*+]\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^[-*+]\s/)) {
        const m = lines[i].trim().match(/^[-*+]\s+(.*)/);
        if (!m) break;
        items.push(`<li>${inlineFormat(m[1])}</li>`);
        i++;
      }
      output.push(`<ul>${items.join("")}</ul>`);
      continue;
    }

    if (trimmed.match(/^\d+\.\s/)) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        const m = lines[i].trim().match(/^\d+\.\s+(.*)/);
        if (!m) break;
        items.push(`<li>${inlineFormat(m[1])}</li>`);
        i++;
      }
      output.push(`<ol>${items.join("")}</ol>`);
      continue;
    }

    if (trimmed.startsWith("> ")) {
      const quotes: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quotes.push(lines[i].trim().slice(2));
        i++;
      }
      output.push(
        `<blockquote>${inlineFormat(quotes.join(" "))}</blockquote>`
      );
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const allCells = tableLines
        .map((l) =>
          l
            .split("|")
            .slice(1, -1)
            .map((c) => c.trim())
        )
        .filter((row) => row.length > 0);

      const dataRows = allCells.filter(
        (row) => !row.every((c) => /^[-:]+$/.test(c))
      );

      if (dataRows.length > 0) {
        let table = "<table>";
        dataRows.forEach((row, idx) => {
          const tag = idx === 0 ? "th" : "td";
          table += `<tr>${row
            .map((c) => `<${tag}>${inlineFormat(c)}</${tag}>`)
            .join("")}</tr>`;
        });
        table += "</table>";
        output.push(table);
      }
      continue;
    }

    if (trimmed === "") {
      output.push("");
      i++;
      continue;
    }

    output.push(`<p>${inlineFormat(line)}</p>`);
    i++;
  }

  return output.join("\n");
}

// ─────────────────────────────────────────────────────────────
// Geometrie
// ─────────────────────────────────────────────────────────────

function getAnchorPoint(
  node: CanvasNode,
  side: string
): { x: number; y: number } {
  const cx = node.x + node.width / 2;
  const cy = node.y + node.height / 2;
  switch (side) {
    case "top":    return { x: cx, y: node.y };
    case "bottom": return { x: cx, y: node.y + node.height };
    case "left":   return { x: node.x, y: cy };
    case "right":  return { x: node.x + node.width, y: cy };
    default:       return { x: cx, y: cy };
  }
}

function buildEdgePath(
  fromPt: { x: number; y: number },
  toPt: { x: number; y: number },
  fromSide: string,
  toSide: string
): string {
  const dx = toPt.x - fromPt.x;
  const dy = toPt.y - fromPt.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const strength = Math.min(dist * 0.4, 200);

  const offsets: Record<string, [number, number]> = {
    right:  [strength,  0],
    left:   [-strength, 0],
    bottom: [0,  strength],
    top:    [0, -strength],
  };

  const c1Off = offsets[fromSide] ?? [strength, 0];
  const c2Off = offsets[toSide]   ?? [-strength, 0];

  return (
    `M ${fromPt.x.toFixed(1)} ${fromPt.y.toFixed(1)} ` +
    `C ${(fromPt.x + c1Off[0]).toFixed(1)} ${(fromPt.y + c1Off[1]).toFixed(1)}, ` +
    `${(toPt.x + c2Off[0]).toFixed(1)} ${(toPt.y + c2Off[1]).toFixed(1)}, ` +
    `${toPt.x.toFixed(1)} ${toPt.y.toFixed(1)}`
  );
}

function normalize(
  canvas: CanvasData,
  padding = 80
): { width: number; height: number } {
  if (canvas.nodes.length === 0) return { width: 1200, height: 900 };

  const minX = Math.min(...canvas.nodes.map((n) => n.x));
  const minY = Math.min(...canvas.nodes.map((n) => n.y));

  canvas.nodes.forEach((n) => {
    n.x += padding - minX;
    n.y += padding - minY;
  });

  const maxX =
    Math.max(...canvas.nodes.map((n) => n.x + n.width)) + padding;
  const maxY =
    Math.max(...canvas.nodes.map((n) => n.y + n.height)) + padding;

  return { width: maxX, height: maxY };
}

// ─────────────────────────────────────────────────────────────
// Knoten-HTML generieren
// ─────────────────────────────────────────────────────────────

function generateNodeHtml(node: CanvasNode): string {
  const color = resolveColor(node.color);
  const borderStyle = color ? `border-left: 4px solid ${color};` : "";
  const bgStyle = color
    ? `background: linear-gradient(135deg, ${color}18 0%, transparent 60%);`
    : "";

  const typeClass = `node-type-${node.type || "text"}`;
  const groupClass = node.type === "group" ? "node-group" : "";

  let content = "";
  if (node.type === "file" && node.file) {
    content = `<em class="file-ref">[Datei: ${node.file}${node.subpath ? " > " + node.subpath : ""}]</em>`;
  } else if (node.type === "link" && node.url) {
    content = `<a href="${node.url}" target="_blank" rel="noopener noreferrer" class="external-link">${node.url}</a>
               <iframe src="${node.url}" sandbox="allow-scripts allow-same-origin allow-same-origin" loading="lazy" class="link-iframe"></iframe>`;
  } else if (node.type === "image" && node.file) {
    content = `<img src="${node.file}" alt="Bild" style="max-width:100%;height:auto;border-radius:6px;">`;
  } else {
    content = markdownToHtml(node.text ?? "");
  }

  const titleHtml = node.label
    ? `<div class="node-title">${inlineFormat(node.label)}</div>`
    : "";

  const heightStyle = node.type === "group"
    ? `min-height: ${node.height}px;`
    : `min-height: ${Math.max(node.height, 80)}px;`;

  return `<div class="node ${typeClass} ${groupClass}"
     id="n-${node.id}"
     data-node-id="${node.id}"
     style="left:${node.x.toFixed(1)}px;top:${node.y.toFixed(1)}px;
            width:${node.width}px;${heightStyle}
            ${borderStyle}${bgStyle}">
    ${titleHtml}
    <div class="node-content">${content}</div>
</div>`;
}

// ─────────────────────────────────────────────────────────────
// SVG-Kanten generieren
// ─────────────────────────────────────────────────────────────

function generateEdgesSvg(
  edges: CanvasEdge[],
  nodeMap: Map<string, CanvasNode>,
  width: number,
  height: number
): string {
  if (edges.length === 0) return "";

  const defs: string[] = [];
  const paths: string[] = [];
  const labels: string[] = [];

  for (const edge of edges) {
    const fromNode = nodeMap.get(edge.fromNode);
    const toNode = nodeMap.get(edge.toNode);
    if (!fromNode || !toNode) continue;

    const fromPt = getAnchorPoint(fromNode, edge.fromSide);
    const toPt = getAnchorPoint(toNode, edge.toSide);
    const pathD = buildEdgePath(fromPt, toPt, edge.fromSide, edge.toSide);
    const edgeColor = resolveColor(edge.color) || "var(--edge-color)";

    let markerStart = "";
    let markerEnd = "";
    const midStartId = `arrow-${edge.id}-start`;
    const midEndId = `arrow-${edge.id}-end`;

    if (edge.fromEnd === "arrow") {
      defs.push(
        `<marker id="${midStartId}" markerWidth="12" markerHeight="8" ` +
        `refX="1" refY="4" orient="auto"><polygon points="12 0, 0 4, 12 8" ` +
        `fill="${edgeColor}"/></marker>`
      );
      markerStart = `marker-start="url(#${midStartId})"`;
    }

    if (edge.toEnd === "arrow") {
      defs.push(
        `<marker id="${midEndId}" markerWidth="12" markerHeight="8" ` +
        `refX="11" refY="4" orient="auto"><polygon points="0 0, 12 4, 0 8" ` +
        `fill="${edgeColor}"/></marker>`
      );
      markerEnd = `marker-end="url(#${midEndId})"`;
    }

    paths.push(
      `<path d="${pathD}" stroke="${edgeColor}" stroke-width="2" ` +
      `fill="none" stroke-linecap="round" ${markerStart} ${markerEnd}/>`
    );

    if (edge.label) {
      const midX = (fromPt.x + toPt.x) / 2;
      const midY = (fromPt.y + toPt.y) / 2;
      labels.push(
        `<div class="edge-label" style="left:${midX.toFixed(1)}px;top:${midY.toFixed(1)}px;">` +
        `${inlineFormat(edge.label)}</div>`
      );
    }
  }

  const defsSection = defs.length > 0 ? `<defs>${defs.join("")}</defs>` : "";

  return (
    `<svg class="edges-layer" width="${width}" height="${height}" ` +
    `style="position:absolute;top:0;left:0;pointer-events:none;z-index:5;">` +
    `${defsSection}${paths.join("")}</svg>${labels.join("")}`
  );
}

// ─────────────────────────────────────────────────────────────
// Vollständiges HTML-Template
// ─────────────────────────────────────────────────────────────

function generateHtml(
  canvas: CanvasData,
  opts: ExportOptions = {}
): string {
  const isDark = opts.darkMode !== false;
  const title = opts.title || canvas.name || "Canvas Export";

  const dims = normalize(canvas);
  const nodeMap = new Map(canvas.nodes.map((n) => [n.id, n]));

  const nodeCount = canvas.nodes.length;
  const edgeCount = canvas.edges.length;

  // ── Knoten-HTML ──
  const nodesHtml = canvas.nodes.map((n) => generateNodeHtml(n)).join("\n");

  // ── Kanten-SVG ──
  const edgesSvg = generateEdgesSvg(canvas.edges, nodeMap, dims.width, dims.height);

  // ── CSS ──
  const css = `
:root {
  --bg:            ${isDark ? "#1a1a2e" : "#f0f0f0"};
  --surface:       ${isDark ? "#16213e" : "#ffffff"};
  --surface-hover:${isDark ? "#1a2744" : "#f8f8ff"};
  --border:        ${isDark ? "#2a3a5c" : "#d0d0d0"};
  --text:          ${isDark ? "#e0e0e0" : "#333333"};
  --text-muted:    ${isDark ? "#8899aa" : "#888888"};
  --title:         ${isDark ? "#ffffff" : "#111111"};
  --accent:        #4da6ff;
  --accent-hover:  #66b8ff;
  --edge-color:    ${isDark ? "#5588bb" : "#888888"};
  --group-bg:      ${isDark ? "rgba(100,140,200,0.08)" : "rgba(100,140,200,0.06)"};
  --group-border:  ${isDark ? "#3a5a8a" : "#aabbcc"};
  --shadow:        ${isDark ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"};
  --code-bg:       ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"};
  --mark-bg:       ${isDark ? "rgba(255,255,0,0.25)" : "rgba(255,255,0,0.4)"};
  --minimap-bg:    ${isDark ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)"};
}

*,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
  height: 100vh;
  user-select: none;
}

#viewport {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  cursor: grab;
}
#viewport.grabbing { cursor: grabbing; }
#world {
  position: absolute;
  transform-origin: 0 0;
  will-change: transform;
}

.canvas-page {
  position: relative;
  width: ${dims.width}px;
  height: ${dims.height}px;
  background: repeating-linear-gradient(
    0deg, transparent, transparent 49px,
    ${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"} 50px
  ),
  repeating-linear-gradient(
    90deg, transparent, transparent 49px,
    ${isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.025)"} 50px
  );
}

.node {
  position: absolute;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  box-shadow: 0 2px 12px var(--shadow);
  word-wrap: break-word;
  overflow-wrap: break-word;
  overflow: auto;
  font-size: 14px;
  line-height: 1.6;
  z-index: 10;
  cursor: move;
  transition: box-shadow 0.2s, transform 0.15s;
}
.node:hover {
  box-shadow: 0 6px 24px var(--shadow);
  z-index: 100;
}
.node.dragging {
  opacity: 0.85;
  z-index: 999;
  box-shadow: 0 12px 40px var(--shadow);
}
.node-group {
  background: var(--group-bg);
  border: 2px dashed var(--group-border);
  z-index: 1;
  cursor: default;
}
.node-type-link iframe {
  width: 100%;
  height: 200px;
  border: 1px solid var(--border);
  border-radius: 6px;
  margin-top: 8px;
}
.node-title {
  font-weight: 700;
  font-size: 15px;
  color: var(--title);
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border);
}
.node-content { color: var(--text); }
.node-content h1 { font-size: 1.4em; margin: 10px 0 5px; color: var(--title); }
.node-content h2 { font-size: 1.2em; margin: 8px 0 4px;  color: var(--title); }
.node-content h3 { font-size: 1.05em; margin: 6px 0 3px;  color: var(--title); }
.node-content p  { margin: 6px 0; }
.node-content img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
.node-content a  { color: var(--accent); text-decoration: none; }
.node-content a:hover { text-decoration: underline; color: var(--accent-hover); }
.node-content code {
  background: var(--code-bg);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 0.88em;
}
.node-content pre {
  background: ${isDark ? "#0d1117" : "#f6f8fa"};
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 10px 0;
  border: 1px solid var(--border);
}
.node-content pre code { background: none; padding: 0; font-size: 0.85em; }
.node-content blockquote {
  border-left: 3px solid var(--accent);
  padding: 4px 12px;
  margin: 8px 0;
  color: var(--text-muted);
  font-style: italic;
}
.node-content ul, .node-content ol { margin: 4px 0 4px 20px; }
.node-content li { margin: 2px 0; }
.node-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
.node-content th, .node-content td {
  border: 1px solid var(--border);
  padding: 6px 10px;
  text-align: left;
  font-size: 0.9em;
}
.node-content th { background: var(--code-bg); font-weight: 600; }
.node-content hr { border: none; border-top: 1px solid var(--border); margin: 12px 0; }
.node-content mark { background: var(--mark-bg); padding: 1px 3px; border-radius: 2px; }
.node-content .tag {
  background: var(--accent);
  color: white;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 0.8em;
  font-weight: 500;
}
.node-content .checklist { list-style: none; margin-left: 0; }
.node-content .task-item { display: flex; align-items: center; gap: 6px; }
.node-content .task-item input { margin: 0; }
.node-content .footnote-ref { color: var(--accent); cursor: pointer; }
.node-content .file-ref {
  font-size: 0.85em;
  color: var(--text-muted);
  font-style: italic;
}
.node-content .external-link {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.node-content .link-iframe { display: none; }
.node-content .link-iframe.visible { display: block; }

.edge-label {
  position: absolute;
  transform: translate(-50%, -50%);
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  z-index: 6;
  pointer-events: none;
  white-space: nowrap;
}

.controls {
  position: fixed;
  top: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 2000;
}
.controls button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  width: 38px;
  height: 38px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.controls button:hover { background: var(--surface-hover); }

.search-bar {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 2000;
  display: flex;
  gap: 0;
}
.search-bar input {
  background: var(--surface);
  border: 1px solid var(--border);
  border-right: none;
  color: var(--text);
  padding: 8px 14px;
  border-radius: 8px 0 0 8px;
  font-size: 14px;
  width: 260px;
  outline: none;
}
.search-bar input:focus { border-color: var(--accent); }
.search-bar button {
  background: var(--accent);
  border: none;
  color: white;
  padding: 8px 14px;
  border-radius: 0 8px 8px 0;
  cursor: pointer;
  font-size: 14px;
}

.node.search-highlight {
  outline: 3px solid var(--accent);
  outline-offset: 2px;
  animation: pulse 1s ease-in-out 2;
}
@keyframes pulse {
  0%, 100% { outline-color: var(--accent); }
  50% { outline-color: transparent; }
}

.theme-toggle {
  position: fixed;
  top: 12px;
  left: 12px;
  z-index: 2000;
}
.theme-toggle button {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
}

.info-badge {
  position: fixed;
  bottom: 12px;
  left: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  z-index: 2000;
}

.minimap {
  position: fixed;
  bottom: 12px;
  right: 12px;
  width: 200px;
  height: 150px;
  background: var(--minimap-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  z-index: 2000;
  cursor: pointer;
}
.minimap canvas { width: 100%; height: 100%; }
  `;

// ─────────────────────────────────────────────────────────────
// JavaScript (Pan, Zoom, Drag, Suche, Theme, Minimap)
// ─────────────────────────────────────────────────────────────

  const js = `
(function() {
  "use strict";

  let scale = 1, panX = 0, panY = 0;
  let isPanning = false, isDragging = false;
  let panSX = 0, panSY = 0;
  let dragNode = null, dragOffX = 0, dragOffY = 0;
  let isDark = ${isDark};
  let searchIdx = 0, searchMatches = [];

  const vp  = document.getElementById("viewport");
  const wld = document.getElementById("world");
  const pageEl = document.querySelector(".canvas-page");
  const minimapEl = document.querySelector(".minimap");

  function apply() {
    wld.style.transform = "translate(" + panX + "px," + panY + "px) scale(" + scale + ")";
    updateMinimap();
  }

  // ── Zoom per Mausrad ──
  vp.addEventListener("wheel", function(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const r = (scale + delta) / scale;
    scale = Math.min(5, Math.max(0.05, scale + delta));
    panX = e.clientX - (e.clientX - panX) * r;
    panY = e.clientY - (e.clientY - panY) * r;
    apply();
  }, { passive: false });

  // ── Pan per Drag auf den Hintergrund ──
  vp.addEventListener("pointerdown", function(e) {
    if (e.target.closest(".node") && !e.target.closest(".node-group")) return;
    isPanning = true;
    panSX = e.clientX - panX;
    panSY = e.clientY - panY;
    vp.classList.add("grabbing");
    vp.setPointerCapture(e.pointerId);
  });

  vp.addEventListener("pointermove", function(e) {
    if (!isPanning) return;
    panX = e.clientX - panSX;
    panY = e.clientY - panSY;
    apply();
  });

  vp.addEventListener("pointerup", function() {
    isPanning = false;
    vp.classList.remove("grabbing");
  });

  // ── Node Drag ──
  document.querySelectorAll(".node:not(.node-group)").forEach(function(node) {
    node.addEventListener("pointerdown", function(e) {
      if (e.target.closest("a") || e.target.closest("input")) return;
      e.stopPropagation();
      isDragging = true;
      dragNode = node;
      dragNode.classList.add("dragging");
      const rect = node.getBoundingClientRect();
      dragOffX = (e.clientX - rect.left) / scale;
      dragOffY = (e.clientY - rect.top) / scale;
      vp.setPointerCapture(e.pointerId);
    });
  });

  vp.addEventListener("pointermove", function(e) {
    if (!isDragging || !dragNode) return;
    const nx = (e.clientX / scale) - panX / scale - dragOffX;
    const ny = (e.clientY / scale) - panY / scale - dragOffY;
    dragNode.style.left = nx.toFixed(1) + "px";
    dragNode.style.top  = ny.toFixed(1) + "px";
    updateEdges();
    updateMinimap();
  });

  vp.addEventListener("pointerup", function() {
    if (dragNode) dragNode.classList.remove("dragging");
    isDragging = false;
    dragNode = null;
  });

  // ── Kanten-Updates nach Drag ──
  function updateEdges() {
    document.querySelectorAll(".node").forEach(function(n) {
      var id = n.dataset.nodeId;
      if (!id) return;
    });
  }

  // ── Zoom-Buttons ──
  window.zoomIn  = function() { zoomAt(vp.clientWidth / 2, vp.clientHeight / 2,  0.15); };
  window.zoomOut = function() { zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, -0.15); };
  window.resetView = function() {
    scale = 1; panX = 0; panY = 0;
    apply();
  };

  function zoomAt(cx, cy, delta) {
    var old = scale;
    scale = Math.min(5, Math.max(0.05, scale + delta));
    var r = scale / old;
    panX = cx - (cx - panX) * r;
    panY = cy - (cy - panY) * r;
    apply();
  }

  // ── Suche ──
  window.doSearch = function() {
    var term = document.getElementById("search-input").value.trim();
    if (!term) return;

    document.querySelectorAll(".node").forEach(function(n) {
      n.classList.remove("search-highlight");
    });

    var hits = document.evaluate(
      ".//*[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'" +
      term.toLowerCase() + "')]",
      pageEl, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null
    );

    searchMatches = [];
    var seen = new Set();
    for (var i = 0; i < hits.snapshotLength; i++) {
      var node = hits.snapshotItem(i).closest(".node");
      if (node && !seen.has(node)) {
        seen.add(node);
        node.classList.add("search-highlight");
        searchMatches.push(node);
      }
    }

    if (searchMatches.length > 0) {
      searchIdx = 0;
      scrollToMatch();
      new Notice(term + ": " + searchMatches.length + " Treffer", 2000);
    } else {
      new Notice("Keine Treffer f\u00FCr: " + term, 2000);
    }
  };

  window.nextSearch = function() {
    if (!searchMatches.length) return;
    searchIdx = (searchIdx + 1) % searchMatches.length;
    scrollToMatch();
  };

  function scrollToMatch() {
    if (!searchMatches[searchIdx]) return;
    var el = searchMatches[searchIdx];
    var r = el.getBoundingClientRect();
    panX = vp.clientWidth  / 2 - (r.left + r.width  / 2);
    panY = vp.clientHeight / 2 - (r.top  + r.height / 2);
    apply();
  }

  // ── Theme-Toggle ──
  window.toggleTheme = function() {
    isDark = !isDark;
    var root = document.documentElement;
    if (isDark) {
      root.style.setProperty("--bg",            "#1a1a2e");
      root.style.setProperty("--surface",       "#16213e");
      root.style.setProperty("--surface-hover",  "#1a2744");
      root.style.setProperty("--border",         "#2a3a5c");
      root.style.setProperty("--text",           "#e0e0e0");
      root.style.setProperty("--text-muted",     "#8899aa");
      root.style.setProperty("--title",          "#ffffff");
      root.style.setProperty("--edge-color",     "#5588bb");
    } else {
      root.style.setProperty("--bg",            "#f0f0f0");
      root.style.setProperty("--surface",        "#ffffff");
      root.style.setProperty("--surface-hover",  "#f8f8ff");
      root.style.setProperty("--border",         "#d0d0d0");
      root.style.setProperty("--text",           "#333333");
      root.style.setProperty("--text-muted",     "#888888");
      root.style.setProperty("--title",          "#111111");
      root.style.setProperty("--edge-color",     "#888888");
    }
  };

  // ── Minimap ──
  function updateMinimap() {
    var mc = document.getElementById("minimap-canvas");
    if (!mc) return;
    var ctx = mc.getContext("2d");
    var pw = pageEl.offsetWidth, ph = pageEl.offsetHeight;
    mc.width = 200; mc.height = Math.round(200 * ph / pw);

    ctx.fillStyle = isDark ? "#0d1117" : "#ffffff";
    ctx.fillRect(0, 0, mc.width, mc.height);

    document.querySelectorAll(".node").forEach(function(n) {
      var r = n.getBoundingClientRect();
      var vp2 = vp.getBoundingClientRect();
      var nx = (r.left - vp2.left) / scale + panX / scale;
      var ny = (r.top  - vp2.top)  / scale + panY / scale;
      var nw = r.width  / scale;
      var nh = r.height / scale;
      ctx.fillStyle = isDark ? "#4da6ff55" : "#4da6ff44";
      ctx.fillRect(nx, ny, nw, nh);
      ctx.strokeStyle = isDark ? "#4da6ffaa" : "#4da6ff88";
      ctx.strokeRect(nx, ny, nw, nh);
    });

    var vw = vp.clientWidth / scale;
    var vh = vp.clientHeight / scale;
    var vx = -panX / scale;
    var vy = -panY / scale;
    ctx.strokeStyle = "#ff6644";
    ctx.lineWidth = 2;
    ctx.strokeRect(vx, vy, vw, vh);
  }

  minimapEl && minimapEl.addEventListener("click", function(e) {
    var rect = minimapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var pw = pageEl.offsetWidth,  ph = pageEl.offsetHeight;
    var vw = vp.clientWidth / scale, vh = vp.clientHeight / scale;
    panX = -(mx * pw / 200 - vp.clientWidth  / 2) * scale;
    panY = -(my * ph / 200 - vp.clientHeight / 2) * scale;
    apply();
  });

  // ── Info-Badge ──
  function updateInfo() {
    var badge = document.getElementById("info-badge");
    if (badge) badge.textContent = scale.toFixed(1) + "x";
  }

  // ── Link-Vorschau Toggle ──
  document.querySelectorAll(".node-type-link").forEach(function(n) {
    var toggle = n.querySelector(".toggle-iframe");
    if (!toggle) {
      toggle = document.createElement("button");
      toggle.className = "toggle-iframe";
      toggle.textContent = "Vorschau";
      toggle.style.cssText = "margin-top:8px;font-size:12px;padding:4px 10px;" +
        "background:var(--accent);color:white;border:none;border-radius:4px;cursor:pointer;";
      var content = n.querySelector(".node-content");
      if (content) content.appendChild(toggle);
    }
    toggle.addEventListener("click", function() {
      var iframe = n.querySelector("iframe");
      if (iframe) iframe.classList.toggle("visible");
    });
  });

  // ── Keyboard Shortcuts ──
  document.addEventListener("keydown", function(e) {
    if (e.key === "Escape") {
      document.querySelectorAll(".node.search-highlight")
        .forEach(function(n) { n.classList.remove("search-highlight"); });
      searchMatches = [];
    }
    if (e.key === "f" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      var inp = document.getElementById("search-input");
      if (inp) inp.focus();
    }
  });

  apply();
  updateMinimap();
})();
`;

  // ── HTML-Struktur ──
  return (
`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${css}</style>
</head>
<body>
  <div id="viewport">
    <div id="world">
      <div class="canvas-page">
        ${edgesSvg}
        ${nodesHtml}
      </div>
    </div>
  </div>

  <div class="theme-toggle">
    <button onclick="toggleTheme()" title="Dark/Light wechseln">&#9788;</button>
  </div>

  <div class="search-bar">
    <input id="search-input" placeholder="Suchen... (Ctrl+F)"
           onkeydown="if(event.key==='Enter')doSearch()">
    <button onclick="doSearch()">&#128269;</button>
    <button onclick="nextSearch()" title="N\u00E4chster Treffer">&#8680;</button>
  </div>

  <div class="controls">
    <button onclick="zoomIn()"      title="Vergr\u00F6\u00DFern">+</button>
    <button onclick="zoomOut()"     title="Verkleinern">&#8722;</button>
    <button onclick="resetView()"   title="Ansicht zur\u00FCcksetzen">&#8634;</button>
  </div>

  <div id="info-badge" class="info-badge">1.0x</div>

  <div class="minimap">
    <canvas id="minimap-canvas"></canvas>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/obsidian@latest/obsidian.min.js"></script>
  <script>${js}</script>
</body>
</html>`
  );
}

// ─────────────────────────────────────────────────────────────
// Hauptfunktion: CanvasData → HTML-String
// ─────────────────────────────────────────────────────────────

export function convertCanvasToHtml(
  canvasData: CanvasData,
  opts: ExportOptions = {}
): string {
  return generateHtml(canvasData, opts);
}