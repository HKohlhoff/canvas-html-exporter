// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserContents(): string {
  return `      let globalNavigationOpen = navigationInitiallyOpen;
      let navigationPageStates = {};

      function getActiveNavigationPageId() {
        if (exportFormat === "single-html" && singlePageView && !singlePageView.hidden) {
          const embeddedPageId = parsePageHash(window.location.hash);
          if (embeddedPageId) return navigationPageId + ":page:" + embeddedPageId;
        }
        return navigationPageId;
      }

      function getStoredNavigationState(pageId) {
        if (Object.prototype.hasOwnProperty.call(navigationPageStates, pageId)) {
          return navigationPageStates[pageId] === true;
        }
        return globalNavigationOpen;
      }

      function readPackageNavigationState() {
        if (exportFormat !== "package") return;
        const params = new URLSearchParams(window.location.search);
        const globalValue = params.get("navigation");
        if (globalValue === "open") globalNavigationOpen = true;
        if (globalValue === "closed") globalNavigationOpen = false;
        const pageValue = params.get("navigationPages");
        if (!pageValue) return;
        try {
          const parsed = JSON.parse(pageValue);
          if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return;
          navigationPageStates = Object.fromEntries(
            Object.entries(parsed).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "boolean"),
          );
        } catch {
          navigationPageStates = {};
        }
      }

      function applyNavigationParams(url) {
        url.searchParams.set("navigation", globalNavigationOpen ? "open" : "closed");
        const pageEntries = Object.entries(navigationPageStates);
        if (pageEntries.length) {
          url.searchParams.set("navigationPages", JSON.stringify(Object.fromEntries(pageEntries)));
        } else {
          url.searchParams.delete("navigationPages");
        }
      }

      function updatePackageNavigationLinks() {
        if (exportFormat !== "package") return;
        document.querySelectorAll('a[href]').forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (!href || href.startsWith("#")) return;
          try {
            const url = new URL(href, window.location.href);
            const isLocalTarget = url.protocol === window.location.protocol
              && (url.protocol === "file:" || url.origin === window.location.origin);
            if (!isLocalTarget || !url.pathname.toLowerCase().endsWith(".html")) return;
            applyNavigationParams(url);
            link.setAttribute("href", url.href);
          } catch {
            // Leave malformed or unsupported links unchanged.
          }
        });
      }

      function storePackageNavigationState() {
        if (exportFormat !== "package") return;
        const url = new URL(window.location.href);
        applyNavigationParams(url);
        try {
          window.history.replaceState(null, "", url.href);
        } catch {
          // Link propagation below still preserves the chosen state.
        }
        updatePackageNavigationLinks();
      }

      function applyContentsVisibility(open) {
        if (!contentsOverlay) return;
        contentsOverlay.hidden = !open;
        document.body.classList.toggle("contents-open", open);
        contentsToolbarButtons.forEach((button) => {
          button.classList.toggle("is-active", open);
          button.setAttribute("aria-pressed", String(open));
        });
      }

      function storeCurrentNavigationState(open) {
        const isMainCanvas = isRootCanvas && (!singlePageView || singlePageView.hidden);
        if (isMainCanvas) {
          globalNavigationOpen = open;
        } else {
          const pageId = getActiveNavigationPageId();
          navigationPageStates[pageId] = open;
          if (exportFormat === "single-html" && !isRootCanvas) {
            window.parent.postMessage({
              type: "canvas-html-navigation-page-state",
              pageId,
              open,
            }, "*");
          }
        }
        storePackageNavigationState();
      }

      function openContents() {
        if (!contentsOverlay) return;
        storeCurrentNavigationState(true);
        applyContentsVisibility(true);
      }

      function closeContents() {
        if (!contentsOverlay) return;
        storeCurrentNavigationState(false);
        applyContentsVisibility(false);
      }

      function toggleContents() {
        if (!contentsOverlay) return;
        if (contentsOverlay.hidden) openContents();
        else closeContents();
      }

      function hideContentsForEmbeddedCanvas() {
        if (!contentsOverlay) return;
        contentsOverlay.hidden = true;
        document.body.classList.remove("contents-open");
      }

      function restoreContentsForCanvasView() {
        applyContentsVisibility(getStoredNavigationState(getActiveNavigationPageId()));
      }

      function sendNavigationStateToCanvasFrame(frame) {
        if (!frame || !frame.contentWindow) return;
        frame.contentWindow.postMessage({
          type: "canvas-html-navigation-state",
          globalOpen: globalNavigationOpen,
          pageStates: navigationPageStates,
        }, "*");
      }

      window.openContents = openContents;
      window.closeContents = closeContents;
      window.toggleContents = toggleContents;

      readPackageNavigationState();
      storePackageNavigationState();
      restoreContentsForCanvasView();

      window.addEventListener("message", (event) => {
        const message = event.data;
        if (!message || typeof message.type !== "string") return;
        if (message.type === "canvas-html-navigation-page-state") {
          if (!isRootCanvas || exportFormat !== "single-html") return;
          const activeFrame = singlePageBody?.querySelector(".single-canvas-frame");
          if (!activeFrame || event.source !== activeFrame.contentWindow) return;
          if (typeof message.pageId !== "string" || typeof message.open !== "boolean") return;
          navigationPageStates[message.pageId] = message.open;
          return;
        }
        if (message.type !== "canvas-html-navigation-state") return;
        if (isRootCanvas || exportFormat !== "single-html" || event.source !== window.parent) return;
        if (typeof message.globalOpen === "boolean") globalNavigationOpen = message.globalOpen;
        if (message.pageStates && typeof message.pageStates === "object" && !Array.isArray(message.pageStates)) {
          navigationPageStates = Object.fromEntries(
            Object.entries(message.pageStates).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "boolean"),
          );
        }
        restoreContentsForCanvasView();
      });
`;
}
