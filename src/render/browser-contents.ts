// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserContents(): string {
  return `      let contentsReturnFocus = null;
      let globalNavigationOpen = navigationInitiallyOpen;

      function readPackageNavigationState() {
        if (exportFormat !== "package") return null;
        const value = new URLSearchParams(window.location.search).get("navigation");
        if (value === "open") return true;
        if (value === "closed") return false;
        return null;
      }

      function updatePackageNavigationLinks(open) {
        if (exportFormat !== "package") return;
        const state = open ? "open" : "closed";
        document.querySelectorAll('a[href]').forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (!href || href.startsWith("#")) return;
          try {
            const url = new URL(href, window.location.href);
            const isLocalTarget = url.protocol === window.location.protocol
              && (url.protocol === "file:" || url.origin === window.location.origin);
            if (!isLocalTarget) return;
            if (!url.pathname.toLowerCase().endsWith(".html")) return;
            url.searchParams.set("navigation", state);
            link.setAttribute("href", url.href);
          } catch {
            // Leave malformed or unsupported links unchanged.
          }
        });
      }

      function storeRootNavigationState(open) {
        globalNavigationOpen = open;
        if (exportFormat === "package") {
          const url = new URL(window.location.href);
          url.searchParams.set("navigation", open ? "open" : "closed");
          try {
            window.history.replaceState(null, "", url.href);
          } catch {
            // Link propagation below still preserves the chosen state.
          }
          updatePackageNavigationLinks(open);
        }
      }

      function getContentsFocusableElements() {
        if (!contentsPanel) return [];
        return Array.from(contentsPanel.querySelectorAll("a[href], button:not([disabled])"))
          .filter((element) => !element.hidden);
      }

      function applyContentsVisibility(open, focusCloseButton) {
        if (!contentsOverlay) return;
        contentsOverlay.hidden = !open;
        document.body.classList.toggle("contents-open", open);
        if (open && focusCloseButton) contentsCloseButton?.focus();
      }

      function openContents() {
        if (!contentsOverlay) return;
        contentsReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (isRootCanvas && (!singlePageView || singlePageView.hidden)) storeRootNavigationState(true);
        applyContentsVisibility(true, true);
      }

      function closeContents() {
        if (!contentsOverlay || contentsOverlay.hidden) return;
        if (isRootCanvas && (!singlePageView || singlePageView.hidden)) storeRootNavigationState(false);
        applyContentsVisibility(false, false);
        if (contentsReturnFocus && contentsReturnFocus.isConnected && !contentsReturnFocus.hasAttribute("disabled")) {
          contentsReturnFocus.focus({ preventScroll: true });
        }
        contentsReturnFocus = null;
      }

      function hideContentsForEmbeddedCanvas() {
        if (!contentsOverlay) return;
        contentsOverlay.hidden = true;
        document.body.classList.remove("contents-open");
      }

      function restoreContentsForCanvasView() {
        applyContentsVisibility(globalNavigationOpen, false);
      }

      function sendNavigationStateToCanvasFrame(frame) {
        if (!frame || !frame.contentWindow) return;
        frame.contentWindow.postMessage({
          type: "canvas-html-navigation-state",
          open: globalNavigationOpen,
        }, "*");
      }

      function trapContentsFocus(event) {
        if (!contentsOverlay || contentsOverlay.hidden || event.key !== "Tab") return false;
        const focusable = getContentsFocusableElements();
        if (!focusable.length) return false;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
          return true;
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
          return true;
        }
        return false;
      }

      window.openContents = openContents;
      window.closeContents = closeContents;

      const packageNavigationState = readPackageNavigationState();
      if (packageNavigationState !== null) {
        globalNavigationOpen = packageNavigationState;
      }
      if (isRootCanvas && exportFormat === "package") {
        storeRootNavigationState(globalNavigationOpen);
      } else {
        updatePackageNavigationLinks(globalNavigationOpen);
      }
      applyContentsVisibility(globalNavigationOpen, false);

      window.addEventListener("message", (event) => {
        if (isRootCanvas || exportFormat !== "single-html") return;
        if (event.source !== window.parent) return;
        const message = event.data;
        if (!message || message.type !== "canvas-html-navigation-state" || typeof message.open !== "boolean") return;
        globalNavigationOpen = message.open;
        applyContentsVisibility(message.open, false);
      });
`;
}
