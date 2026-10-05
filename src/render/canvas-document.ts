import { buildCanvasFoldingGraph, getCanvasDescendants } from "../folding/graph";
import { buildBrowserRuntime } from "./browser-runtime";
import { buildCanvasStyles } from "./canvas-styles";
import { renderContents } from "./contents";
import { getBounds, normalizeEdgeEnd, normalizeEdgeLineStyle, normalizeEdgeWidth, normalizeSide } from "./geometry";
import { escapeAttribute, escapeHtml } from "./html";
import { buildExporterBuildMeta, EXPORTER_SIGNATURE } from "./metadata";
import { buildSearchEntry, renderGroupTitle, renderMinimapNode, renderNode } from "./nodes";
import { buildCalloutCss, buildCanvasColorVariables, buildCanvasEdgeColorMap, buildHeadingColorCss, buildInlineStyleCss, getTheme } from "./theme";
import type { CanvasData, ExportOptions } from "./types";

export async function convertCanvasToHtml(data: CanvasData, options: ExportOptions): Promise<string> {
  const nodes = Array.isArray(data.nodes) ? data.nodes : [];
  const edges = Array.isArray(data.edges) ? data.edges : [];
  const showMinimap = options.showMinimap !== false;
  const showSearch = options.showSearch !== false;
  const foldingInitiallyEnabled = options.foldingInitiallyEnabled === true;
  const exportFormat = options.exportFormat || "package";
  const canvasHomeRestoreAttr = exportFormat === "package" ? ` data-restore-canvas-view="root"` : "";
  const canvasHomeLink = options.canvasHomeHref
    ? `<span class="canvas-return-label">(back to: <a class="canvas-return-link" href="${escapeAttribute(options.canvasHomeHref)}"${options.canvasHomeTarget ? ` target="${options.canvasHomeTarget}"` : ""}${canvasHomeRestoreAttr}>Canvas</a>)</span>`
    : "";
  const embeddedPages = Array.isArray(options.embeddedPages) ? options.embeddedPages : [];
  const contentsHtml = renderContents(options.contents);
  const singlePageNavigation = options.canvasHomeHref
    ? `<a id="single-page-back-link" class="single-page-back-link" href="#">Back</a>
      <a class="single-page-canvas-link" href="${escapeAttribute(options.canvasHomeHref)}"${options.canvasHomeTarget ? ` target="${options.canvasHomeTarget}"` : ""}>Canvas</a>
      ${contentsHtml ? `<button class="single-page-navigation-button" type="button" onclick="toggleContents()" aria-pressed="false">Navigation</button>` : ""}`
    : `<a id="single-page-canvas-link" class="single-page-canvas-link" href="#">Canvas</a>
      ${contentsHtml ? `<button class="single-page-navigation-button" type="button" onclick="toggleContents()" aria-pressed="false">Navigation</button>` : ""}`;
  const initialFoldState = foldingInitiallyEnabled ? options.initialFoldState : undefined;
  const hasImportedFolding = Boolean(
    initialFoldState
    && (initialFoldState.hiddenNodeIds.length > 0 || initialFoldState.hiddenEdgeIds.length > 0),
  );
  const groupNodeIds = nodes
    .filter((node) => node.type.toLowerCase() === "group")
    .map((node) => node.id);
  const contentNodeCount = nodes.length - groupNodeIds.length;
  const canvasCountSummary = [
    `${contentNodeCount} ${contentNodeCount === 1 ? "node" : "nodes"}`,
    ...(groupNodeIds.length > 0
      ? [`${groupNodeIds.length} ${groupNodeIds.length === 1 ? "group" : "groups"}`]
      : []),
    `${edges.length} ${edges.length === 1 ? "connection" : "connections"}`,
  ].join(" · ");

  const bounds = getBounds(nodes);
  const foldingGraph = buildCanvasFoldingGraph(nodes, edges);
  const hasRootedBranches = foldingGraph.rootNodeIds.some(
    (nodeId) => getCanvasDescendants(foldingGraph, nodeId).length > 0,
  );
  const hasFoldingControls = nodes.length > 0 || hasImportedFolding;
  const hasLevelView = foldingGraph.maxLevel > 0;
  const foldingLevelOptions = Array.from(
    { length: foldingGraph.maxLevel + 1 },
    (_, level) => `<option value="${level}">Level ${level}</option>`,
  ).join("");
  const theme = getTheme(options.darkMode);
  const edgePaletteColors = buildCanvasEdgeColorMap(options.canvasColors);
  const calloutCss = buildCalloutCss(options.calloutColors);
  const headingCss = buildHeadingColorCss(".node-content ", options.headingColors);
  const singlePageHeadingCss = buildHeadingColorCss(".single-page-body ", options.headingColors);
  const previewHeadingCss = buildHeadingColorCss(".md-card-preview ", options.headingColors);
  const contentInlineStyleCss = buildInlineStyleCss(".node-content ", options.inlineStyleColors);
  const singlePageInlineStyleCss = buildInlineStyleCss(".single-page-body ", options.inlineStyleColors);
  const previewInlineStyleCss = buildInlineStyleCss(".md-card-preview ", options.inlineStyleColors, { strongFallbackColor: theme.text });

  const nodeHtml = (await Promise.all(
    nodes.map((node) =>
      renderNode(
        node,
        bounds.offsetX,
        bounds.offsetY,
        theme,
        options.darkMode,
        options.canvasColors,
        options.highlightingTheme,
        getCanvasDescendants(foldingGraph, node.id).length,
        !foldingInitiallyEnabled,
      ),
    ),
  )).join("\n");
  const groupTitleHtml = nodes
    .filter((node) => node.type.toLowerCase() === "group")
    .map((node) => renderGroupTitle(
      node,
      bounds.offsetX,
      bounds.offsetY,
      theme,
      options.canvasColors,
      foldingGraph.groupContentsByNode[node.id]?.length ?? 0,
    ))
    .join("\n");

  const edgesData = edges.map((edge) => ({
    id: edge.id ?? "",
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
  const searchEntries = nodes
    .map((node) => buildSearchEntry(node, bounds.offsetX, bounds.offsetY))
    .filter((entry) => entry.text)
    .concat(options.additionalSearchEntries || []);

  const canvasColorVars = buildCanvasColorVariables(options.canvasColors);
  const minimapHtml = showMinimap
    ? `<aside id="minimap-panel" class="minimap" aria-label="Canvas minimap" hidden>
    <div id="minimap-drag-handle" class="minimap-header" title="Move minimap">
      <div class="minimap-header-copy">
        <strong>Minimap</strong>
      </div>
    </div>
    <svg id="minimap-svg" viewBox="0 0 ${bounds.width} ${bounds.height}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <rect class="minimap-background" x="0" y="0" width="${bounds.width}" height="${bounds.height}"></rect>
      ${nodes.map((node) => renderMinimapNode(node, bounds.offsetX, bounds.offsetY, theme, options.canvasColors)).join("\n      ")}
      <rect id="minimap-viewport" class="minimap-viewport" x="0" y="0" width="0" height="0"></rect>
    </svg>
  </aside>`
    : "";
  const searchHtml = showSearch
    ? `<div id="search-overlay" class="search-overlay" hidden>
    <div class="search-panel" role="dialog" aria-modal="true" aria-labelledby="search-title">
      <div class="search-panel-header">
        <strong id="search-title">Search</strong>
        <button id="search-close-button" type="button" class="search-close-button" aria-label="Close search">Close</button>
      </div>
      <input id="search-input" class="search-input" type="search" aria-label="Search canvas" placeholder="Enter a search term" autocomplete="off">
      <div id="search-summary" class="search-summary">Enter a search term to find matching nodes.</div>
      <ul id="search-results" class="search-results"></ul>
    </div>
  </div>`
    : "";
  const embeddedPagesHtml = exportFormat === "single-html" && embeddedPages.length
    ? `<section id="single-page-view" class="single-page-view" hidden>
    <div id="single-page-toolbar" class="single-page-toolbar">
      ${singlePageNavigation}
    </div>
    <main id="single-page-body" class="single-page-body"></main>
  </section>
  <div id="embedded-pages-store" hidden>
    ${embeddedPages.map((page) => `<template data-page-id="${escapeAttribute(page.id)}" data-page-title="${escapeAttribute(page.title)}" data-page-kind="${escapeAttribute(page.kind)}">${page.bodyHtml}</template>`).join("\n    ")}
  </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="${EXPORTER_SIGNATURE}">
  <meta name="canvas-html-exporter-build" content="${buildExporterBuildMeta(options.highlightingTheme)}">
  <base href="./">
  <title>${escapeHtml(options.title)}</title>
  <!-- Exported by ${EXPORTER_SIGNATURE} -->
  <style>${buildCanvasStyles({ canvasColorVars, theme, bounds, headingCss, contentInlineStyleCss, calloutCss, singlePageHeadingCss, singlePageInlineStyleCss, previewInlineStyleCss, previewHeadingCss })}  </style>
</head>
<body>
  <div id="canvas-shell">
  <div class="toolbar">
    <button type="button" onclick="zoomBy(1 / 1.15)">Zoom −</button>
    <button type="button" onclick="zoomBy(1.15)">Zoom +</button>
    <button type="button" onclick="resetZoom()">Reset</button>
    ${hasFoldingControls ? `<details id="folding-menu" class="toolbar-menu"><summary>Folding</summary><div class="toolbar-menu-content">
      <button id="folding-mode-button" type="button" onclick="toggleFoldingMode()" aria-pressed="${String(!foldingInitiallyEnabled)}">${foldingInitiallyEnabled ? "No folding" : "Enable folding"}</button>
      <button id="folding-controls-visibility-button" class="folding-action-control" type="button" onclick="toggleFoldingControlsVisibility()" aria-pressed="${String(foldingInitiallyEnabled)}"${foldingInitiallyEnabled ? "" : " hidden"}>Hide folding controls</button>
      <button id="folding-expand-all-button" class="folding-action-control" type="button" onclick="expandAllBranches()"${foldingInitiallyEnabled ? "" : " hidden"}>Expand all</button>
      ${hasRootedBranches ? `<button id="folding-collapse-all-button" class="folding-action-control" type="button" onclick="collapseAllBranches()"${foldingInitiallyEnabled ? "" : " hidden"}>Collapse all</button>` : ""}
      ${hasLevelView ? `<select id="folding-level-select" class="folding-action-control" aria-label="Visible canvas levels" title="Visible canvas levels" onchange="setVisibleLevel(this.value)"${foldingInitiallyEnabled ? "" : " hidden"}><option value="all">All levels</option>${foldingLevelOptions}</select>` : ""}
      <button id="folding-toolbar-button" type="button" onclick="restoreImportedFolding()">Restore folding</button>
      <hr class="folding-menu-separator folding-action-control"${foldingInitiallyEnabled ? "" : " hidden"}>
      <button id="focus-controls-visibility-button" class="folding-action-control" type="button" onclick="toggleFocusControlsVisibility()" aria-pressed="${String(foldingInitiallyEnabled)}"${foldingInitiallyEnabled ? "" : " hidden"}>Hide focus controls</button>
      <button id="folding-focus-exit-button" class="folding-action-control" type="button" onclick="exitBranchFocus()" disabled${foldingInitiallyEnabled ? "" : " hidden"}>Exit focus</button>
    </div></details>` : ""}
    ${showMinimap ? `<button id="minimap-toolbar-button" type="button" onclick="toggleMinimap()">Minimap</button>` : ""}
    ${showSearch ? `<button id="search-toolbar-button" type="button" onclick="openSearch()">Search...</button>` : ""}
    ${contentsHtml ? `<button id="contents-toolbar-button" type="button" onclick="toggleContents()" aria-pressed="false">Navigation</button>` : ""}
  </div>
  <div class="page-header">
    <h1>${escapeHtml(options.title)}</h1>
    <div class="page-header-meta">
      <p>${canvasCountSummary}<span id="hidden-node-summary" hidden></span></p>
      ${canvasHomeLink}
    </div>
  </div>
  <div class="viewport">
    <div id="zoom-area-selection" class="zoom-area-selection" hidden></div>
    <div id="zoom-area-hint" class="zoom-area-hint" role="status" hidden>Release to zoom · Esc to cancel</div>
    <div id="canvas">
      <svg id="edge-layer"></svg>
      ${nodeHtml}
      ${groupTitleHtml}
    </div>
  </div>
  ${minimapHtml}
  ${searchHtml}
  </div>
  ${contentsHtml}
  ${embeddedPagesHtml}
  <script>${buildBrowserRuntime({ exportFormat, options, theme, edgePaletteColors, edgesData, searchEntries, foldingGraph, groupNodeIds, initialFoldState, nodes, foldingInitiallyEnabled, bounds, hasImportedFolding })}  </script>
</body>
</html>`;
}
