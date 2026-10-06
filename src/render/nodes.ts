import { safeNavigationUrl, safeWebPreviewUrl } from "../helpers/link-helpers";
import { getNodeFrame, getNodeMediaKind } from "./geometry";
import { escapeAttribute, escapeHtml } from "./html";
import { markdownToHtml } from "./markdown";
import { buildCanvasEdgeColorMap, getTheme, resolveNodeColors } from "./theme";
import type { CanvasData, CanvasNode, HighlightingThemeChoice, SearchEntry } from "./types";

const FOCUS_ICON_SVG = `<svg class="branch-focus-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="3"></circle><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path></svg>`;

export async function renderNode(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
  theme: ReturnType<typeof getTheme>,
  darkMode: boolean,
  canvasColors?: Record<string, string>,
  highlightingTheme?: HighlightingThemeChoice,
  descendantCount = 0,
  foldingControlsInitiallyHidden = false,
): Promise<string> {
  const frame = getNodeFrame(node, offsetX, offsetY);
  const type = (node.type || "text").toLowerCase();
  const isPdf = node.fileKind === "pdf";
  const mediaKind = type === "file" ? getNodeMediaKind(node) : "";
  const classes = ["node", type, type === "group" ? "group" : "", isPdf ? "pdf" : "", mediaKind].filter(Boolean).join(" ");
  const colors = resolveNodeColors(node, theme, canvasColors);
  const usesLayeredShape = node.shape === "diamond" || node.shape === "document";
  const renderedBackground = usesLayeredShape || node.borderStyle === "invisible"
    ? "transparent"
    : colors.background;
  const renderedBorder = usesLayeredShape || node.borderStyle === "invisible"
    ? "transparent"
    : colors.border;
  const advancedStyleAttributes = [
    node.shape ? `data-node-shape="${escapeAttribute(node.shape)}"` : "",
    node.borderStyle ? `data-node-border="${escapeAttribute(node.borderStyle)}"` : "",
    node.textAlign ? `data-node-text-align="${escapeAttribute(node.textAlign)}"` : "",
  ].filter(Boolean).join("\n    ");

  let title = "";
  if (type !== "group" && type !== "link" && node.fileKind !== "canvas" && node.label) {
    title = `<div class="node-title">${await markdownToHtml(node.label, { darkMode, highlightingTheme })}</div>`;
  }

  const content = type === "group" ? "" : await renderNodeContent(node, darkMode, highlightingTheme, canvasColors);
  const foldingControlHiddenAttribute = foldingControlsInitiallyHidden ? " hidden" : "";
  const focusTarget = type === "group" ? "group" : "node";
  const focusControl = `<button class="branch-focus-control" type="button" data-focus-node-id="${escapeAttribute(node.id)}" aria-label="${descendantCount > 0 ? "Focus branch" : `Focus ${focusTarget}`}" aria-pressed="false" title="${descendantCount > 0 ? `Focus branch · ${descendantCount} ${descendantCount === 1 ? "descendant" : "descendants"}` : `Focus ${focusTarget}`}"${foldingControlHiddenAttribute}>${FOCUS_ICON_SVG}</button>`;
  const branchControl = descendantCount > 0
    ? `<button class="branch-control" type="button" data-branch-node-id="${escapeAttribute(node.id)}" aria-expanded="true" aria-label="Collapse branch · ${descendantCount} ${descendantCount === 1 ? "descendant" : "descendants"}" title="Collapse branch · ${descendantCount} ${descendantCount === 1 ? "descendant" : "descendants"}"${foldingControlHiddenAttribute}>−</button>`
    : "";
  const nodeControls = focusControl || branchControl
    ? `<div class="node-controls">${focusControl}${branchControl}</div>`
    : "";

  return `<div
    id="node-${escapeAttribute(node.id)}"
    class="${classes}"
    data-node-id="${escapeAttribute(node.id)}"
    data-canvas-left="${frame.left}"
    data-canvas-top="${frame.top}"
    data-canvas-width="${frame.width}"
    data-canvas-height="${frame.height}"
    ${advancedStyleAttributes}
    style="left:${frame.left}px;top:${frame.top}px;width:${frame.width}px;height:${frame.height}px;background:${renderedBackground};border-color:${renderedBorder};--node-background-color:${colors.background};--node-border-color:${colors.border};"
  >${nodeControls}${title}<div class="node-content">${content}</div></div>`;
}

export function renderGroupTitle(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
  theme: ReturnType<typeof getTheme>,
  canvasColors: Record<string, string> | undefined,
  groupContentCount: number,
): string {
  const frame = getNodeFrame(node, offsetX, offsetY);
  const colors = resolveNodeColors(node, theme, canvasColors);
  const groupName = (node.label || node.text || "").trim() || "Group";
  const groupCountLabel = groupContentCount > 0
    ? ` · ${groupContentCount} contained ${groupContentCount === 1 ? "item" : "items"}`
    : "";
  const groupControl = `<button class="advanced-group-control${node.advancedGroupCollapsed && groupContentCount > 0 ? " has-hidden-count" : ""}" type="button" data-advanced-group-id="${escapeAttribute(node.id)}" aria-expanded="${String(!node.advancedGroupCollapsed)}" aria-label="${node.advancedGroupCollapsed ? "Expand" : "Collapse"} group${groupCountLabel}" title="${node.advancedGroupCollapsed ? "Expand" : "Collapse"} group${groupCountLabel}">${node.advancedGroupCollapsed ? groupContentCount > 0 ? String(groupContentCount) : "+" : "−"}</button>`;
  return `<div id="group-title-${escapeAttribute(node.id)}" class="group-title" data-group-title-node-id="${escapeAttribute(node.id)}" style="left:${frame.left}px;top:${frame.top}px;max-width:${frame.width}px;--node-border-color:${colors.border};"><span class="group-title-text">${escapeHtml(groupName)}</span>${groupControl}</div>`;
}

export function renderMinimapNode(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
  theme: ReturnType<typeof getTheme>,
  canvasColors?: Record<string, string>,
): string {
  const type = (node.type || "text").toLowerCase();
  const frame = getNodeFrame(node, offsetX, offsetY);
  const colors = resolveNodeColors(node, theme, canvasColors);
  const classes = ["minimap-node", type === "group" ? "group" : ""].filter(Boolean).join(" ");
  const radius = type === "group" ? 14 : 10;

  if (node.shape === "diamond") {
    const centerX = frame.left + frame.width / 2;
    const centerY = frame.top + frame.height / 2;
    const points = `${centerX},${frame.top} ${frame.left + frame.width},${centerY} ${centerX},${frame.top + frame.height} ${frame.left},${centerY}`;
    return `<polygon class="${classes}" data-node-id="${escapeAttribute(node.id)}" points="${points}" fill="${escapeAttribute(colors.minimapFill)}" stroke="${escapeAttribute(colors.minimapStroke)}"></polygon>`;
  }

  if (node.shape === "parallelogram") {
    const inset = Math.min(24, frame.width * 0.12);
    const points = `${frame.left + inset},${frame.top} ${frame.left + frame.width},${frame.top} ${frame.left + frame.width - inset},${frame.top + frame.height} ${frame.left},${frame.top + frame.height}`;
    return `<polygon class="${classes}" data-node-id="${escapeAttribute(node.id)}" points="${points}" fill="${escapeAttribute(colors.minimapFill)}" stroke="${escapeAttribute(colors.minimapStroke)}"></polygon>`;
  }

  if (node.shape === "circle") {
    return `<ellipse class="${classes}" data-node-id="${escapeAttribute(node.id)}" cx="${frame.left + frame.width / 2}" cy="${frame.top + frame.height / 2}" rx="${frame.width / 2}" ry="${frame.height / 2}" fill="${escapeAttribute(colors.minimapFill)}" stroke="${escapeAttribute(colors.minimapStroke)}"></ellipse>`;
  }

  const shapeRadius = node.shape === "pill" ? frame.height / 2 : radius;

  return `<rect class="${classes}" data-node-id="${escapeAttribute(node.id)}" x="${frame.left}" y="${frame.top}" width="${frame.width}" height="${frame.height}" rx="${shapeRadius}" ry="${shapeRadius}" fill="${escapeAttribute(colors.minimapFill)}" stroke="${escapeAttribute(colors.minimapStroke)}"></rect>`;
}

export function buildSearchEntry(
  node: CanvasNode,
  offsetX: number,
  offsetY: number,
): SearchEntry {
  const frame = getNodeFrame(node, offsetX, offsetY);
  const nodeType = (node.type || "").toLowerCase();
  const isSearchableFile = nodeType === "file" && node.fileKind !== "canvas";
  const previewText = node.previewHtml
    ? normalizeSearchText(htmlToSearchText(node.previewHtml))
    : normalizeSearchText(node.previewText);
  const parts = [
    node.label,
    node.displayName,
    node.text,
    previewText,
    node.url,
  ]
    .map((value) => normalizeSearchText(value))
    .filter(Boolean);
  const title = parts[0] || defaultNodeTitle(node);
  const snippet = parts.slice(1).join(" ").slice(0, 220) || title;
  const fullSearchText = normalizeSearchText(node.searchText);
  const isMarkdownFile = nodeType === "file" && node.fileKind === "markdown";
  const markdownContent = node.searchText === undefined ? previewText : fullSearchText;
  const searchableParts = isMarkdownFile
    ? [normalizeSearchText(node.displayName), markdownContent].filter(Boolean)
    : [...parts, fullSearchText].filter(Boolean);
  const sourceFile = nodeType === "file"
    ? String(node.file || "").trim()
    : "";
  return {
    id: node.id,
    focusNodeId: node.id,
    title,
    snippet,
    text: isSearchableFile ? searchableParts.join(" ").trim() : "",
    kindLabel: humanizeNodeKind(node),
    positionLabel: `x ${Math.round(frame.left)} · y ${Math.round(frame.top)}`,
    dedupeKey: sourceFile ? `file:${sourceFile}` : undefined,
    openHref: resolveNodeOpenHref(node),
    openTarget: node.canvasNavigationTarget,
  };
}

function resolveNodeOpenHref(node: CanvasNode): string | undefined {
  if (node.canvasHref) return node.canvasHref;
  if (node.exportHtmlPath) return node.exportHtmlPath;
  return undefined;
}

function defaultNodeTitle(node: CanvasNode): string {
  return humanizeNodeKind(node);
}

function humanizeNodeKind(node: CanvasNode): string {
  const type = (node.type || "text").toLowerCase();
  if (type === "file" && node.fileKind === "markdown") return "Markdown";
  if (type === "file" && node.fileKind === "canvas") return "Canvas";
  if (type === "file" && node.fileKind === "image") return "Image";
  if (type === "file" && node.fileKind === "pdf") return "PDF";
  if (type === "file" && node.fileKind === "audio") return "Audio";
  if (type === "file" && node.fileKind === "video") return "Video";
  if (type === "file") return "File";
  if (type === "link") return "Link";
  if (type === "group") return "Group";
  return "Text";
}

function normalizeSearchText(value: string | undefined): string {
  return String(value || "")
    .replace(/\r\n?/g, "\n")
    .replace(/[#>*`_\x5b\x5d()!|-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function htmlToSearchText(html: string | undefined): string {
  return String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

function buildAnchorAttributes(href: string, target?: "_parent"): string {
  const safeHref = escapeAttribute(href);
  const targetAttr = target ? ` target="${target}"` : "";
  if (href.startsWith("#page-") && !target) {
    const pageId = href.replace(/^#page-/, "").split(/[?#]/)[0];
    return `href="${safeHref}" data-inline-page="${escapeAttribute(pageId)}"`;
  }
  return `href="${safeHref}"${targetAttr}`;
}

async function renderNodeContent(
  node: CanvasNode,
  darkMode: boolean,
  highlightingTheme?: HighlightingThemeChoice,
  canvasColors?: Record<string, string>,
): Promise<string> {
  const type = (node.type || "text").toLowerCase();

  if (type === "group") {
    return "";
  }

  if (type === "link") {
    const url = typeof node.url === "string" ? node.url.trim() : "";
    if (!url) return "<p>Empty link node</p>";
    const displayName = escapeHtml(node.displayName || url);
    const iframeSrc = escapeAttribute(safeWebPreviewUrl(url));
    const href = safeNavigationUrl(node.canvasHref || node.exportHtmlPath || url);
    return `<div class="link-preview">
      <div class="link-preview-header">
        <a class="link-preview-title" ${buildAnchorAttributes(href)}>${displayName}</a>
      </div>
      <div class="link-offline-note" data-link-offline hidden>No internet connection is available.</div>
      <div class="link-offline-note" data-link-blocked hidden>This website may not allow embedded previews. Use the heading above.</div>
      <div class="link-preview-frame"><iframe src="${iframeSrc}" title="${escapeAttribute(node.displayName || url)}" loading="lazy"></iframe></div>
    </div>`;
  }

  if (type === "file") {
    const displayName = escapeHtml(node.displayName || node.file || "File");
    const href = escapeAttribute(
      (node.fileKind === "markdown" || node.fileKind === "canvas") && node.canvasHref
        ? node.canvasHref
        : node.exportHtmlPath || node.exportPath || node.file || "",
    );

    if (node.fileKind === "image") {
      return `<a ${buildAnchorAttributes(href)}><img src="${href}" alt="${displayName}"></a>`;
    }

    if (node.fileKind === "markdown") {
      const preview = node.previewHtml
        ? `<div class="md-card-preview">${node.previewHtml}</div>`
        : (node.previewText ? `<p class="md-card-preview-text">${escapeHtml(node.previewText)}</p>` : "");

      return `<div class="md-card"><a class="md-card-title-link" ${buildAnchorAttributes(href)}><div class="md-card-title">${displayName}</div></a>${preview}</div>`;
    }

    if (node.fileKind === "canvas") {
      const canvasTitle = node.label?.trim() || node.displayName || node.file || "Canvas";
      const preview = node.canvasPreview
        ? renderCanvasCardPreview(node.canvasPreview, canvasTitle, darkMode, canvasColors)
        : "";
      return `<a class="canvas-card-link" ${buildAnchorAttributes(href, node.canvasNavigationTarget)}><span class="canvas-card-title">${escapeHtml(canvasTitle)}</span>${preview}</a>`;
    }

    if (node.fileKind === "pdf") {
      const pdfHref = escapeAttribute(node.exportPath || node.file || "");
      if (!pdfHref) return "<p>Empty PDF node</p>";
      const viewerHref = escapeAttribute(node.canvasHref || node.exportPath || node.file || "");
      const pdfTitle = escapeHtml(node.displayName || node.file || "PDF");
      const pdfTitleAttr = escapeAttribute(node.displayName || node.file || "PDF");
      return `<div class="pdf-embed"><a class="pdf-title-link" ${buildAnchorAttributes(viewerHref)}><div class="pdf-title">${pdfTitle}</div></a><iframe src="${pdfHref}" title="${pdfTitleAttr}" loading="lazy"></iframe></div>`;
    }

    const mediaKind = getNodeMediaKind(node);
    if (mediaKind) {
      const mediaHref = escapeAttribute(node.exportPath || node.file || "");
      if (!mediaHref) return "<p>Empty media node</p>";
      const mediaTitle = escapeHtml(node.displayName || node.file || "Media");
      const mediaTitleAttr = escapeAttribute(node.displayName || node.file || "Media");
      const tag = mediaKind === "audio" ? "audio" : "video";
      return `<div class="media-embed ${tag}-embed"><a class="media-title-link" ${buildAnchorAttributes(mediaHref)}>${mediaTitle}</a><${tag} src="${mediaHref}" title="${mediaTitleAttr}" controls preload="metadata"></${tag}></div>`;
    }

    if (!href) return "<p>Empty file node</p>";
    return `<p><a class="file-chip" ${buildAnchorAttributes(href)}>${displayName}</a></p>`;
  }

  const text = typeof node.text === "string" ? node.text : "";
  if (!text.trim()) return "";
  return node.renderedTextHtml ?? markdownToHtml(text, { darkMode, highlightingTheme });
}

function renderCanvasCardPreview(
  data: CanvasData,
  title: string,
  darkMode: boolean,
  canvasColors?: Record<string, string>,
): string {
  const nodes = data.nodes || [];
  if (nodes.length === 0) return "";
  const theme = getTheme(darkMode);
  const minX = Math.min(...nodes.map((node) => node.x));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxX = Math.max(...nodes.map((node) => node.x + node.width));
  const maxY = Math.max(...nodes.map((node) => node.y + node.height));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const padding = Math.max(24, Math.min(width, height) * 0.04);
  const offsetX = padding - minX;
  const offsetY = padding - minY;
  const frames = new Map(nodes.map((node) => [node.id, getNodeFrame(node, offsetX, offsetY)]));
  const edgeColors = buildCanvasEdgeColorMap(canvasColors);
  const edges = (data.edges || []).map((edge) => {
    const from = frames.get(edge.fromNode);
    const to = frames.get(edge.toNode);
    if (!from || !to) return "";
    const color = edge.color?.startsWith("#") ? edge.color : edgeColors[edge.color || ""] || theme.edge;
    return `<line x1="${from.left + from.width / 2}" y1="${from.top + from.height / 2}" x2="${to.left + to.width / 2}" y2="${to.top + to.height / 2}" stroke="${escapeAttribute(color)}"></line>`;
  }).join("");
  const orderedNodes = [...nodes].sort((left, right) => Number(left.type !== "group") - Number(right.type !== "group"));
  const previewNodes = orderedNodes.map((node) => renderMinimapNode(node, offsetX, offsetY, theme, canvasColors)).join("");
  const viewWidth = width + padding * 2;
  const viewHeight = height + padding * 2;
  return `<svg class="canvas-card-preview" viewBox="0 0 ${viewWidth} ${viewHeight}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Preview of ${escapeAttribute(title)}"><g class="canvas-card-preview-edges">${edges}</g><g class="canvas-card-preview-nodes">${previewNodes}</g></svg>`;
}
