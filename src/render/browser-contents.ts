// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserContents(): string {
  return `      let contentsReturnFocus = null;

      function getContentsFocusableElements() {
        if (!contentsPanel) return [];
        return Array.from(contentsPanel.querySelectorAll("a[href], button:not([disabled])"))
          .filter((element) => !element.hidden);
      }

      function openContents() {
        if (!contentsOverlay) return;
        contentsReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        contentsOverlay.hidden = false;
        contentsCloseButton?.focus();
      }

      function closeContents() {
        if (!contentsOverlay || contentsOverlay.hidden) return;
        contentsOverlay.hidden = true;
        if (contentsReturnFocus && contentsReturnFocus.isConnected && !contentsReturnFocus.hasAttribute("disabled")) {
          contentsReturnFocus.focus({ preventScroll: true });
        }
        contentsReturnFocus = null;
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
`;
}
