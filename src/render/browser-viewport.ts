import type { BrowserRuntimeParameters } from "./browser-runtime-types";
import { serializeScriptData } from "./html";
// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserViewport({ bounds }: Pick<BrowserRuntimeParameters, "bounds">): string {
  return `      function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
      }

      function getVisibleCanvasRect() {
        const canvasRect = canvas.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const left = Math.max(viewportRect.left, canvasRect.left);
        const top = Math.max(viewportRect.top, canvasRect.top);
        const right = Math.min(viewportRect.right, canvasRect.right);
        const bottom = Math.min(viewportRect.bottom, canvasRect.bottom);
        return {
          left: Math.max(0, left - canvasRect.left) / currentScale,
          top: Math.max(0, top - canvasRect.top) / currentScale,
          width: Math.max(0, right - left) / currentScale,
          height: Math.max(0, bottom - top) / currentScale,
        };
      }

      function updateMinimapViewport() {
        if (!minimapSvg || !minimapViewport) return;
        const visible = getVisibleCanvasRect();
        minimapViewport.setAttribute("x", String(clamp(visible.left, 0, ${bounds.width})));
        minimapViewport.setAttribute("y", String(clamp(visible.top, 0, ${bounds.height})));
        minimapViewport.setAttribute("width", String(clamp(visible.width, 0, ${bounds.width})));
        minimapViewport.setAttribute("height", String(clamp(visible.height, 0, ${bounds.height})));
      }

      function scrollViewportToCanvasPoint(x, y, behavior) {
        const canvasRect = canvas.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const canvasLeft = canvasRect.left - viewportRect.left + viewport.scrollLeft;
        const canvasTop = canvasRect.top - viewportRect.top + viewport.scrollTop;
        const targetLeft = canvasLeft + x * currentScale - viewport.clientWidth / 2;
        const targetTop = canvasTop + y * currentScale - viewport.clientHeight / 2;
        viewport.scrollTo({
          left: Math.max(0, targetLeft),
          top: Math.max(0, targetTop),
          behavior: behavior || "auto",
        });
        window.requestAnimationFrame(updateMinimapViewport);
      }

      function storePackageViewportState() {
        if (exportFormat !== "package" || !viewport) return;
        packageViewportStates[navigationPageId] = {
          scale: currentScale,
          left: viewport.scrollLeft,
          top: viewport.scrollTop,
        };
        storePackageNavigationState();
      }

      function storePackageViewportBeforeNavigation(event) {
        if (exportFormat !== "package") return;
        const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
        if (!link) return;
        const href = link.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;
        try {
          const url = new URL(href, window.location.href);
          const isLocalHtml = url.protocol === window.location.protocol
            && (url.protocol === "file:" || url.origin === window.location.origin)
            && url.pathname.toLowerCase().endsWith(".html");
          if (isLocalHtml) storePackageViewportState();
        } catch {
          // The normal link handler remains responsible for malformed links.
        }
      }

      function restorePackageViewportState() {
        if (exportFormat !== "package" || !viewport) return false;
        const state = packageViewportStates[navigationPageId];
        if (!state) return false;
        currentScale = clamp(state.scale, 0.2, 4);
        setCssProps(canvas, { transform: "scale(" + currentScale + ")" });
        drawEdges();
        window.requestAnimationFrame(() => {
          viewport.scrollTo({ left: state.left, top: state.top, behavior: "auto" });
          updateMinimapViewport();
        });
        return true;
      }

      function getFitNodeBounds() {
        const activeNodes = Array.from(document.querySelectorAll(".node[data-node-id]"))
          .filter((node) => {
            const nodeId = node.getAttribute("data-node-id") || "";
            return !hiddenNodeIds.has(nodeId)
              && (focusedBranchNodeId === null || (
                !focusMutedNodeIds.has(nodeId)
                && (!groupNodeIds.has(nodeId) || nodeId === focusedBranchNodeId)
              ));
          });
        if (activeNodes.length === 0) {
          return {
            left: 0,
            top: 0,
            width: ${serializeScriptData(bounds.width)},
            height: ${serializeScriptData(bounds.height)},
          };
        }

        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;
        for (const node of activeNodes) {
          const nodeLeft = parseFloat(node.getAttribute("data-canvas-left") || "0");
          const nodeTop = parseFloat(node.getAttribute("data-canvas-top") || "0");
          const nodeWidth = parseFloat(node.getAttribute("data-canvas-width") || "0");
          const nodeHeight = parseFloat(node.getAttribute("data-canvas-height") || "0");
          if (![nodeLeft, nodeTop, nodeWidth, nodeHeight].every(Number.isFinite)) continue;
          left = Math.min(left, nodeLeft);
          top = Math.min(top, nodeTop);
          right = Math.max(right, nodeLeft + nodeWidth);
          bottom = Math.max(bottom, nodeTop + nodeHeight);
        }
        if (![left, top, right, bottom].every(Number.isFinite)) {
          return {
            left: 0,
            top: 0,
            width: ${serializeScriptData(bounds.width)},
            height: ${serializeScriptData(bounds.height)},
          };
        }
        return {
          left,
          top,
          width: Math.max(1, right - left),
          height: Math.max(1, bottom - top),
        };
      }

      function focusNode(nodeId) {
        const target = document.getElementById("node-" + nodeId);
        if (!target) return;
        let expandedContainingGroup = false;
        for (const groupId of [...advancedCollapsedGroupIds]) {
          if ((foldingGraph.groupContentsByNode[groupId] || []).includes(nodeId)) {
            advancedCollapsedGroupIds.delete(groupId);
            expandedContainingGroup = true;
          }
        }
        if (expandedContainingGroup) updateFoldingVisibility();
        if (focusedBranchNodeId !== null && focusMutedNodeIds.has(nodeId)) {
          focusedBranchNodeId = null;
          updateFoldingVisibility();
        }
        if (hiddenNodeIds.has(nodeId)) {
          if (focusedBranchNodeId !== null) {
            focusedBranchNodeId = null;
            updateFoldingVisibility();
          }
          if (hiddenNodeIds.has(nodeId)) expandAllBranches();
        }
        const left = parseFloat(target.getAttribute("data-canvas-left") || "0");
        const top = parseFloat(target.getAttribute("data-canvas-top") || "0");
        const width = parseFloat(target.getAttribute("data-canvas-width") || "0");
        const height = parseFloat(target.getAttribute("data-canvas-height") || "0");
        scrollViewportToCanvasPoint(left + width / 2, top + height / 2, "smooth");
        if (highlightedNodeId) {
          const prev = document.getElementById("node-" + highlightedNodeId);
          if (prev) prev.classList.remove("search-hit");
        }
        // Force a style flush so selecting the same result restarts the pulse.
        target.getBoundingClientRect();
        target.classList.add("search-hit");
        highlightedNodeId = nodeId;
        if (searchHighlightTimer) {
          window.clearTimeout(searchHighlightTimer);
        }
        searchHighlightTimer = window.setTimeout(() => {
          target.classList.remove("search-hit");
          if (highlightedNodeId === nodeId) {
            highlightedNodeId = null;
          }
        }, 2200);
      }

`;
}
