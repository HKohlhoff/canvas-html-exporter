type CanvasNode = any;
type CanvasEdge = any;

type CanvasData = {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
};

type ExportOptions = {
  darkMode?: boolean;
};

type RenderContext = {
  nodeMap: Map<string, CanvasNode>;
};

type NormalizeResult = {
  nodes: CanvasNode[];
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export async function convertCanvasToHtml(
  data: CanvasData,
  options: ExportOptions = {}
): Promise<string> {
  const rawNodes = Array.isArray(data.nodes) ? data.nodes : [];
  const rawEdges = Array.isArray(data.edges) ? data.edges : [];

  const norm = normalizeNodes(rawNodes, 40);
  const nodes = norm.nodes;
  const edges = rawEdges;

  const ctx: RenderContext = {
    nodeMap: new Map(nodes.map((n) => [String(n.id), n])),
  };

  const renderedNodes = await Promise.all(nodes.map((n) => renderNode(n, ctx)));
  const nodesHtml = renderedNodes.join("\n");
  const edgesHtml = edges.map((e) => renderEdge(e, ctx)).join("\n");

  return buildHtmlDocument({
    nodesHtml,
    edgesHtml,
    width: norm.width,
    height: norm.height,
    darkMode: !!options.darkMode,
  });
}

function normalizeNodes(nodes: CanvasNode[], margin = 40): NormalizeResult {
  if (!nodes.length) {
    return {
      nodes: [],
      offsetX: 0,
      offsetY: 0,
      width: 1200,
      height: 800,
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
    y: num(n.y) + offsetY,
  }));

  const width = Math.max(1200, Math.ceil(maxX - minX + margin * 2));
  const height = Math.max(800, Math.ceil(maxY - minY + margin * 2));

  return {
    nodes: shifted,
    offsetX,
    offsetY,
    width,
    height,
  };
}

async function renderNode(node: CanvasNode, ctx: RenderContext): Promise<string> {
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

function renderTextNode(node: CanvasNode): string {
  const text = escapeHtml(String(node.text ?? "")).replace(/\n/g, "<br>");

  return renderNodeShell({
    node,
    className: "canvas-node canvas-text-node",
    innerHtml: `<div class="canvas-node-inner">${text}</div>`,
  });
}

function renderLinkNode(node: CanvasNode): string {
  const url = String(node.url ?? "");
  const label = escapeHtml(String((node.title ?? url) || "Link"));

  return renderNodeShell({
    node,
    className: "canvas-node canvas-link-node",
    innerHtml: `
      <div class="canvas-node-inner">
        <a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${label}</a>
      </div>
    `,
  });
}

function renderGroupNode(node: CanvasNode): string {
  const label = escapeHtml(String(node.label ?? node.text ?? ""));

  return `
    <div class="canvas-group"
         style="${nodeBoxStyle(node)}">
      <div class="canvas-group-title">${label}</div>
    </div>
  `;
}

async function renderFileNode(node: CanvasNode): Promise<string> {
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

function renderImageFileNode(node: CanvasNode, filePath: string): string {
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
    `,
  });
}

function renderSimpleFileCard(node: CanvasNode, filePath: string, kind: string): string {
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
    `,
  });
}

function renderUnknownNode(node: CanvasNode): string {
  const label = escapeHtml(`Unbekannter Knotentyp: ${String(node.type ?? "unknown")}`);

  return renderNodeShell({
    node,
    className: "canvas-node canvas-unknown-node",
    innerHtml: `<div class="canvas-node-inner">${label}</div>`,
  });
}

function renderNodeShell(args: {
  node: CanvasNode;
  className: string;
  innerHtml: string;
}): string {
  return `
    <div class="${args.className}" style="${nodeBoxStyle(args.node)}">
      ${args.innerHtml}
    </div>
  `;
}

function nodeBoxStyle(node: CanvasNode): string {
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
    "box-sizing:border-box",
  ].join(";");
}

function renderEdge(edge: CanvasEdge, ctx: RenderContext): string {
  const fromId = String(edge.fromNode ?? edge.from ?? "");
  const toId = String(edge.toNode ?? edge.to ?? "");

  const from = ctx.nodeMap.get(fromId);
  const to = ctx.nodeMap.get(toId);

  if (!from || !to) return "";

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

function buildHtmlDocument(args: {
  nodesHtml: string;
  edgesHtml: string;
  width: number;
  height: number;
  darkMode: boolean;
}): string {
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

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getExtension(file: string): string {
  const i = file.lastIndexOf(".");
  return i >= 0 ? file.slice(i + 1).toLowerCase() : "";
}

function isImageExtension(ext: string): boolean {
  return ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext);
}

function basename(file: string): string {
  return file.split("/").pop()?.split("\\").pop() ?? file;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value: string): string {
  return escapeHtml(value);
}