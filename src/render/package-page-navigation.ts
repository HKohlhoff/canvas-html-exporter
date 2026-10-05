import { renderContents } from "./contents";
import { serializeScriptData } from "./html";
import type { getTheme } from "./theme";
import type { ContentsNavigation } from "./types";

type PackagePageNavigation = {
  buttonHtml: string;
  contentsHtml: string;
  css: string;
  script: string;
};

export function buildPackagePageNavigation(
  navigation: ContentsNavigation | undefined,
  pageId: string | undefined,
  packageRootHref: string | undefined,
  theme: ReturnType<typeof getTheme>,
): PackagePageNavigation {
  const contentsHtml = renderContents(navigation);
  if (!contentsHtml || !pageId || !packageRootHref) {
    return { buttonHtml: "", contentsHtml: "", css: "", script: "" };
  }

  return {
    buttonHtml: `<button id="page-navigation-button" class="page-navigation-button" type="button" aria-pressed="false">Navigation</button>`,
    contentsHtml,
    css: `
    :root { --contents-panel-width: min(420px, calc(100vw - 32px)); }
    body { transition: padding-left 0.16s ease; }
    body.contents-open { padding-left: var(--contents-panel-width); }
    .page-navigation-button {
      border: 0;
      padding: 0;
      background: transparent;
      color: ${theme.link};
      font: inherit;
      font-size: 0.95em;
      font-weight: 600;
      cursor: pointer;
    }
    .page-navigation-button:hover,
    .page-navigation-button.is-active {
      text-decoration: underline;
    }
    .contents-overlay {
      position: fixed;
      inset: 0 auto 0 0;
      z-index: 40;
      width: var(--contents-panel-width);
    }
    .contents-overlay[hidden] { display: none; }
    .contents-panel {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-right: 1px solid ${theme.canvasBorder};
      background: ${theme.canvasBackground};
      box-shadow: 12px 0 36px rgba(0,0,0,0.22);
    }
    .contents-header {
      padding: 18px 20px;
      border-bottom: 1px solid ${theme.canvasBorder};
    }
    .contents-header h2 { margin: 0; font-size: 1.15rem; }
    .contents-navigation {
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      padding: 10px 20px 24px;
    }
    .contents-section h3 {
      margin: 16px 0 8px;
      color: ${theme.mutedText};
      font-size: 0.78rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .contents-list { list-style: none; margin: 0; padding: 0; }
    .contents-list .contents-list {
      margin-left: 10px;
      padding-left: 14px;
      border-left: 1px solid ${theme.canvasBorder};
    }
    .contents-item { margin: 2px 0; }
    .contents-link {
      display: block;
      padding: 7px 9px;
      border-radius: 7px;
      color: ${theme.link};
      line-height: 1.35;
      text-decoration: none;
      overflow-wrap: anywhere;
    }
    .contents-link:hover { background: ${theme.chipBackground}; text-decoration: none; }
    .contents-link.is-current {
      background: ${theme.chipBackground};
      color: ${theme.text};
      font-weight: 600;
    }
    .contents-empty { margin: 18px 0 0; color: ${theme.mutedText}; font-size: 0.9rem; }
`,
    script: `
      const navigationPageId = ${serializeScriptData(pageId)};
      const packageRootHref = ${serializeScriptData(packageRootHref)};
      const navigationWindowStatePrefix = "canvas-html-exporter-navigation:";
      const contentsOverlay = document.getElementById("contents-overlay");
      const navigationButton = document.getElementById("page-navigation-button");
      let globalNavigationOpen = false;
      let navigationPageStates = {};
      let packageViewportStates = {};

      function normalizeNavigationPageStates(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) return {};
        return Object.fromEntries(
          Object.entries(value).filter((entry) => typeof entry[0] === "string" && typeof entry[1] === "boolean"),
        );
      }

      function normalizePackageViewportStates(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) return {};
        return Object.fromEntries(Object.entries(value).filter((entry) => {
          const state = entry[1];
          return typeof entry[0] === "string"
            && state && typeof state === "object" && !Array.isArray(state)
            && Number.isFinite(state.scale)
            && Number.isFinite(state.left)
            && Number.isFinite(state.top);
        }));
      }

      function getPackageNavigationScope() {
        try {
          const rootUrl = new URL(packageRootHref, window.location.href);
          return new URL(".", rootUrl).href;
        } catch {
          return "";
        }
      }

      function readNavigationState() {
        const params = new URLSearchParams(window.location.search);
        const globalValue = params.get("navigation");
        if (globalValue === "open") globalNavigationOpen = true;
        if (globalValue === "closed") globalNavigationOpen = false;
        const pageValue = params.get("navigationPages");
        if (pageValue) {
          try {
            navigationPageStates = normalizeNavigationPageStates(JSON.parse(pageValue));
          } catch {
            navigationPageStates = {};
          }
        }
        if (!window.name.startsWith(navigationWindowStatePrefix)) return;
        try {
          const stored = JSON.parse(window.name.slice(navigationWindowStatePrefix.length));
          if (!stored || stored.scope !== getPackageNavigationScope()) return;
          if (typeof stored.globalOpen === "boolean") globalNavigationOpen = stored.globalOpen;
          navigationPageStates = normalizeNavigationPageStates(stored.pageStates);
          packageViewportStates = normalizePackageViewportStates(stored.viewportStates);
        } catch {
          // Ignore unrelated or malformed window state.
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

      function updateNavigationLinks() {
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

      function writeNavigationState() {
        window.name = navigationWindowStatePrefix + JSON.stringify({
          scope: getPackageNavigationScope(),
          globalOpen: globalNavigationOpen,
          pageStates: navigationPageStates,
          viewportStates: packageViewportStates,
        });
        const url = new URL(window.location.href);
        applyNavigationParams(url);
        try {
          window.history.replaceState(null, "", url.href);
        } catch {
          // Link propagation below still preserves the chosen state.
        }
        updateNavigationLinks();
      }

      function applyNavigationVisibility(open) {
        if (!contentsOverlay || !navigationButton) return;
        contentsOverlay.hidden = !open;
        document.body.classList.toggle("contents-open", open);
        navigationButton.classList.toggle("is-active", open);
        navigationButton.setAttribute("aria-pressed", String(open));
      }

      function restoreNavigationVisibility() {
        const hasLocalState = Object.prototype.hasOwnProperty.call(navigationPageStates, navigationPageId);
        applyNavigationVisibility(hasLocalState ? navigationPageStates[navigationPageId] === true : false);
      }

      navigationButton.addEventListener("click", () => {
        const open = contentsOverlay.hidden;
        navigationPageStates[navigationPageId] = open;
        applyNavigationVisibility(open);
        writeNavigationState();
      });

      readNavigationState();
      writeNavigationState();
      restoreNavigationVisibility();
      window.addEventListener("pageshow", () => {
        readNavigationState();
        writeNavigationState();
        restoreNavigationVisibility();
      });
`,
  };
}
