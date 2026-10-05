import { buildBrowserEdges } from "./browser-edges";
import { buildBrowserFolding } from "./browser-folding";
import { buildBrowserInteraction } from "./browser-interaction";
import { buildBrowserPages } from "./browser-pages";
import type { BrowserRuntimeParameters } from "./browser-runtime-types";
import { buildBrowserSearch } from "./browser-search";
import { buildBrowserViewport } from "./browser-viewport";
import { serializeScriptData } from "./html";
import { normalizeCssColorValue } from "./theme";



export function buildBrowserRuntime({ exportFormat, options, theme, edgePaletteColors, edgesData, searchEntries, foldingGraph, groupNodeIds, initialFoldState, nodes, foldingInitiallyEnabled, bounds, hasImportedFolding }: BrowserRuntimeParameters): string {
  return `
    (() => {
      const exportFormat = ${serializeScriptData(exportFormat)};
      const baseDocumentTitle = ${serializeScriptData(options.title)};
      const toolbar = document.querySelector(".toolbar");
      const canvasShell = document.getElementById("canvas-shell");
      const edgeLayer = document.getElementById("edge-layer");
      const canvas = document.getElementById("canvas");
      const viewport = document.querySelector(".viewport");
      const zoomAreaSelection = document.getElementById("zoom-area-selection");
      const zoomAreaHint = document.getElementById("zoom-area-hint");
      const singlePageView = document.getElementById("single-page-view");
      const singlePageBody = document.getElementById("single-page-body");
      const singlePageToolbar = document.getElementById("single-page-toolbar");
      const singlePageCanvasLink = document.getElementById("single-page-canvas-link");
      const minimapPanel = document.getElementById("minimap-panel");
      const minimapDragHandle = document.getElementById("minimap-drag-handle");
      const minimapToolbarButton = document.getElementById("minimap-toolbar-button");
      const foldingMenu = document.getElementById("folding-menu");
      const foldingFocusExitButton = document.getElementById("folding-focus-exit-button");
      const foldingModeButton = document.getElementById("folding-mode-button");
      const foldingControlsVisibilityButton = document.getElementById("folding-controls-visibility-button");
      const focusControlsVisibilityButton = document.getElementById("focus-controls-visibility-button");
      const foldingLevelSelect = document.getElementById("folding-level-select");
      const hiddenNodeSummary = document.getElementById("hidden-node-summary");
      const searchToolbarButton = document.getElementById("search-toolbar-button");
      const minimapSvg = document.getElementById("minimap-svg");
      const minimapViewport = document.getElementById("minimap-viewport");
      const searchOverlay = document.getElementById("search-overlay");
      const searchInput = document.getElementById("search-input");
      const searchResults = document.getElementById("search-results");
      const searchSummary = document.getElementById("search-summary");
      const searchCloseButton = document.getElementById("search-close-button");
      const embeddedPageTemplates = Array.from(document.querySelectorAll("#embedded-pages-store template"));
      const edgeColor = ${serializeScriptData(
        normalizeCssColorValue(options.canvasColors?.["0"] || "") || theme.edge,
      )};
      const textColor = ${serializeScriptData(theme.text)};
      const markerBackground = ${serializeScriptData(theme.canvasBackground)};
      const inlineBlobCache = new Map();
      const obsidianColors = ${serializeScriptData(edgePaletteColors)};
      const edges = ${serializeScriptData(edgesData)};
      const searchEntries = ${serializeScriptData(searchEntries)};
      const foldingGraph = ${serializeScriptData(foldingGraph)};
      const groupNodeIds = new Set(${serializeScriptData(groupNodeIds)});
      const connectedGroupNodeIds = new Set(foldingGraph.connectedGroupNodeIds || []);
      const descendantsCache = new Map();
      const importedHiddenNodeIds = new Set(${serializeScriptData(initialFoldState?.hiddenNodeIds ?? [])});
      const importedHiddenEdgeIds = new Set(${serializeScriptData(initialFoldState?.hiddenEdgeIds ?? [])});
      const initialAdvancedCollapsedGroupIds = new Set(${serializeScriptData(
        nodes.filter((node) => node.advancedGroupCollapsed).map((node) => node.id),
      )});
      const advancedCollapsedGroupIds = new Set(initialAdvancedCollapsedGroupIds);
      const collapsedNodeIds = new Set();
      let workingImportedHiddenNodeIds = new Set();
      let hiddenNodeIds = new Set();
      let groupHiddenNodeIds = new Set();
      let hiddenEdgeIds = new Set();
      let focusMutedNodeIds = new Set();
      let importedBaseEnabled = false;
      let importedStateModified = false;
      let foldingControlsEnabled = ${serializeScriptData(foldingInitiallyEnabled)};
      let foldingNodeControlsVisible = true;
      let focusNodeControlsVisible = true;
      let focusedBranchNodeId = null;
      let visibleLevelLimit = null;
      let currentScale = 1;
      let zoomAreaDrag = null;
      let cancelledZoomAreaPointerId = null;
      let suppressNextZoomAreaClick = false;
      let minimapDrag = null;
      let minimapPan = null;
      let highlightedNodeId = null;
      let searchHighlightTimer = null;
      let activeSearchIndex = -1;

${buildBrowserEdges()}${buildBrowserViewport({ bounds })}${buildBrowserSearch()}${buildBrowserPages()}${buildBrowserFolding({ hasImportedFolding })}${buildBrowserInteraction()}      applyImportedFolding(${serializeScriptData(hasImportedFolding)});
      syncLinkOfflineState();
      window.resetZoom();
      window.addEventListener("resize", () => {
        drawEdges();
        window.resetZoom();
        if (minimapPanel) {
          if (minimapPanel.dataset.positionMode === "custom") {
            const rect = minimapPanel.getBoundingClientRect();
            applyMinimapPosition(rect.left, rect.top);
          } else {
            placeMinimapUnderToolbar();
          }
        }
      });
      viewport.addEventListener("scroll", updateMinimapViewport, { passive: true });
      viewport.addEventListener("pointerdown", startZoomAreaSelection, true);
      viewport.addEventListener("dragstart", (event) => {
        if (zoomAreaDrag) event.preventDefault();
      });
      viewport.addEventListener("click", (event) => {
        if (!suppressNextZoomAreaClick) return;
        suppressNextZoomAreaClick = false;
        event.preventDefault();
        event.stopPropagation();
      }, true);
      window.addEventListener("pointermove", moveZoomAreaSelection, { passive: false });
      window.addEventListener("pointerup", finishZoomAreaSelection);
      window.addEventListener("pointercancel", () => {
        cancelledZoomAreaPointerId = null;
        cancelZoomAreaDrag();
      });
      if (minimapDragHandle) {
        minimapDragHandle.addEventListener("pointerdown", startMinimapDrag);
      }
      if (foldingMenu) {
        foldingMenu.addEventListener("mouseleave", () => {
          foldingMenu.removeAttribute("open");
        });
      }
      document.querySelectorAll(".branch-control[data-branch-node-id]").forEach((control) => {
        control.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleBranch(control.getAttribute("data-branch-node-id") || "");
        });
      });
      document.querySelectorAll(".advanced-group-control[data-advanced-group-id]").forEach((control) => {
        control.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          toggleAdvancedGroup(control.getAttribute("data-advanced-group-id") || "");
        });
      });
      document.querySelectorAll(".branch-focus-control[data-focus-node-id]").forEach((control) => {
        control.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          focusBranch(control.getAttribute("data-focus-node-id") || "");
        });
      });
      window.addEventListener("pointermove", moveMinimap, { passive: true });
      window.addEventListener("pointerup", stopMinimapDrag);
      window.addEventListener("pointercancel", stopMinimapDrag);
      if (minimapSvg) {
        minimapSvg.addEventListener("pointerdown", startMinimapPan);
        window.addEventListener("pointermove", moveMinimapPan, { passive: true });
        window.addEventListener("pointerup", stopMinimapPan);
        window.addEventListener("pointercancel", stopMinimapPan);
        minimapSvg.addEventListener("click", jumpViaMinimap);
      }
      if (searchInput) {
        searchInput.addEventListener("input", () => {
          runSearch(searchInput.value);
        });
        searchInput.addEventListener("keydown", (event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            moveActiveSearchResult(1);
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            moveActiveSearchResult(-1);
          } else if (event.key === "Enter") {
            event.preventDefault();
            activateCurrentSearchResult();
          }
        });
      }
      if (searchResults) {
        searchResults.addEventListener("click", (event) => {
          const openLink = event.target instanceof Element ? event.target.closest("[data-search-open]") : null;
          if (openLink) return;
          const target = event.target instanceof Element ? event.target.closest(".search-result") : null;
          if (!target) return;
          const nodeId = target.getAttribute("data-node-id");
          if (!nodeId) return;
          focusNode(nodeId);
          closeSearch();
        });
        searchResults.addEventListener("mousemove", (event) => {
          const target = event.target instanceof Element ? event.target.closest(".search-result") : null;
          if (!target) return;
          const buttons = getSearchButtons();
          const index = buttons.indexOf(target);
          if (index >= 0 && index !== activeSearchIndex) {
            activeSearchIndex = index;
            updateActiveSearchResult();
          }
        });
      }
      if (searchCloseButton) {
        searchCloseButton.addEventListener("click", closeSearch);
      }
      if (searchOverlay) {
        searchOverlay.addEventListener("click", (event) => {
          if (event.target === searchOverlay) {
            closeSearch();
          }
        });
      }
      document.addEventListener("click", (event) => {
        const link = event.target instanceof Element ? event.target.closest("[data-inline-page]") : null;
        if (!link) return;
        const pageId = link.getAttribute("data-inline-page") || "";
        if (!pageId) return;
        event.preventDefault();
        const href = link.getAttribute("href") || ("#page-" + pageId);
        if (window.location.hash === href) {
          syncEmbeddedPageFromHash();
          return;
        }
        window.location.hash = href;
      });
      if (singlePageCanvasLink) {
        singlePageCanvasLink.addEventListener("click", (event) => {
          event.preventDefault();
          if (window.location.hash) {
            window.location.hash = "";
          } else {
            syncEmbeddedPageFromHash();
          }
        });
      }
      if (exportFormat === "single-html") {
        syncEmbeddedPageFromHash();
        window.addEventListener("hashchange", syncEmbeddedPageFromHash);
      }
      window.addEventListener("keydown", (event) => {
        if (trapSearchFocus(event)) return;
        const target = event.target instanceof HTMLElement ? event.target : null;
        const targetTag = target?.tagName || "";
        const isTypingContext = targetTag === "INPUT" || targetTag === "TEXTAREA" || Boolean(target?.isContentEditable);
        if (!isTypingContext && event.key === "/") {
          event.preventDefault();
          openSearch();
          return;
        }
        if (event.key === "Escape" && zoomAreaDrag) {
          event.preventDefault();
          cancelledZoomAreaPointerId = zoomAreaDrag.pointerId;
          cancelZoomAreaDrag();
          return;
        }
        if (event.key === "Escape" && searchOverlay && !searchOverlay.hidden) {
          closeSearch();
        }
      });
      window.addEventListener("online", syncLinkOfflineState);
      window.addEventListener("offline", syncLinkOfflineState);

      materializeInlineAssets(document);

    })();
`;
}
