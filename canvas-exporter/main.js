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
function markdownToHtml(md) {
  if (!md)
    return "";
  let text = md;
  text = text.replace(/&(?!#?\w+;)/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  text = text.replace(
    /```(\w*)\n?([\s\S]*?)```/g,
    (_m, lang, code) => {
      return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
    }
  );
  text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
  text = text.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
  text = text.replace(/^### (.*$)/gm, "<h3>$1</h3>");
  text = text.replace(/^## (.*$)/gm, "<h2>$1</h2>");
  text = text.replace(/^# (.*$)/gm, "<h1>$1</h1>");
  text = text.replace(/\*\*\*(.*?)\*\*\*/g, "<strong><em>$1</em></strong>");
  text = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/\*(.*?)\*/g, "<em>$1</em>");
  text = text.replace(/___(.*?)___/g, "<strong><em>$1</em></strong>");
  text = text.replace(/__(.*?)__/g, "<strong>$1</strong>");
  text = text.replace(/_(.*?)_/g, "<em>$1</em>");
  text = text.replace(/~~(.*?)~~/g, "<del>$1</del>");
  text = text.replace(
    /\[\[([^\]|]+)\|([^\]]+)\]\]/g,
    '<a href="$1">$2</a>'
  );
  text = text.replace(/\[\[([^\]]+)\]\]/g, '<a href="$1">$1</a>');
  text = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank">$1</a>'
  );
  text = text.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" style="max-width:100%;">'
  );
  text = text.replace(
    /!\[\[([^\]]+)\]\]/g,
    '<img src="$1" alt="$1" style="max-width:100%;">'
  );
  text = text.replace(/^&gt; (.*)$/gm, "<blockquote>$1</blockquote>");
  text = text.replace(/^---$/gm, "<hr>");
  text = text.replace(
    /^- \[x\] (.*)$/gm,
    '<div class="checkbox checked">&#9744; $1</div>'
  );
  text = text.replace(
    /^- \[ \] (.*)$/gm,
    '<div class="checkbox">&#9745; $1</div>'
  );
  text = text.replace(/^[\s]*[-*] (.*)$/gm, "<li>$1</li>");
  text = text.replace(/(<li>.*<\/li>\n?)+/g, "<ul>$&</ul>");
  text = text.replace(/^[\s]*\d+\. (.*)$/gm, "<li>$1</li>");
  text = text.replace(/\n/g, "<br>\n");
  text = text.replace(/(<br>\s*){3,}/g, "<br><br>");
  return text;
}
var OBS_COLORS = {
  "1": { bg: "#d73a4a22", border: "#d73a4a" },
  "2": { bg: "#e8a83822", border: "#e8a838" },
  "3": { bg: "#3eb37022", border: "#3eb370" },
  "4": { bg: "#4a90d922", border: "#4a90d9" },
  "5": { bg: "#9b59b622", border: "#9b59b6" },
  "6": { bg: "#eb6ca022", border: "#eb6ca0" }
};
function getNodeColors(color, darkMode = true) {
  if (color && OBS_COLORS[color]) {
    return OBS_COLORS[color];
  }
  if (color && color.startsWith("#")) {
    return { bg: color + "22", border: color };
  }
  return {
    bg: darkMode ? "#2d2d2d" : "#ffffff",
    border: darkMode ? "#555" : "#ccc"
  };
}
function convertCanvasToHtml(data, opts) {
  const nodes = data.nodes || [];
  const edges = data.edges || [];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    minX = Math.min(minX, n.x);
    minY = Math.min(minY, n.y);
    maxX = Math.max(maxX, n.x + n.width);
    maxY = Math.max(maxY, n.y + n.height);
  }
  const pad = 120;
  minX = Math.min(0, minX) - pad;
  minY = Math.min(0, minY) - pad;
  maxX += pad;
  maxY += pad;
  const canvasW = maxX - minX;
  const canvasH = maxY - minY;
  const offX = -minX;
  const offY = -minY;
  const bg = opts.darkMode ? "#1e1e1e" : "#f0f0f0";
  const txt = opts.darkMode ? "#e0e0e0" : "#333";
  const titleC = opts.darkMode ? "#ffffff" : "#000";
  const border = opts.darkMode ? "#444" : "#ccc";
  const edgeC = opts.darkMode ? "#6ea8fe" : "#4a90d9";
  const groupBg = opts.darkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)";
  const groupBd = opts.darkMode ? "#555" : "#bbb";
  const linkC = opts.darkMode ? "#4da6ff" : "#1a73e8";
  const codeBg = opts.darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.07)";
  const preBg = opts.darkMode ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.08)";
  const nodesHtmlParts = [];
  for (const node of nodes) {
    const nx = node.x + offX;
    const ny = node.y + offY;
    const isGroup = node.type === "group" || node.groupNodes && node.groupNodes.length > 0;
    const colors = getNodeColors(node.color, opts.darkMode);
    const bdStyle = isGroup ? "dashed" : "solid";
    const pointerEvents = isGroup ? "none" : "auto";
    let content = "";
    if (node.text !== void 0 && node.text !== null) {
      const t = node.text.trim();
      if (t.startsWith("<")) {
        content = t;
      } else {
        content = markdownToHtml(t);
      }
    }
    let titleHtml = "";
    if (node.label) {
      titleHtml = `<div class="node-title">${markdownToHtml(node.label)}</div>`;
    }
    const typeClass = node.type ? node.type.replace(/[^a-z0-9]/gi, " ").trim().split(" ")[0] : "text";
    const colorClass = node.color ? `color-${node.color}` : "";
    nodesHtmlParts.push(
      `<div class="node ${typeClass} ${colorClass} ${isGroup ? "group" : ""}" id="node-${node.id}" data-node-id="${node.id}" style="left:${nx}px;top:${ny}px;width:${node.width}px;min-height:${Math.max(node.height, 60)}px;background:${isGroup ? groupBg : colors.bg};border:2px ${bdStyle} ${isGroup ? groupBd : colors.border};pointer-events:${pointerEvents};">${titleHtml}<div class="node-content">${content}</div></div>`
    );
  }
  const edgesJson = [];
  for (const edge of edges) {
    edgesJson.push(JSON.stringify({
      fromId: edge.fromNode,
      toId: edge.toNode,
      fromSide: edge.fromSide || "right",
      toSide: edge.toSide || "left",
      label: edge.label || "",
      color: edge.color || ""
    }));
  }
  const edgesDataArray = edgesJson.join(",\n    ");
  const htmlCss = `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      background: ${bg};
      overflow: auto;
      min-height: 100vh;
    }
    #canvas {
      position: relative;
      width: ${canvasW}px;
      height: ${canvasH}px;
      margin: 24px auto;
      border-radius: 8px;
    }
    #edge-svg {
      position: absolute;
      top: 0; left: 0;
      width: 100%; height: 100%;
      pointer-events: none;
      z-index: 1;
      overflow: visible;
    }
    .node {
      position: absolute;
      border-radius: 8px;
      padding: 12px 14px;
      overflow: visible;
      color: ${txt};
      font-size: 14px;
      line-height: 1.65;
      z-index: 10;
      cursor: grab;
      box-shadow: 0 2px 10px rgba(0,0,0,0.25);
      user-select: none;
      transition: box-shadow 0.15s;
    }
    .node:hover {
      box-shadow: 0 4px 18px rgba(0,0,0,0.35);
      z-index: 50;
    }
    .node.dragging {
      cursor: grabbing;
      opacity: 0.92;
      z-index: 200;
      box-shadow: 0 8px 28px rgba(0,0,0,0.45);
    }
    .node.group {
      border-radius: 12px;
      z-index: 2;
      pointer-events: none;
    }
    .node-title {
      font-weight: 700;
      font-size: 13px;
      margin-bottom: 6px;
      padding-bottom: 5px;
      border-bottom: 1px solid ${border};
      color: ${titleC};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .node-content { color: ${txt}; }
    .node-content h1 { font-size: 1.35em; margin: 6px 0 4px; color: ${titleC}; }
    .node-content h2 { font-size: 1.2em;  margin: 6px 0 4px; color: ${titleC}; }
    .node-content h3 { font-size: 1.05em; margin: 4px 0 3px; color: ${titleC}; }
    .node-content img { max-width: 100%; height: auto; border-radius: 4px; margin: 6px 0; display: block; }
    .node-content a { color: ${linkC}; text-decoration: none; }
    .node-content a:hover { text-decoration: underline; }
    .node-content code { background: ${codeBg}; padding: 2px 5px; border-radius: 3px; font-family: Consolas, 'Courier New', monospace; font-size: 0.88em; }
    .node-content pre { background: ${preBg}; padding: 10px 12px; border-radius: 4px; overflow-x: auto; margin: 8px 0; }
    .node-content pre code { background: none; padding: 0; }
    .node-content blockquote { border-left: 3px solid ${linkC}; padding-left: 10px; margin: 8px 0; opacity: 0.85; }
    .node-content ul { margin-left: 18px; margin-bottom: 6px; }
    .node-content ol { margin-left: 18px; margin-bottom: 6px; }
    .node-content li { margin: 2px 0; }
    .node-content hr { border: none; border-top: 1px solid ${border}; margin: 10px 0; }
    .node-content table { border-collapse: collapse; width: 100%; margin: 8px 0; }
    .node-content td, .node-content th { border: 1px solid ${border}; padding: 5px 8px; }
    .checkbox { margin: 3px 0; }
    .checkbox.checked { text-decoration: line-through; opacity: 0.6; }

    /* Obsidian Farben */
    .color-1 { background: #d73a4a22 !important; border-color: #d73a4a !important; }
    .color-2 { background: #e8a83822 !important; border-color: #e8a838 !important; }
    .color-3 { background: #3eb37022 !important; border-color: #3eb370 !important; }
    .color-4 { background: #4a90d922 !important; border-color: #4a90d9 !important; }
    .color-5 { background: #9b59b622 !important; border-color: #9b59b6 !important; }
    .color-6 { background: #eb6ca022 !important; border-color: #eb6ca0 !important; }

    #controls {
      position: fixed; top: 12px; right: 12px;
      background: rgba(0,0,0,0.82); padding: 8px 12px;
      border-radius: 8px; z-index: 9999;
      display: flex; gap: 6px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.4);
    }
    #controls button {
      background: #4da6ff; border: none; color: white;
      padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 13px;
      transition: background 0.15s;
    }
    #controls button:hover { background: #66b3ff; }
    #controls button:active { background: #3d8ae0; }

    #info {
      position: fixed; bottom: 12px; left: 12px;
      background: rgba(0,0,0,0.65); color: #aaa;
      padding: 6px 10px; border-radius: 6px; font-size: 12px; z-index: 9999;
    }
  </style>
</head>
<body>

<div id="controls">
  <button onclick="zoomIn()" title="Zoom rein">+</button>
  <button onclick="zoomOut()" title="Zoom raus">&#8722;</button>
  <button onclick="resetView()" title="Ansicht zur\xFCcksetzen">Reset</button>
  <button onclick="fitToScreen()" title="Alles anzeigen">Fit</button>
</div>

<div id="info">
  <span id="node-count">${nodes.length}</span> Knoten &middot;
  <span id="edge-count">${edges.length}</span> Verbindungen
</div>

<div id="canvas">
  <svg id="edge-svg"></svg>
  ${nodesHtmlParts.join("\n")}
</div>
<script>
(function() {
  "use strict";

  const edgeColor = "${edgeC}";
  const OFFSET_X  = ${offX};
  const OFFSET_Y  = ${offY};

  const OBS_COLORS = {
    "1": "#d73a4a", "2": "#e8a838", "3": "#3eb370",
    "4": "#4a90d9", "5": "#9b59b6", "6": "#eb6ca0"
  };

  const edgesRaw = [
    ${edgesDataArray}
  ];

  const svg      = document.getElementById("edge-svg");
  const canvas   = document.getElementById("canvas");

  // \u2500\u2500 Ankerpunkt berechnen \u2500\u2500
  function getAnchor(el, side) {
    const l = parseFloat(el.style.left);
    const t = parseFloat(el.style.top);
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    switch (side) {
      case "top":    return { x: l + w / 2, y: t };
      case "bottom": return { x: l + w / 2, y: t + h };
      case "left":   return { x: l,         y: t + h / 2 };
      case "right":  return { x: l + w,     y: t + h / 2 };
      default:       return { x: l + w / 2, y: t + h / 2 };
    }
  }

  // \u2500\u2500 Alle Kanten zeichnen \u2500\u2500
  function drawEdges() {
    svg.innerHTML = "";

    // \u2500\u2500 Marker-Definitionen programmatisch (kein innerHTML-Template) \u2500\u2500
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    svg.appendChild(defs);

    function makeMarker(id: string, fill: string) {
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
      marker.setAttribute("id", id);
      marker.setAttribute("markerWidth", "10");
      marker.setAttribute("markerHeight", "7");
      marker.setAttribute("refX", "9");
      marker.setAttribute("refY", "3.5");
      marker.setAttribute("orient", "auto");
      defs.appendChild(marker);

      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", "0 0, 10 3.5, 0 7");
      poly.setAttribute("fill", fill);
      marker.appendChild(poly);
    }

    makeMarker("arrow",    edgeColor);
    makeMarker("arrowg",   "#3eb370");
    makeMarker("arrowr",   "#d73a4a");

    // \u2500\u2500 Kanten \u2500\u2500
    for (const e of edgesRaw) {
      const fromEl = document.getElementById("node-" + e.fromId);
      const toEl   = document.getElementById("node-" + e.toId);
      if (!fromEl || !toEl) continue;

      const a = getAnchor(fromEl, e.fromSide);
      const b = getAnchor(toEl,   e.toSide);

      const dx = Math.max(Math.abs(b.x - a.x) * 0.4, 30);
      const dy = Math.max(Math.abs(b.y - a.y) * 0.4, 30);
      let c1x = a.x, c1y = a.y, c2x = b.x, c2y = b.y;

      if (e.fromSide === "right")  c1x += dx;
      if (e.fromSide === "left")   c1x -= dx;
      if (e.fromSide === "top")    c1y -= dy;
      if (e.fromSide === "bottom") c1y += dy;
      if (e.toSide   === "right")  c2x += dx;
      if (e.toSide   === "left")   c2x -= dx;
      if (e.toSide   === "top")    c2y -= dy;
      if (e.toSide   === "bottom") c2y += dy;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d",
        "M " + a.x + " " + a.y +
        " C " + c1x + " " + c1y + ", " + c2x + " " + c2y + ", " + b.x + " " + b.y
      );
      const col = e.color
        ? (OBS_COLORS[e.color] || e.color)
        : edgeColor;
      const markerId = col === "#3eb370" ? "arrowg"
        : col === "#d73a4a" ? "arrowr"
        : "arrow";
      path.setAttribute("stroke", col);
      path.setAttribute("stroke-width", "2");
      path.setAttribute("fill", "none");
      path.setAttribute("marker-end", "url(#" + markerId + ")");
      path.style.transition = "stroke-width 0.15s";
      path.addEventListener("mouseenter", () => path.setAttribute("stroke-width", "3"));
      path.addEventListener("mouseleave", () => path.setAttribute("stroke-width", "2"));
      svg.appendChild(path);

      // Label
      if (e.label) {
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", String((a.x + b.x) / 2));
        txt.setAttribute("y", String((a.y + b.y) / 2 - 6));
        txt.setAttribute("text-anchor", "middle");
        txt.setAttribute("fill", txtColor);
        txt.setAttribute("font-size", "12");
        txt.setAttribute("font-family", "sans-serif");
        txt.textContent = e.label;
        svg.appendChild(txt);
      }
    }
  }
    // \u2500\u2500 Drag & Drop (Desktop) \u2500\u2500
  let dragEl = null;
  let dragStartX = 0, dragStartY = 0;
  let elStartX = 0, elStartY = 0;

  document.querySelectorAll(".node:not(.group)").forEach(function(el) {
    el.addEventListener("mousedown", function(ev) {
      if (ev.target.tagName === "A"
       || ev.target.tagName === "INPUT"
       || ev.target.tagName === "TEXTAREA"
       || ev.target.closest("pre")
       || ev.target.closest("code")) return;
      dragEl = el;
      el.classList.add("dragging");
      dragStartX = ev.clientX;
      dragStartY = ev.clientY;
      elStartX   = parseFloat(el.style.left);
      elStartY   = parseFloat(el.style.top);
      ev.preventDefault();
    });
  });

  document.addEventListener("mousemove", function(ev) {
    if (!dragEl) return;
    const dx = (ev.clientX - dragStartX) / currentScale;
    const dy = (ev.clientY - dragStartY) / currentScale;
    dragEl.style.left = (elStartX + dx) + "px";
    dragEl.style.top  = (elStartY + dy) + "px";
    drawEdges();
  });

  document.addEventListener("mouseup", function() {
    if (dragEl) dragEl.classList.remove("dragging");
    dragEl = null;
  });

  // \u2500\u2500 Touch-Support (Mobile) \u2500\u2500
  document.querySelectorAll(".node:not(.group)").forEach(function(el) {
    el.addEventListener("touchstart", function(ev) {
      if (ev.target.tagName === "A"
       || ev.target.closest("pre")
       || ev.target.closest("code")) return;
      const touch = ev.touches[0];
      dragEl = el;
      el.classList.add("dragging");
      dragStartX = touch.clientX;
      dragStartY = touch.clientY;
      elStartX   = parseFloat(el.style.left);
      elStartY   = parseFloat(el.style.top);
      ev.preventDefault();
    }, { passive: false });
  });

  document.addEventListener("touchmove", function(ev) {
    if (!dragEl) return;
    const touch = ev.touches[0];
    const dx = (touch.clientX - dragStartX) / currentScale;
    const dy = (touch.clientY - dragStartY) / currentScale;
    dragEl.style.left = (elStartX + dx) + "px";
    dragEl.style.top  = (elStartY + dy) + "px";
    drawEdges();
  }, { passive: true });

  document.addEventListener("touchend", function() {
    if (dragEl) dragEl.classList.remove("dragging");
    dragEl = null;
  });

  // \u2500\u2500 Zoom-Steuerung \u2500\u2500
  let currentScale = 1;

  window.zoomIn = function() {
    currentScale = Math.min(5, currentScale * 1.15);
    canvas.style.transform = "scale(" + currentScale + ")";
    canvas.style.transformOrigin = "top left";
  };

  window.zoomOut = function() {
    currentScale = Math.max(0.1, currentScale * 0.87);
    canvas.style.transform = "scale(" + currentScale + ")";
    canvas.style.transformOrigin = "top left";
  };

  window.resetView = function() {
    currentScale = 1;
    canvas.style.transform = "scale(1)";
  };

  window.fitToScreen = function() {
    const cw = canvas.offsetWidth;
    const ch = canvas.offsetHeight;
    const vw = window.innerWidth  - 40;
    const vh = window.innerHeight - 80;
    const s  = Math.min(vw / cw, vh / ch, 1);
    currentScale = s;
    canvas.style.transform = "scale(" + s + ")";
    canvas.style.transformOrigin = "top left";
  };

  // Mausrad-Zoom (Ctrl/Cmd + Scroll)
  document.body.addEventListener("wheel", function(ev) {
    if (ev.ctrlKey || ev.metaKey) {
      ev.preventDefault();
      if (ev.deltaY < 0) {
        window.zoomIn();
      } else {
        window.zoomOut();
      }
    }
  }, { passive: false });

  // \u2500\u2500 Initialisierung \u2500\u2500
  drawEdges();
  window.addEventListener("resize", drawEdges);
})();
<\/script>

</body>
</html>`;
}

// src/main.ts
var CanvasExporterPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("file-down", "Canvas \u2192 HTML exportieren", async () => {
      await this.exportCurrentCanvas();
    });
    this.addCommand({
      id: "export-canvas-html",
      name: "Export: Aktuellen Canvas als HTML speichern",
      callback: async () => {
        await this.exportCurrentCanvas();
      }
    });
    this.addCommand({
      id: "export-all-canvases",
      name: "Export: Alle Canvas-Dateien im Vault als HTML exportieren",
      callback: async () => {
        await this.exportAllCanvases();
      }
    });
    this.addCommand({
      id: "preview-canvas-html",
      name: "Vorschau: Aktuellen Canvas als HTML anzeigen",
      callback: async () => {
        await this.previewCanvasHtml();
      }
    });
    this.addSettingTab(new CanvasExporterSettingsTab(this.app, this));
  }
  onunload() {
  }
  async exportCurrentCanvas() {
    const canvas = this.getActiveCanvas();
    if (!canvas) {
      new import_obsidian.Notice("Kein Canvas gefunden. \xD6ffne ein Canvas und versuche es erneut.", 4e3);
      return;
    }
    const html = this.canvasToHtml(canvas);
    const name = this.getCanvasName(canvas);
    await this.saveHtmlFile(html, name);
    new import_obsidian.Notice("Canvas erfolgreich als HTML exportiert!", 3e3);
  }
  async exportAllCanvases() {
    const outputDir = this.settings.outputDir || "Canvas-Exports";
    const vault = this.app.vault;
    const allFiles = vault.getAllLoadedFiles();
    let count = 0;
    const skipped = [];
    for (const file of allFiles) {
      if (file instanceof import_obsidian.TFile && file.extension === "canvas") {
        try {
          const content = await vault.read(file);
          const data = JSON.parse(content);
          const opts = {
            darkMode: this.settings.darkMode,
            title: data.name || file.basename,
            exportImages: this.settings.exportImages
          };
          const html = convertCanvasToHtml(data, opts);
          const outPath = `${outputDir}/${file.basename}.html`;
          const folder = vault.getAbstractFileByPath(outputDir);
          if (!folder)
            await vault.createFolder(outputDir);
          await vault.create(outPath, html);
          count++;
        } catch {
          skipped.push(file.basename);
        }
      }
    }
    if (count > 0)
      new import_obsidian.Notice(`${count} Canvas-Dateien exportiert!`, 3e3);
    if (skipped.length > 0) {
      new import_obsidian.Notice(`${skipped.length} fehlgeschlagen: ${skipped.join(", ")}`, 5e3);
    }
  }
  async previewCanvasHtml() {
    const canvas = this.getActiveCanvas();
    if (!canvas) {
      new import_obsidian.Notice("Kein Canvas gefunden.", 4e3);
      return;
    }
    const html = this.canvasToHtml(canvas);
    const name = this.getCanvasName(canvas);
    const tmpPath = `.canvas-preview-${Date.now()}.html`;
    await this.app.vault.create(tmpPath, html);
    const file = this.app.vault.getAbstractFileByPath(tmpPath);
    if (file instanceof import_obsidian.TFile) {
      this.app.workspace.getLeaf(true).openFile(file);
    }
  }
  getActiveCanvas() {
    const { workspace } = this.app;
    for (const leaf of workspace.getLeavesOfType("canvas")) {
      const view = leaf.view;
      if (view && "canvas" in view) {
        return view.canvas;
      }
    }
    const activeLeaf = workspace.getMostRecentLeaf();
    if (activeLeaf?.view && "canvas" in activeLeaf.view) {
      return activeLeaf.view.canvas;
    }
    return null;
  }
  // ═══════════════════════════════════════════════════════════════
  //  canvas.getName() existiert NICHT → Hilfsfunktion
  // ═══════════════════════════════════════════════════════════════
  getCanvasName(canvas) {
    const rawData = canvas.data;
    return rawData?.name || "Canvas-Export";
  }
  canvasToHtml(canvas) {
    const rawData = canvas.data;
    const data = {
      nodes: rawData.nodes || [],
      edges: rawData.edges || [],
      name: rawData.name,
      backgroundColor: rawData.backgroundColor
    };
    const opts = {
      darkMode: this.settings.darkMode,
      title: rawData.name || "Canvas Export",
      exportImages: this.settings.exportImages
    };
    return convertCanvasToHtml(data, opts);
  }
  async saveHtmlFile(html, baseName) {
    const outDir = this.settings.outputDir || "Canvas-Exports";
    const outPath = `${outDir}/${baseName}.html`;
    const folder = this.app.vault.getAbstractFileByPath(outDir);
    if (!folder)
      await this.app.vault.createFolder(outDir);
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (existing) {
      await this.app.vault.modify(existing, html);
    } else {
      await this.app.vault.create(outPath, html);
    }
  }
  // ═══════════════════════════════════════════════════════════════
  //  loadSettings — SO muss es aussehen (async, mit loadData())
  //  Das alte: return new PluginSettings(this)
  //  → new PluginSettings ruft plugin.data.get() auf
  //  → plugin.data existiert NICHT → TypeError → settings = undefined
  // ═══════════════════════════════════════════════════════════════
  async loadSettings() {
    const defaults = {
      darkMode: true,
      outputDir: "Canvas-Exports",
      exportImages: true
    };
    const saved = await this.loadData();
    this.settings = { ...defaults, ...saved };
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var CanvasExporterSettingsTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas to HTML \u2014 Einstellungen" });
    new import_obsidian.Setting(containerEl).setName("Dark Mode").setDesc("Standardm\xE4\xDFig dunklen Modus verwenden").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.darkMode).onChange(async (val) => {
        this.plugin.settings.darkMode = val;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Ausgabeordner").setDesc("Relativer Pfad im Vault (Standard: Canvas-Exports)").addText(
      (text) => text.setValue(this.plugin.settings.outputDir).onChange(async (val) => {
        this.plugin.settings.outputDir = val || "Canvas-Exports";
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian.Setting(containerEl).setName("Bilder einbetten").setDesc("Referenzierte Bilder als Base64 einbetten").addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.exportImages).onChange(async (val) => {
        this.plugin.settings.exportImages = val;
        await this.plugin.saveSettings();
      })
    );
  }
};
//# sourceMappingURL=main.js.map
