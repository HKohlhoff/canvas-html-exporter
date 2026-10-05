import { escapeHtml } from "./html";
import { buildExporterBuildMeta, EXPORTER_SIGNATURE } from "./metadata";
import { buildCalloutCss, buildCanvasColorVariables, buildHeadingColorCss, buildInlineStyleCss, getTheme, indentCssBlock } from "./theme";
import type { HighlightingThemeChoice } from "./types";

export function buildMarkdownDocumentHtml(
  title: string,
  bodyHtml: string,
  darkMode: boolean,
  canvasColors?: Record<string, string>,
  calloutColors?: Record<string, string>,
  headingColors?: Record<string, string>,
  inlineStyleColors?: Record<string, string>,
  highlightingTheme?: HighlightingThemeChoice,
  canvasHref?: string,
  backHref?: string,
): string {
  const theme = getTheme(darkMode);
  const calloutCss = buildCalloutCss(calloutColors);
  const headingCss = buildHeadingColorCss("", headingColors);
  const inlineStyleCss = buildInlineStyleCss("", inlineStyleColors);
  return `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1">\n  <meta name="generator" content="${EXPORTER_SIGNATURE}">\n  <meta name="canvas-html-exporter-build" content="${buildExporterBuildMeta(highlightingTheme)}">\n  <title>${escapeHtml(title)}</title>\n  <!-- Exported by ${EXPORTER_SIGNATURE} -->\n  <style>\n    :root { ${buildCanvasColorVariables(canvasColors)} }\n    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${theme.bodyBackground};
      color: ${theme.text};
      line-height: 1.65;
    }
    .md-page-toolbar {
      display: flex;
      justify-content: flex-end;
      gap: 14px;
      margin-bottom: 1em;
    }
    .md-page-back-link,
    .md-page-canvas-link {
      color: ${theme.link};
      text-decoration: none;
      font-size: 0.95em;
      font-weight: 600;
    }
    .md-page-back-link:hover,
    .md-page-canvas-link:hover {
      text-decoration: underline;
    }
    .md-page {
      max-width: 960px;
      margin: 32px auto;
      padding: 32px;
      background: ${theme.canvasBackground};
      border: 1px solid ${theme.canvasBorder};
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    h1, h2, h3, h4, h5, h6 { line-height: 1.25; margin-top: 1.1em; }
    h1 { margin-top: 0; }
    details.heading-section { margin: 0.8em 0; }
    details.heading-section > summary.heading-summary {
      position: relative;
      cursor: pointer;
      user-select: none;
      list-style: none;
    }
    details.heading-section > summary.heading-summary::-webkit-details-marker { display: none; }
    details.heading-section > summary.heading-summary h1,
    details.heading-section > summary.heading-summary h2,
    details.heading-section > summary.heading-summary h3,
    details.heading-section > summary.heading-summary h4,
    details.heading-section > summary.heading-summary h5,
    details.heading-section > summary.heading-summary h6 {
      display: inline-block;
      margin: 0 0.35em 0 0;
      vertical-align: middle;
    }
    details.heading-section > summary.heading-summary::before { content: "⌄"; position: absolute; left: -1em; top: 50%; transform: translateY(-50%); line-height: 1; color: ${theme.mutedText}; font-weight: 600; opacity: 0; transition: opacity 0.12s ease; }
    details.heading-section:not([open]) > summary.heading-summary::before { content: "›"; }
    details.heading-section > summary.heading-summary:hover::before,
    details.heading-section > summary.heading-summary:focus-visible::before { opacity: 1; }
    ${indentCssBlock(headingCss, 4)}
    ${indentCssBlock(inlineStyleCss, 4)}
    a { color: ${theme.link}; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul, ol { margin: 0.65em 0; padding-left: 2em; }
    code {
      background: ${theme.inlineCodeBackground};
      border-radius: 4px;
      padding: 0.1em 0.35em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
    }
    pre, .shiki {
      margin: 0.9em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    pre code, .shiki code { padding: 0; background: transparent; }
    blockquote {
      margin: 0.9em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
    .callout { border-radius: 6px; margin: 0.9em 0; overflow: hidden; border: 1px solid #888; }
    .callout-title { padding: 5px 10px; font-weight: 600; font-size: 0.88em; letter-spacing: 0.01em; }
    .callout-content { padding: 4px 10px 6px; }
    .callout-icon { margin-right: 5px; font-style: normal; display: inline-flex; align-items: center; vertical-align: -0.12em; }
    .callout-icon svg { width: 1em; height: 1em; fill: currentColor; display: block; }
    ${indentCssBlock(calloutCss, 4)}
    details.callout { display: block; }
    details.callout > summary.callout-title { cursor: pointer; list-style: none; user-select: none; }
    details.callout > summary.callout-title::-webkit-details-marker { display: none; }
    details.callout > summary.callout-title::after { content: " ›"; font-size: 0.85em; }
    details.callout[open] > summary.callout-title::after { content: " ⌄"; }
    hr { border: none; border-top: 1px solid ${theme.rule}; margin: 1em 0; }
    img { display: block; max-width: 100%; border-radius: 8px; margin: 0.8em 0; }
    table { border-collapse: collapse; width: auto; max-width: 100%; margin: 0.8em 0; }
    th, td { border: 1px solid ${theme.canvasBorder}; padding: 8px 10px; text-align: left; }
    .md-embed-block {
      margin: 0.8em 0;
    }
    .pdf-embed-block {
      margin: 0.8em 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.nodeBackground};
    }
    .pdf-embed-block iframe {
      display: block;
      width: 100%;
      min-height: 420px;
      border: none;
      background: ${theme.canvasBackground};
    }
    .file-embed-block,
    .media-embed-block {
      margin: 0.8em 0;
    }
    .media-embed-block audio,
    .media-embed-block video { display: block; width: 100%; max-width: 100%; }
    .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.4em 0.7em;
      border-radius: 999px;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      font-weight: 600;
      text-decoration: none;
    }
    .file-chip:hover {
      text-decoration: underline;
    }
    mark.search-highlight {
      background: rgba(255, 214, 10, 0.45);
      color: inherit;
      padding: 0 0.08em;
      border-radius: 3px;
    }
    :target,
    .target-highlight {
      background: rgba(255, 214, 10, 0.45);
      border-radius: 3px;
      box-shadow: 0 0 0 3px rgba(255, 214, 10, 0.2);
    }
    details.target-highlight {
      padding: 0.08em 0.2em;
    }
    .unresolved-link {
      color: #d64545;
      font-style: italic;
    }
  </style>
</head>
<body>
  <main class="md-page">
    <div class="md-page-toolbar">
      ${backHref ? `<a class="md-page-back-link" href="${escapeHtml(backHref)}">Back</a>` : ""}
      ${canvasHref ? `<a class="md-page-canvas-link" href="${escapeHtml(canvasHref)}">Canvas</a>` : ""}
    </div>
    <h1>${escapeHtml(title)}</h1>
    ${bodyHtml}
  </main>
  <script>
    (() => {
      const params = new URLSearchParams(window.location.search);
      const query = (params.get("q") || "").trim();
      const navigation = params.get("navigation");
      if (navigation === "open" || navigation === "closed") {
        document.querySelectorAll('a[href]').forEach((link) => {
          const href = link.getAttribute("href") || "";
          if (!href || href.startsWith("#")) return;
          try {
            const url = new URL(href, window.location.href);
            const isLocalTarget = url.protocol === window.location.protocol
              && (url.protocol === "file:" || url.origin === window.location.origin);
            if (!isLocalTarget) return;
            if (!url.pathname.toLowerCase().endsWith(".html")) return;
            url.searchParams.set("navigation", navigation);
            link.setAttribute("href", url.href);
          } catch {
            // Leave malformed or unsupported links unchanged.
          }
        });
      }
      const root = document.querySelector(".md-page");
      if (!root) return;

      function decodeHashComponent(value) {
        try {
          return decodeURIComponent(value);
        } catch {
          return value;
        }
      }

      const hashTargetId = decodeHashComponent(String(window.location.hash || "").replace(/^#/, ""));
      if (hashTargetId) {
        const target = document.getElementById(hashTargetId);
        if (target) {
          const highlightTarget = target.closest("details.heading-section") || target;
          highlightTarget.classList.add("target-highlight");
          let parent = target.parentElement;
          while (parent) {
            if (parent.tagName === "DETAILS") parent.open = true;
            parent = parent.parentElement;
          }
        }
      }

      if (!query) return;

      const pattern = new RegExp(query.replace(/[.*+?^()|[\\]{}$\\\\]/g, "\\\\$&"), "ig");
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (["SCRIPT", "STYLE"].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          if (!pattern.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
          pattern.lastIndex = 0;
          return NodeFilter.FILTER_ACCEPT;
        },
      });

      const matches = [];
      let current = walker.nextNode();
      while (current) {
        matches.push(current);
        current = walker.nextNode();
      }

      for (const textNode of matches) {
        const text = textNode.nodeValue || "";
        pattern.lastIndex = 0;
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        let match = pattern.exec(text);

        while (match) {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          const mark = document.createElement("mark");
          mark.className = "search-highlight";
          mark.textContent = match[0];
          fragment.appendChild(mark);
          lastIndex = match.index + match[0].length;
          match = pattern.exec(text);
        }

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        textNode.parentNode.replaceChild(fragment, textNode);
      }
    })();
  </script>
</body>
</html>`;
}
