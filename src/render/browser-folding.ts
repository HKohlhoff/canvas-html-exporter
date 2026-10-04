import type { BrowserRuntimeParameters } from "./browser-runtime-types";
import { serializeScriptData } from "./html";
// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserFolding({ hasImportedFolding }: Pick<BrowserRuntimeParameters, "hasImportedFolding">): string {
  return `      function applyImportedFolding(applied) {
        collapsedNodeIds.clear();
        advancedCollapsedGroupIds.clear();
        initialAdvancedCollapsedGroupIds.forEach((groupId) => advancedCollapsedGroupIds.add(groupId));
        focusedBranchNodeId = null;
        visibleLevelLimit = null;
        importedBaseEnabled = Boolean(applied) && (
          importedHiddenNodeIds.size > 0 || importedHiddenEdgeIds.size > 0
        );
        workingImportedHiddenNodeIds = importedBaseEnabled
          ? new Set(importedHiddenNodeIds)
          : new Set();
        importedStateModified = !importedBaseEnabled;
        syncFoldingLevelSelect();
        updateFoldingVisibility();
      }

      function syncFoldingLevelSelect() {
        if (!foldingLevelSelect) return;
        foldingLevelSelect.value = visibleLevelLimit === null
          ? "all"
          : String(visibleLevelLimit);
      }

      function clearImportedFoldingBase() {
        importedBaseEnabled = false;
        importedStateModified = true;
        workingImportedHiddenNodeIds = new Set();
      }

      function getDescendants(nodeId) {
        if (descendantsCache.has(nodeId)) return descendantsCache.get(nodeId);
        const visited = new Set([nodeId]);
        const pending = [...(foldingGraph.childrenByNode[nodeId] || [])].reverse();
        while (pending.length > 0) {
          const current = pending.pop();
          if (!current || visited.has(current)) continue;
          visited.add(current);
          const children = foldingGraph.childrenByNode[current] || [];
          for (let index = children.length - 1; index >= 0; index -= 1) {
            pending.push(children[index]);
          }
        }
        visited.delete(nodeId);
        const descendants = [...visited].sort();
        descendantsCache.set(nodeId, descendants);
        return descendants;
      }

      function getFocusedNodeIds(nodeId) {
        const directedFocusNodeIds = new Set([nodeId, ...getDescendants(nodeId)]);
        const focusedNodeIds = new Set(directedFocusNodeIds);
        for (const groupId of directedFocusNodeIds) {
          for (const containedNodeId of foldingGraph.groupContentsByNode[groupId] || []) {
            focusedNodeIds.add(containedNodeId);
          }
        }
        for (const [groupId, memberIds] of Object.entries(foldingGraph.groupMembersByNode)) {
          if (memberIds.some((memberId) => focusedNodeIds.has(memberId))) {
            focusedNodeIds.add(groupId);
          }
        }
        return focusedNodeIds;
      }

      function deriveCollapsedVisibility(baseHiddenNodeIds) {
        const dynamicHiddenNodeIds = new Set();
        for (const nodeId of [...collapsedNodeIds].sort()) {
          for (const descendantId of getDescendants(nodeId)) {
            dynamicHiddenNodeIds.add(descendantId);
          }
        }

        let revealedAny = true;
        while (revealedAny) {
          revealedAny = false;
          for (const nodeId of [...dynamicHiddenNodeIds].sort()) {
            const parents = foldingGraph.parentsByNode[nodeId] || [];
            const hasVisibleAlternativeParent = parents.some((parentId) => (
              !baseHiddenNodeIds.has(parentId)
              && !dynamicHiddenNodeIds.has(parentId)
              && !collapsedNodeIds.has(parentId)
            ));
            if (hasVisibleAlternativeParent) {
              dynamicHiddenNodeIds.delete(nodeId);
              revealedAny = true;
            }
          }
        }

        return dynamicHiddenNodeIds;
      }

      function getNodeIdsHiddenByGroups(sourceHiddenNodeIds) {
        const pendingGroupIds = Object.keys(foldingGraph.groupContentsByNode || {})
          .filter((groupId) => sourceHiddenNodeIds.has(groupId))
          .sort();
        const processedGroupIds = new Set();
        const hiddenByGroups = new Set();
        for (let index = 0; index < pendingGroupIds.length; index += 1) {
          const groupId = pendingGroupIds[index];
          if (!groupId || processedGroupIds.has(groupId)) continue;
          processedGroupIds.add(groupId);
          for (const nodeId of foldingGraph.groupContentsByNode[groupId] || []) {
            hiddenByGroups.add(nodeId);
            if (
              Object.prototype.hasOwnProperty.call(foldingGraph.groupContentsByNode, nodeId)
              && !processedGroupIds.has(nodeId)
            ) {
              pendingGroupIds.push(nodeId);
            }
          }
        }
        return hiddenByGroups;
      }

      function getAdvancedGroupHiddenNodeIds() {
        const hiddenByAdvancedGroups = new Set();
        for (const groupId of [...advancedCollapsedGroupIds].sort()) {
          for (const nodeId of foldingGraph.groupContentsByNode[groupId] || []) {
            hiddenByAdvancedGroups.add(nodeId);
          }
        }
        return hiddenByAdvancedGroups;
      }

      function getExpandedGroupGeometry(node) {
        if (!node.dataset.expandedCanvasLeft) {
          node.dataset.expandedCanvasLeft = node.getAttribute("data-canvas-left") || "0";
          node.dataset.expandedCanvasTop = node.getAttribute("data-canvas-top") || "0";
          node.dataset.expandedCanvasWidth = node.getAttribute("data-canvas-width") || "1";
          node.dataset.expandedCanvasHeight = node.getAttribute("data-canvas-height") || "1";
        }
        return {
          left: node.dataset.expandedCanvasLeft,
          top: node.dataset.expandedCanvasTop,
          width: node.dataset.expandedCanvasWidth,
          height: node.dataset.expandedCanvasHeight,
        };
      }

      function setGroupGeometry(node, geometry) {
        node.setAttribute("data-canvas-left", geometry.left);
        node.setAttribute("data-canvas-top", geometry.top);
        node.setAttribute("data-canvas-width", geometry.width);
        node.setAttribute("data-canvas-height", geometry.height);
        node.style.left = geometry.left + "px";
        node.style.top = geometry.top + "px";
        node.style.width = geometry.width + "px";
        node.style.height = geometry.height + "px";
      }

      function syncAdvancedGroupGeometry() {
        if (!canvas) return;
        const canvasRect = canvas.getBoundingClientRect();
        const scale = Math.max(currentScale, 0.0001);
        document.querySelectorAll(".node.group[data-node-id]").forEach((node) => {
          const expandedGeometry = getExpandedGroupGeometry(node);
          const groupId = node.getAttribute("data-node-id") || "";
          if (!advancedCollapsedGroupIds.has(groupId) || hiddenNodeIds.has(groupId)) {
            setGroupGeometry(node, expandedGeometry);
            return;
          }
          const title = document.getElementById("group-title-" + groupId);
          if (!title || title.hidden || title.classList.contains("is-folding-hidden")) {
            setGroupGeometry(node, expandedGeometry);
            return;
          }
          const titleRect = title.getBoundingClientRect();
          setGroupGeometry(node, {
            left: String((titleRect.left - canvasRect.left) / scale),
            top: String((titleRect.top - canvasRect.top) / scale),
            width: String(Math.max(1, titleRect.width / scale)),
            height: String(Math.max(1, titleRect.height / scale)),
          });
        });
      }

      function getItemCounts(itemIds) {
        const uniqueItemIds = new Set(itemIds);
        const groupCount = [...uniqueItemIds]
          .filter((itemId) => groupNodeIds.has(itemId)).length;
        return {
          groupCount,
          itemCount: uniqueItemIds.size,
          nodeCount: uniqueItemIds.size - groupCount,
        };
      }

      function getHiddenBranchItemCounts(nodeId, sourceHiddenNodeIds) {
        const hiddenDescendantIds = getDescendants(nodeId)
          .filter((descendantId) => sourceHiddenNodeIds.has(descendantId));
        const hiddenItemIds = new Set(hiddenDescendantIds);
        for (const descendantId of hiddenDescendantIds) {
          if (!groupNodeIds.has(descendantId)) continue;
          for (const containedNodeId of foldingGraph.groupContentsByNode[descendantId] || []) {
            hiddenItemIds.add(containedNodeId);
          }
        }
        return getItemCounts(hiddenItemIds);
      }

      function formatHiddenItemCounts(counts) {
        const parts = [];
        if (counts.nodeCount > 0) {
          parts.push(counts.nodeCount + (counts.nodeCount === 1 ? " hidden node" : " hidden nodes"));
        }
        if (counts.groupCount > 0) {
          parts.push(counts.groupCount + (counts.groupCount === 1 ? " hidden group" : " hidden groups"));
        }
        return parts.join(" and ");
      }

      function updateFoldingVisibility() {
        const exactImportedState = importedBaseEnabled
          && !importedStateModified
          && collapsedNodeIds.size === 0
          && visibleLevelLimit === null;
        const baseHiddenNodeIds = importedBaseEnabled
          ? new Set(workingImportedHiddenNodeIds)
          : new Set();
        if (visibleLevelLimit !== null) {
          for (const [nodeId, level] of Object.entries(foldingGraph.levelByNode)) {
            if (level > visibleLevelLimit) baseHiddenNodeIds.add(nodeId);
          }
        }
        hiddenNodeIds = new Set(baseHiddenNodeIds);
        for (const nodeId of deriveCollapsedVisibility(baseHiddenNodeIds)) {
          hiddenNodeIds.add(nodeId);
        }
        groupHiddenNodeIds = getNodeIdsHiddenByGroups(hiddenNodeIds);

        if (!exactImportedState) {
          for (const nodeId of groupHiddenNodeIds) hiddenNodeIds.add(nodeId);
          for (const [groupId, memberIds] of Object.entries(foldingGraph.groupMembersByNode)) {
            if (
              !connectedGroupNodeIds.has(groupId)
              && memberIds.length > 0
              && memberIds.every((memberId) => hiddenNodeIds.has(memberId))
            ) {
              hiddenNodeIds.add(groupId);
            }
          }
        }

        const advancedGroupHiddenNodeIds = getAdvancedGroupHiddenNodeIds();
        for (const nodeId of advancedGroupHiddenNodeIds) hiddenNodeIds.add(nodeId);

        focusMutedNodeIds = new Set();
        if (focusedBranchNodeId !== null) {
          const focusedNodeIds = getFocusedNodeIds(focusedBranchNodeId);
          for (const nodeId of Object.keys(foldingGraph.childrenByNode)) {
            if (!focusedNodeIds.has(nodeId)) focusMutedNodeIds.add(nodeId);
          }
        }

        if (exactImportedState) {
          hiddenEdgeIds = new Set(importedHiddenEdgeIds);
        } else {
          hiddenEdgeIds = new Set();
          for (const edge of edges) {
            if (!edge.id) continue;
            if (
              collapsedNodeIds.has(edge.fromId)
              || hiddenNodeIds.has(edge.fromId)
              || hiddenNodeIds.has(edge.toId)
            ) {
              hiddenEdgeIds.add(edge.id);
            }
          }
        }
        for (const edge of edges) {
          if (
            edge.id
            && (advancedGroupHiddenNodeIds.has(edge.fromId) || advancedGroupHiddenNodeIds.has(edge.toId))
          ) {
            hiddenEdgeIds.add(edge.id);
          }
        }

        document.querySelectorAll(".node[data-node-id]").forEach((node) => {
          const nodeId = node.getAttribute("data-node-id") || "";
          node.classList.toggle("is-folding-hidden", hiddenNodeIds.has(nodeId));
          node.classList.toggle("is-focus-muted", focusMutedNodeIds.has(nodeId));
          node.classList.toggle(
            "is-advanced-group-collapsed",
            groupNodeIds.has(nodeId) && advancedCollapsedGroupIds.has(nodeId),
          );
        });
        document.querySelectorAll(".group-title[data-group-title-node-id]").forEach((title) => {
          const nodeId = title.getAttribute("data-group-title-node-id") || "";
          title.classList.toggle("is-folding-hidden", hiddenNodeIds.has(nodeId));
          title.classList.toggle("is-focus-muted", focusMutedNodeIds.has(nodeId));
        });
        document.querySelectorAll(".branch-control[data-branch-node-id]").forEach((control) => {
          const nodeId = control.getAttribute("data-branch-node-id") || "";
          const descendants = getDescendants(nodeId);
          const descendantCount = descendants.length;
          const disabledByHiddenGroup = descendantCount > 0
            && descendants.every((descendantId) => groupHiddenNodeIds.has(descendantId));
          const hasHiddenDescendant = descendants.some((descendantId) => hiddenNodeIds.has(descendantId));
          const hiddenItemCounts = getHiddenBranchItemCounts(nodeId, hiddenNodeIds);
          const ownHiddenItemCounts = collapsedNodeIds.has(nodeId)
            ? getHiddenBranchItemCounts(nodeId, new Set(descendants))
            : getItemCounts([]);
          const hiddenConnectionCount = getHiddenBranchConnectionCount(nodeId, descendants);
          const hasHiddenBranch = collapsedNodeIds.has(nodeId)
            || hasHiddenDescendant
            || hiddenConnectionCount > 0;
          const displayedHiddenBranch = disabledByHiddenGroup
            ? collapsedNodeIds.has(nodeId)
            : hasHiddenBranch;
          const displayedHiddenItemCounts = disabledByHiddenGroup
            ? ownHiddenItemCounts
            : hiddenItemCounts;
          control.hidden = !foldingControlsEnabled || !foldingNodeControlsVisible;
          control.disabled = disabledByHiddenGroup;
          control.textContent = displayedHiddenBranch && displayedHiddenItemCounts.itemCount > 0
            ? String(displayedHiddenItemCounts.itemCount)
            : displayedHiddenBranch ? "+" : "−";
          control.classList.toggle(
            "has-hidden-count",
            displayedHiddenBranch && displayedHiddenItemCounts.itemCount > 0,
          );
          control.setAttribute("aria-expanded", String(!displayedHiddenBranch));
          const branchControlLabel = disabledByHiddenGroup
            ? "Branch hidden by folded group"
            : (hasHiddenBranch ? "Expand branch" : "Collapse branch")
            + " · "
            + (hasHiddenBranch && hiddenItemCounts.itemCount > 0
              ? formatHiddenItemCounts(hiddenItemCounts)
              : hasHiddenBranch && hiddenConnectionCount > 0
                ? hiddenConnectionCount + (hiddenConnectionCount === 1 ? " hidden connection" : " hidden connections")
              : descendantCount + (descendantCount === 1 ? " descendant" : " descendants"));
          control.setAttribute("aria-label", branchControlLabel);
          control.setAttribute("title", branchControlLabel);
        });
        document.querySelectorAll(".advanced-group-control[data-advanced-group-id]").forEach((control) => {
          const groupId = control.getAttribute("data-advanced-group-id") || "";
          const containedItemIds = foldingGraph.groupContentsByNode[groupId] || [];
          const counts = getItemCounts(containedItemIds);
          const isCollapsed = advancedCollapsedGroupIds.has(groupId);
          control.textContent = isCollapsed
            ? counts.itemCount > 0 ? String(counts.itemCount) : "+"
            : "−";
          control.classList.toggle("has-hidden-count", isCollapsed && counts.itemCount > 0);
          control.setAttribute("aria-expanded", String(!isCollapsed));
          const countParts = [];
          if (counts.nodeCount > 0) {
            countParts.push(counts.nodeCount + (counts.nodeCount === 1 ? " contained node" : " contained nodes"));
          }
          if (counts.groupCount > 0) {
            countParts.push(counts.groupCount + (counts.groupCount === 1 ? " contained group" : " contained groups"));
          }
          const label = (isCollapsed ? "Expand group" : "Collapse group")
            + (countParts.length > 0 ? " · " + countParts.join(" and ") : "");
          control.setAttribute("aria-label", label);
          control.setAttribute("title", label);
        });
        document.querySelectorAll(".branch-focus-control[data-focus-node-id]").forEach((control) => {
          const nodeId = control.getAttribute("data-focus-node-id") || "";
          const isFocused = nodeId === focusedBranchNodeId;
          const descendantCount = getDescendants(nodeId).length;
          const focusTarget = groupNodeIds.has(nodeId) ? "group" : "node";
          control.hidden = !foldingControlsEnabled
            || !focusNodeControlsVisible
            || collapsedNodeIds.has(nodeId);
          control.classList.toggle("is-active", isFocused);
          control.setAttribute("aria-pressed", String(isFocused));
          control.setAttribute(
            "aria-label",
            isFocused ? "Exit focus" : descendantCount > 0 ? "Focus branch" : "Focus " + focusTarget,
          );
          control.setAttribute(
            "title",
            isFocused
              ? "Exit focus"
              : descendantCount > 0
                ? "Focus branch · " + descendantCount + " descendants"
                : "Focus " + focusTarget,
          );
        });
        document.querySelectorAll(".minimap-node[data-node-id]").forEach((node) => {
          const nodeId = node.getAttribute("data-node-id") || "";
          node.classList.toggle("is-folding-hidden", hiddenNodeIds.has(nodeId));
          node.classList.toggle("is-focus-muted", focusMutedNodeIds.has(nodeId));
        });

        document.querySelectorAll(".folding-action-control").forEach((control) => {
          control.hidden = !foldingControlsEnabled;
        });
        if (foldingModeButton) {
          foldingModeButton.textContent = foldingControlsEnabled
            ? "No folding"
            : "Enable folding";
          foldingModeButton.classList.toggle("is-active", !foldingControlsEnabled);
          foldingModeButton.setAttribute("aria-pressed", String(!foldingControlsEnabled));
        }
        if (foldingControlsVisibilityButton) {
          foldingControlsVisibilityButton.textContent = foldingNodeControlsVisible
            ? "Hide folding controls"
            : "Show folding controls";
          foldingControlsVisibilityButton.setAttribute("aria-pressed", String(foldingNodeControlsVisible));
        }
        if (focusControlsVisibilityButton) {
          focusControlsVisibilityButton.textContent = focusNodeControlsVisible
            ? "Hide focus controls"
            : "Show focus controls";
          focusControlsVisibilityButton.setAttribute("aria-pressed", String(focusNodeControlsVisible));
        }
        if (foldingFocusExitButton) {
          foldingFocusExitButton.disabled = focusedBranchNodeId === null;
        }
        if (hiddenNodeSummary) {
          const hiddenGroupCount = [...hiddenNodeIds]
            .filter((nodeId) => groupNodeIds.has(nodeId)).length;
          const hiddenNodeCount = hiddenNodeIds.size - hiddenGroupCount;
          const hiddenParts = [];
          if (hiddenNodeCount > 0) {
            hiddenParts.push(hiddenNodeCount === 1
              ? "1 hidden node"
              : hiddenNodeCount + " hidden nodes");
          }
          if (hiddenGroupCount > 0) {
            hiddenParts.push(hiddenGroupCount === 1
              ? "1 hidden group"
              : hiddenGroupCount + " hidden groups");
          }
          hiddenNodeSummary.hidden = hiddenParts.length === 0;
          hiddenNodeSummary.textContent = hiddenParts.length > 0
            ? " · " + hiddenParts.join(" · ")
            : "";
        }
        drawEdges();
        updateMinimapViewport();
      }

      function branchHasHiddenContent(nodeId, descendants) {
        if (collapsedNodeIds.has(nodeId)) return true;
        if (descendants.some((descendantId) => hiddenNodeIds.has(descendantId))) return true;
        return getHiddenBranchConnectionCount(nodeId, descendants) > 0;
      }

      function getHiddenBranchConnectionCount(nodeId, descendants) {
        const branchSources = new Set([nodeId, ...descendants]);
        const branchTargets = new Set(descendants);
        return edges.filter((edge) => (
          hiddenEdgeIds.has(edge.id)
          && branchSources.has(edge.fromId)
          && branchTargets.has(edge.toId)
        )).length;
      }

      function toggleBranch(nodeId) {
        const descendants = getDescendants(nodeId);
        if (descendants.length === 0) return;
        if (descendants.every((descendantId) => groupHiddenNodeIds.has(descendantId))) return;
        const hasHiddenBranch = branchHasHiddenContent(nodeId, descendants);
        visibleLevelLimit = null;
        syncFoldingLevelSelect();
        if (hasHiddenBranch) {
          collapsedNodeIds.delete(nodeId);
          descendants.forEach((descendantId) => collapsedNodeIds.delete(descendantId));
          descendants.forEach((descendantId) => workingImportedHiddenNodeIds.delete(descendantId));
        } else {
          collapsedNodeIds.add(nodeId);
        }
        if (importedBaseEnabled) importedStateModified = true;
        updateFoldingVisibility();
      }

      function toggleAdvancedGroup(groupId) {
        if (!groupId || !Object.prototype.hasOwnProperty.call(foldingGraph.groupContentsByNode, groupId)) return;
        if (advancedCollapsedGroupIds.has(groupId)) {
          advancedCollapsedGroupIds.delete(groupId);
        } else {
          advancedCollapsedGroupIds.add(groupId);
          if (
            focusedBranchNodeId !== null
            && (foldingGraph.groupContentsByNode[groupId] || []).includes(focusedBranchNodeId)
          ) {
            focusedBranchNodeId = null;
          }
        }
        updateFoldingVisibility();
      }

      window.toggleAdvancedGroup = toggleAdvancedGroup;

      window.expandAllBranches = function() {
        clearImportedFoldingBase();
        collapsedNodeIds.clear();
        advancedCollapsedGroupIds.clear();
        focusedBranchNodeId = null;
        visibleLevelLimit = null;
        syncFoldingLevelSelect();
        updateFoldingVisibility();
      };

      window.collapseAllBranches = function() {
        clearImportedFoldingBase();
        collapsedNodeIds.clear();
        focusedBranchNodeId = null;
        visibleLevelLimit = null;
        for (const nodeId of foldingGraph.rootNodeIds) {
          if (getDescendants(nodeId).length > 0) collapsedNodeIds.add(nodeId);
        }
        syncFoldingLevelSelect();
        updateFoldingVisibility();
      };

      window.setVisibleLevel = function(value) {
        clearImportedFoldingBase();
        collapsedNodeIds.clear();
        focusedBranchNodeId = null;
        const parsedLevel = Number(value);
        visibleLevelLimit = value === "all" || !Number.isFinite(parsedLevel)
          ? null
          : Math.max(0, Math.min(foldingGraph.maxLevel, Math.floor(parsedLevel)));
        syncFoldingLevelSelect();
        updateFoldingVisibility();
      };

      window.restoreImportedFolding = function() {
        foldingControlsEnabled = true;
        applyImportedFolding(${serializeScriptData(hasImportedFolding)});
      };

      function focusBranch(nodeId) {
        if (!nodeId || !Object.prototype.hasOwnProperty.call(foldingGraph.childrenByNode, nodeId)) return;
        focusedBranchNodeId = focusedBranchNodeId === nodeId ? null : nodeId;
        updateFoldingVisibility();
      }

      window.focusBranch = focusBranch;

      window.exitBranchFocus = function() {
        focusedBranchNodeId = null;
        updateFoldingVisibility();
      };

      window.toggleFoldingControlsVisibility = function() {
        if (!foldingControlsEnabled) return;
        foldingNodeControlsVisible = !foldingNodeControlsVisible;
        updateFoldingVisibility();
      };

      window.toggleFocusControlsVisibility = function() {
        if (!foldingControlsEnabled) return;
        focusNodeControlsVisible = !focusNodeControlsVisible;
        updateFoldingVisibility();
      };

      window.toggleFoldingMode = function() {
        foldingControlsEnabled = !foldingControlsEnabled;
        if (!foldingControlsEnabled) {
          clearImportedFoldingBase();
          collapsedNodeIds.clear();
          focusedBranchNodeId = null;
          visibleLevelLimit = null;
          syncFoldingLevelSelect();
        }
        updateFoldingVisibility();
      };

`;
}
