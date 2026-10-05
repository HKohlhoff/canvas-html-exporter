// Emitted inside the shared browser closure; no external runtime dependency.
export function buildBrowserSearch(): string {
  return `      let searchReturnFocus = null;

      function escapeHtml(value) {
        return String(value || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");
      }

      function escapeRegExp(value) {
        return String(value || "").replace(/[.*+?^()|[\x5d{}$\\]/g, "\\$&");
      }

      function appendHighlightedText(parent, text, query) {
        const value = String(text || "");
        if (!query) {
          parent.textContent = value;
          return;
        }
        const pattern = new RegExp(escapeRegExp(query), "ig");
        let lastIndex = 0;
        let match = pattern.exec(value);
        while (match) {
          if (match.index > lastIndex) {
            parent.appendChild(document.createTextNode(value.slice(lastIndex, match.index)));
          }
          const mark = document.createElement("mark");
          mark.textContent = match[0];
          parent.appendChild(mark);
          lastIndex = match.index + match[0].length;
          match = pattern.exec(value);
        }
        if (lastIndex < value.length) {
          parent.appendChild(document.createTextNode(value.slice(lastIndex)));
        }
      }

      function appendSearchQueryToHref(href, query, nodeId) {
        const rawHref = String(href || "");
        if (!rawHref) return "";
        if ((!query || !query.trim()) && !nodeId) return rawHref;
        if (rawHref.startsWith("#page-")) {
          const [pageRef, existingQuery = ""] = rawHref.slice(1).split("?");
          const params = new URLSearchParams(existingQuery);
          if (query && query.trim()) params.set("q", query);
          if (nodeId) params.set("node", nodeId);
          return "#" + pageRef + "?" + params.toString();
        }
        const hashIndex = rawHref.indexOf("#");
        const base = hashIndex >= 0 ? rawHref.slice(0, hashIndex) : rawHref;
        const hash = hashIndex >= 0 ? rawHref.slice(hashIndex) : "";
        const separator = base.includes("?") ? "&" : "?";
        const params = new URLSearchParams();
        if (query && query.trim()) params.set("q", query);
        if (nodeId) params.set("node", nodeId);
        return base + separator + params.toString() + hash;
      }

      function applyLinkAttrs(link, href, query, target, nodeId) {
        if (target) link.setAttribute("target", target);
        if (String(href).startsWith("#page-") && !target) {
          link.setAttribute("href", appendSearchQueryToHref(href, query, nodeId));
          link.setAttribute("data-inline-page", parseInlinePageIdFromHref(href));
          return;
        }
        link.setAttribute("href", appendSearchQueryToHref(href, query, nodeId));
      }

      function getSearchResultSnippet(entry, query) {
        const snippet = String(entry.snippet || "");
        const normalizedQuery = String(query || "").trim().toLowerCase();
        if (!normalizedQuery || snippet.toLowerCase().includes(normalizedQuery)) return snippet;
        const fullText = String(entry.text || "");
        const matchIndex = fullText.toLowerCase().indexOf(normalizedQuery);
        if (matchIndex < 0) return snippet;
        const start = Math.max(0, matchIndex - 80);
        const end = Math.min(fullText.length, matchIndex + normalizedQuery.length + 120);
        return (start > 0 ? "…" : "") + fullText.slice(start, end).trim() + (end < fullText.length ? "…" : "");
      }

      function renderSearchResults(matches, query) {
        if (!searchResults || !searchSummary) return;
        activeSearchIndex = matches.length ? 0 : -1;
        if (!query.trim()) {
          searchSummary.textContent = "Enter a search term to find matching nodes.";
          clearChildren(searchResults);
          return;
        }
          searchSummary.textContent = matches.length
          ? matches.length + " results · Press Enter to jump to the active result"
          : "No results found for this search term.";
        clearChildren(searchResults);
        for (const entry of matches) {
          const item = document.createElement("li");
          item.className = "search-result-item";
          if (entry.openHref && entry.focusNodeId) {
            const title = document.createElement("a");
            title.className = "search-result-title search-result-title-link";
            applyLinkAttrs(title, entry.openHref, query, entry.openTarget);
            title.setAttribute("data-search-open", "true");
            appendHighlightedText(title, entry.title, query);
            item.appendChild(title);
          } else {
            const title = document.createElement("span");
            title.className = "search-result-title";
            appendHighlightedText(title, entry.title, query);
            item.appendChild(title);
          }
          const result = entry.focusNodeId ? document.createElement("button") : document.createElement("a");
          if (entry.focusNodeId) {
            result.type = "button";
            result.setAttribute("data-node-id", entry.focusNodeId);
          } else if (entry.openHref) {
            applyLinkAttrs(result, entry.openHref, query, entry.openTarget, entry.openNodeId);
            result.setAttribute("data-search-open", "true");
          }
          result.className = "search-result";
          const metaEl = document.createElement("span");
          metaEl.className = "search-result-meta";
          metaEl.textContent = entry.kindLabel + " · " + entry.positionLabel;
          const snippetEl = document.createElement("span");
          snippetEl.className = "search-result-snippet";
          appendHighlightedText(snippetEl, getSearchResultSnippet(entry, query), query);
          result.append(metaEl, snippetEl);
          item.appendChild(result);
          searchResults.appendChild(item);
        }
        updateActiveSearchResult();
      }

      function runSearch(query) {
        const normalized = String(query || "").trim().toLowerCase();
        if (!normalized) {
          renderSearchResults([], "");
          return;
        }
        const matches = searchEntries
          .filter((entry) => entry.text.toLowerCase().includes(normalized))
          .slice(0, 50);
        renderSearchResults(matches, query);
      }

      function openSearch() {
        if (!searchOverlay) return;
        if (searchOverlay.hidden) searchReturnFocus = document.activeElement;
        searchOverlay.hidden = false;
        if (searchToolbarButton) {
          searchToolbarButton.classList.add("is-active");
          searchToolbarButton.setAttribute("aria-pressed", "true");
        }
        window.setTimeout(() => {
          if (searchInput && !searchOverlay.hidden) searchInput.focus();
        }, 0);
        runSearch(searchInput ? searchInput.value : "");
      }

      function closeSearch() {
        if (!searchOverlay || searchOverlay.hidden) return;
        searchOverlay.hidden = true;
        if (searchToolbarButton) {
          searchToolbarButton.classList.remove("is-active");
          searchToolbarButton.setAttribute("aria-pressed", "false");
        }
        const target = searchReturnFocus instanceof HTMLElement
          && searchReturnFocus !== document.body && searchReturnFocus !== document.documentElement
          && !searchReturnFocus.disabled
          && searchReturnFocus.isConnected && searchReturnFocus.getClientRects().length
          ? searchReturnFocus : searchToolbarButton;
        searchReturnFocus = null;
        if (target) target.focus({ preventScroll: true });
      }

      function trapSearchFocus(event) {
        if (event.key !== "Tab" || !searchOverlay || searchOverlay.hidden) return false;
        const controls = Array.from(searchOverlay.querySelectorAll("button, a[href], input, select, textarea, [tabindex]"))
          .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) return false;
        const active = document.activeElement;
        if (!controls.includes(active) || (event.shiftKey ? active === first : active === last)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
        return true;
      }

      function getSearchButtons() {
        return searchResults ? Array.from(searchResults.querySelectorAll(".search-result")) : [];
      }

      function updateActiveSearchResult() {
        const buttons = getSearchButtons();
        buttons.forEach((button, index) => {
          button.classList.toggle("is-active", index === activeSearchIndex);
        });
        if (activeSearchIndex >= 0 && buttons[activeSearchIndex]) {
          buttons[activeSearchIndex].scrollIntoView({ block: "nearest" });
        }
      }

      function moveActiveSearchResult(direction) {
        const buttons = getSearchButtons();
        if (!buttons.length) return;
        if (activeSearchIndex < 0) {
          activeSearchIndex = 0;
        } else {
          activeSearchIndex = (activeSearchIndex + direction + buttons.length) % buttons.length;
        }
        updateActiveSearchResult();
      }

      function activateCurrentSearchResult() {
        const buttons = getSearchButtons();
        if (!buttons.length) return;
        const active = buttons[activeSearchIndex >= 0 ? activeSearchIndex : 0];
        if (active) active.click();
      }

      window.openSearch = openSearch;
      window.closeSearch = closeSearch;

`;
}
