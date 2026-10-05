// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserPages(): string {
  return `      function mapClientPointToMinimap(event) {
        if (!minimapSvg) return;
        const point = minimapSvg.createSVGPoint();
        point.x = event.clientX;
        point.y = event.clientY;
        return point.matrixTransform(minimapSvg.getScreenCTM().inverse());
      }

      function syncViewportFromMinimap(event, behavior) {
        if (!minimapSvg || minimapDrag) return;
        const transformed = mapClientPointToMinimap(event);
        if (!transformed) return;
        scrollViewportToCanvasPoint(transformed.x, transformed.y, behavior || "auto");
      }

      function jumpViaMinimap(event) {
        if (minimapPan || minimapDrag) return;
        syncViewportFromMinimap(event, "smooth");
      }

      function startMinimapPan(event) {
        if (!minimapSvg || minimapDrag) return;
        minimapPan = { pointerId: event.pointerId };
        minimapSvg.setPointerCapture(event.pointerId);
        syncViewportFromMinimap(event, "auto");
        event.preventDefault();
      }

      function moveMinimapPan(event) {
        if (!minimapPan || !minimapSvg) return;
        syncViewportFromMinimap(event, "auto");
      }

      function stopMinimapPan(event) {
        if (!minimapPan || !minimapSvg) return;
        const activePointerId = minimapPan.pointerId;
        minimapPan = null;
        if (typeof activePointerId === "number") {
          minimapSvg.releasePointerCapture(activePointerId);
        }
      }

      function clampMinimapPosition(left, top) {
        if (!minimapPanel) return { left, top };
        const panelWidth = minimapPanel.offsetWidth;
        const panelHeight = minimapPanel.offsetHeight;
        const maxLeft = Math.max(0, window.innerWidth - panelWidth - 8);
        const maxTop = Math.max(0, window.innerHeight - panelHeight - 8);
        return {
          left: clamp(left, 8, maxLeft),
          top: clamp(top, 8, maxTop),
        };
      }

      function applyMinimapPosition(left, top) {
        if (!minimapPanel) return;
        const next = clampMinimapPosition(left, top);
        setCssProps(minimapPanel, {
          left: next.left + "px",
          top: next.top + "px",
          right: "auto",
          bottom: "auto",
        });
      }

      function placeMinimapUnderToolbar() {
        if (!minimapPanel) return;
        const toolbarRect = toolbar ? toolbar.getBoundingClientRect() : null;
        const panelWidth = minimapPanel.offsetWidth || 240;
        const top = (toolbarRect ? toolbarRect.bottom : 48) + 8;
        const left = window.innerWidth - panelWidth - 24;
        applyMinimapPosition(left, top);
      }

      function parsePageHash(hash) {
        const value = decodeHashComponent(String(hash || "").replace(/^#/, ""));
        const [pageRef] = value.split(/[?#]/);
        if (!pageRef || !pageRef.startsWith("page-")) return "";
        return pageRef.slice("page-".length);
      }

      function parseInlinePageIdFromHref(href) {
        const value = decodeHashComponent(String(href || "").replace(/^#page-/, ""));
        return value.split(/[?#]/)[0];
      }

      function decodeHashComponent(value) {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }

      function parsePageAnchorHash(hash) {
        const value = decodeHashComponent(String(hash || "").replace(/^#/, ""));
        if (!value.startsWith("page-")) return "";
        const queryIndex = value.indexOf("?");
        const anchorIndex = value.indexOf("#");
        let startIndex = -1;
        if (anchorIndex >= 0 && (queryIndex < 0 || anchorIndex < queryIndex)) {
          startIndex = anchorIndex + 1;
        } else if (queryIndex >= 0) {
          const params = new URLSearchParams(value.slice(queryIndex + 1));
          const anchor = String(params.get("anchor") || "").trim();
          return anchor ? decodeHashComponent(anchor) : "";
        }
        return startIndex >= 0 ? decodeHashComponent(value.slice(startIndex).split("?")[0]) : "";
      }

      function parsePageSearchQuery(hash) {
        const value = String(hash || "").replace(/^#/, "");
        const queryIndex = value.indexOf("?");
        if (queryIndex >= 0) {
          const params = new URLSearchParams(value.slice(queryIndex + 1));
          const hashQuery = String(params.get("q") || "").trim();
          if (hashQuery) return hashQuery;
        }
        const searchParams = new URLSearchParams(window.location.search);
        return String(searchParams.get("q") || "").trim();
      }

      function parsePageNodeId(hash) {
        const value = String(hash || "").replace(/^#/, "");
        const queryIndex = value.indexOf("?");
        if (queryIndex >= 0) {
          const params = new URLSearchParams(value.slice(queryIndex + 1));
          const hashNodeId = String(params.get("node") || "").trim();
          if (hashNodeId) return hashNodeId;
        }
        const searchParams = new URLSearchParams(window.location.search);
        return String(searchParams.get("node") || "").trim();
      }

      function parseNestedPageHref(hash) {
        const value = String(hash || "").replace(/^#/, "");
        const queryIndex = value.indexOf("?");
        if (queryIndex < 0) return "";
        const params = new URLSearchParams(value.slice(queryIndex + 1));
        const pageHref = String(params.get("page") || "").trim();
        return parsePageHash(pageHref) ? pageHref : "";
      }

      function renderCanvasShell() {
        if (!canvasShell || !singlePageView) return;
        singlePageView.classList.remove("is-canvas-page");
        delete singlePageView.dataset.pageKind;
        canvasShell.hidden = false;
        singlePageView.hidden = true;
        syncContentsCurrentPage("");
        restoreContentsForCanvasView();
        document.title = baseDocumentTitle;
      }

      function syncContentsCurrentPage(pageId) {
        if (!contentsPanel) return;
        const contentsLinks = Array.from(contentsPanel.querySelectorAll(".contents-link"));
        contentsLinks.forEach((link) => {
          link.classList.remove("is-current");
          link.removeAttribute("aria-current");
        });
        const pageLink = pageId
          ? contentsLinks.find((link) => link.getAttribute("data-inline-page") === pageId)
          : null;
        const currentCanvasLink = contentsPanel.querySelector('[data-contents-current-canvas="true"]');
        const activeLink = pageLink || currentCanvasLink;
        if (!activeLink) return;
        activeLink.classList.add("is-current");
        activeLink.setAttribute("aria-current", "page");
      }

      function clearSearchHighlights(root) {
        if (!root) return;
        root.querySelectorAll("mark.search-highlight").forEach((mark) => {
          const parent = mark.parentNode;
          if (!parent) return;
          parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
          parent.normalize();
        });
      }

      function applySearchHighlights(root, query) {
        if (!root) return;
        clearSearchHighlights(root);
        const normalized = String(query || "").trim();
        if (!normalized) return;
        const pattern = new RegExp(normalized.replace(/[.*+?^()|[\\]{}$\\\\]/g, "\\\\$&"), "ig");
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode(node) {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            if (["SCRIPT", "STYLE", "MARK"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
            if (!node.nodeValue || !pattern.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
            pattern.lastIndex = 0;
            return NodeFilter.FILTER_ACCEPT;
          },
        });
        const textNodes = [];
        let current = walker.nextNode();
        while (current) {
          textNodes.push(current);
          current = walker.nextNode();
        }
        for (const textNode of textNodes) {
          const text = textNode.nodeValue || "";
          pattern.lastIndex = 0;
          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let match = pattern.exec(text);
          while (match) {
            const index = match.index || 0;
            if (index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.slice(lastIndex, index)));
            }
            const mark = document.createElement("mark");
            mark.className = "search-highlight";
            mark.textContent = match[0];
            fragment.appendChild(mark);
            lastIndex = index + match[0].length;
            match = pattern.exec(text);
          }
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
          }
          textNode.parentNode?.replaceChild(fragment, textNode);
        }
      }

      function revealPageAnchor(anchor) {
        if (!anchor) return;
        if (!singlePageBody) return;
        singlePageBody.querySelectorAll(".target-highlight").forEach((item) => item.classList.remove("target-highlight"));
        const escapedAnchor = typeof CSS !== "undefined" && CSS.escape
          ? CSS.escape(anchor)
          : String(anchor).replace(/["\\\\]/g, "\\\\$&");
        const target = singlePageBody.querySelector('[id="' + escapedAnchor + '"]');
        if (!target) return;
        const highlightTarget = target.closest("details.heading-section") || target;
        highlightTarget.classList.add("target-highlight");
        let parent = target.parentElement;
        while (parent) {
          if (parent.tagName === "DETAILS") parent.open = true;
          parent = parent.parentElement;
        }
        target.scrollIntoView({ block: "start", behavior: "auto" });
      }

      function renderEmbeddedPage(pageId) {
        if (exportFormat !== "single-html" || !canvasShell || !singlePageView || !singlePageBody) {
          return false;
        }
        const template = embeddedPageTemplates.find((item) => item.dataset.pageId === pageId);
        if (!template) return false;
        clearChildren(singlePageBody);
        singlePageBody.appendChild(template.content.cloneNode(true));
        if (singlePageToolbar) {
          singlePageToolbar.hidden = template.dataset.pageKind === "canvas";
        }
        singlePageView.dataset.pageKind = template.dataset.pageKind || "";
        singlePageView.classList.toggle("is-canvas-page", template.dataset.pageKind === "canvas");
        materializeInlineAssets(singlePageBody);
        applySearchHighlights(singlePageBody, parsePageSearchQuery(window.location.hash));
        canvasShell.hidden = true;
        singlePageView.hidden = false;
        if (template.dataset.pageKind === "canvas") {
          hideContentsForEmbeddedCanvas();
          const frame = singlePageBody.querySelector(".single-canvas-frame");
          if (frame) {
            frame.addEventListener("load", () => sendNavigationStateToCanvasFrame(frame), { once: true });
            window.setTimeout(() => sendNavigationStateToCanvasFrame(frame), 0);
          }
        } else {
          syncContentsCurrentPage(pageId);
          restoreContentsForCanvasView();
        }
        document.title = (template.dataset.pageTitle || "Page") + " - " + baseDocumentTitle;
        window.scrollTo({ top: 0, behavior: "auto" });
        const anchor = parsePageAnchorHash(window.location.hash);
        if (anchor) {
          window.setTimeout(() => revealPageAnchor(anchor), 0);
        }
        return true;
      }

      function dataUrlToBlobUrl(dataUrl) {
        if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
          return dataUrl;
        }
        if (inlineBlobCache.has(dataUrl)) {
          return inlineBlobCache.get(dataUrl);
        }
        const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
        if (!match) {
          return dataUrl;
        }
        const mimeType = match[1] || "application/octet-stream";
        const isBase64 = Boolean(match[2]);
        const payload = match[3] || "";
        let blobUrl = dataUrl;
        try {
          let bytes;
          if (isBase64) {
            const binary = atob(payload);
            bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i += 1) {
              bytes[i] = binary.charCodeAt(i);
            }
          } else {
            const decoded = decodeURIComponent(payload);
            bytes = new TextEncoder().encode(decoded);
          }
          blobUrl = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
        } catch {
          blobUrl = dataUrl;
        }
        inlineBlobCache.set(dataUrl, blobUrl);
        return blobUrl;
      }

      function materializeInlineAssets(root) {
        if (exportFormat !== "single-html" || !root) return;
        root.querySelectorAll('img[src^="data:"]').forEach((img) => {
          const original = img.getAttribute("data-inline-src") || img.getAttribute("src") || "";
          if (!img.getAttribute("data-inline-src")) {
            img.setAttribute("data-inline-src", original);
          }
          img.setAttribute("src", dataUrlToBlobUrl(original));
        });
      }

      function syncEmbeddedPageFromHash() {
        if (exportFormat !== "single-html") return;
        const pageId = parsePageHash(window.location.hash);
        if (!pageId || !renderEmbeddedPage(pageId)) {
          renderCanvasShell();
        }
      }

      function showMinimap() {
        if (minimapPanel) {
          minimapPanel.hidden = false;
          if (minimapPanel.dataset.positionMode !== "custom") {
            placeMinimapUnderToolbar();
          }
        }
        if (minimapToolbarButton) {
          minimapToolbarButton.classList.add("is-active");
          minimapToolbarButton.setAttribute("aria-pressed", "true");
        }
        updateMinimapViewport();
      }

      function hideMinimap() {
        if (minimapPanel) minimapPanel.hidden = true;
        if (minimapToolbarButton) {
          minimapToolbarButton.classList.remove("is-active");
          minimapToolbarButton.setAttribute("aria-pressed", "false");
        }
      }

      window.toggleMinimap = function() {
        if (!minimapPanel) return;
        if (minimapPanel.hidden) {
          showMinimap();
        } else {
          hideMinimap();
        }
      };

`;
}
