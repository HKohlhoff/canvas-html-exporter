import { escapeAttribute, escapeHtml } from "./html";
import type { ContentsNavigation, ContentsNavigationItem } from "./types";

function renderContentsItems(items: ContentsNavigationItem[]): string {
  return `<ul class="contents-list">${items.map((item) => {
    const currentAttr = item.current
      ? ` aria-current="page"${item.kind === "canvas" ? ` data-contents-current-canvas="true"` : ""}`
      : "";
    const targetAttr = item.target ? ` target="${item.target}"` : "";
    const inlinePageAttr = item.href.startsWith("#page-") && !item.target
      ? ` data-inline-page="${escapeAttribute(item.href.replace(/^#page-/, "").split(/[?#]/)[0])}"`
      : "";
    const label = item.current
      ? `<span class="contents-link is-current"${currentAttr}>${escapeHtml(item.title)}</span>`
      : `<a class="contents-link" href="${escapeAttribute(item.href)}"${targetAttr}${inlinePageAttr}>${escapeHtml(item.title)}</a>`;
    const children = item.children?.length ? renderContentsItems(item.children) : "";
    return `<li class="contents-item" data-contents-kind="${item.kind}">${label}${children}</li>`;
  }).join("")}</ul>`;
}

export function renderContents(navigation: ContentsNavigation | undefined): string {
  if (!navigation || (!navigation.canvases.length && !navigation.pages.length)) return "";
  const canvasSection = `<section class="contents-section"><h3>Canvases</h3>${renderContentsItems(navigation.canvases)}</section>`;
  const pagesSection = navigation.pages.length
    ? `<section class="contents-section"><h3>Pages in this canvas</h3>${renderContentsItems(navigation.pages)}</section>`
    : `<p class="contents-empty">No additional pages in this canvas.</p>`;
  return `<div id="contents-overlay" class="contents-overlay" hidden>
    <aside id="contents-panel" class="contents-panel" aria-labelledby="contents-title">
      <header class="contents-header">
        <h2 id="contents-title">Navigation</h2>
      </header>
      <nav class="contents-navigation" aria-label="Exported pages">
        ${canvasSection}
        ${pagesSection}
      </nav>
    </aside>
  </div>`;
}
