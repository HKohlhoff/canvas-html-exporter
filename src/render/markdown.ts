import katex from "katex";
import { safeNavigationUrl } from "../helpers/link-helpers";
import { renderCodeBlock } from "./highlighting";
import { escapeAttribute, escapeHtml } from "./html";
import type { MarkdownRenderOptions } from "./types";

function renderCalloutIcon(type: string): string {
  const key = String(type || "").toLowerCase();
  const iconName = CALL_OUT_ICON_NAMES[key] || "default";
  const svg = CALL_OUT_ICON_SVGS[iconName] || CALL_OUT_ICON_SVGS.default;
  return `<span class="callout-icon" data-icon="${escapeAttribute(iconName)}" aria-hidden="true">${svg}</span>`;
}

const CALL_OUT_ICON_NAMES: Record<string, keyof typeof CALL_OUT_ICON_SVGS> = {
  note: "pencil-alt",
  info: "info-circle",
  tip: "lightbulb",
  hint: "lightbulb",
  warning: "exclamation-triangle",
  caution: "fire",
  attention: "exclamation-triangle",
  important: "exclamation-circle",
  quote: "quote-right",
  cite: "quote-right",
  question: "question-circle",
  help: "question-circle",
  faq: "question-circle",
  danger: "fire",
  error: "fire",
  settings: "cog",
  todo: "tasks",
  award: "award",
  success: "check-circle",
  check: "check-circle",
  done: "check-circle",
};

const CALL_OUT_ICON_SVGS = {
  "info-circle": '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm0 4.2a1.3 1.3 0 1 1-1.3 1.3A1.3 1.3 0 0 1 12 6.2Zm1.8 11h-3.6v-1.8h.9v-4.2h-.9V9.4h2.7v6h.9Z"/></svg>',
  lightbulb: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 2.5a6.5 6.5 0 0 0-3.94 11.68A4.23 4.23 0 0 1 9.5 17h5a4.31 4.31 0 0 1 1.45-2.81A6.5 6.5 0 0 0 12 2.5Zm2.3 15.5H9.7a.7.7 0 0 0-.7.7 3 3 0 0 0 6 0 .7.7 0 0 0-.7-.7Zm-.15-2H9.85a2.46 2.46 0 0 0-.27-.43 8 8 0 0 0-.94-1A5 5 0 1 1 15.36 14.6a7.77 7.77 0 0 0-.94 1 2.46 2.46 0 0 0-.27.4Z"/></svg>',
  "exclamation-triangle": '<svg viewBox="0 0 24 24" focusable="false"><path d="M11.12 3.55 2.5 18.5A1.5 1.5 0 0 0 3.8 20.75h16.4a1.5 1.5 0 0 0 1.3-2.25L12.88 3.55a1.5 1.5 0 0 0-2.6 0ZM13 17h-2v-2h2Zm0-4h-2V8h2Z"/></svg>',
  fire: '<svg viewBox="0 0 24 24" focusable="false"><path d="M13.4 2.75c.24 2.13-.61 3.6-2.15 5.29C9.74 9.7 9 10.85 9 12.56a3 3 0 0 0 6 0c0-.78-.2-1.57-.74-2.52 2.16.92 3.74 3.18 3.74 5.96A6.56 6.56 0 0 1 11.5 22 6.32 6.32 0 0 1 5 15.87c0-4.42 2.9-6.85 5.08-8.7 1.46-1.24 2.69-2.28 3.32-4.42Z"/></svg>',
  "exclamation-circle": '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1 15h-2v-2h2Zm0-4h-2V7h2Z"/></svg>',
  "quote-right": '<svg viewBox="0 0 24 24" focusable="false"><path d="M13 7h7v6a4 4 0 0 1-4 4h-1v-2h1a2 2 0 0 0 2-2h-5Zm-9 0h7v6a4 4 0 0 1-4 4H6v-2h1a2 2 0 0 0 2-2H4Z"/></svg>',
  "question-circle": '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm1.1 15.5h-2.2v-2.1h2.2Zm2.24-7.48-.84.86A2.81 2.81 0 0 0 13.6 13h-2.2v-.55a3.26 3.26 0 0 1 .95-2.3l1.16-1.18a1.71 1.71 0 0 0-1.21-2.93A1.79 1.79 0 0 0 10.5 7.9H8.3A3.91 3.91 0 0 1 12.3 4a3.85 3.85 0 0 1 2.8 6Z"/></svg>',
  cog: '<svg viewBox="0 0 24 24" focusable="false"><path d="m21 13.25-.07-2.5-2.16-.63a7 7 0 0 0-.55-1.32l1.08-1.95-1.77-1.77-1.95 1.08a7 7 0 0 0-1.32-.55L13.75 3h-2.5l-.63 2.16a7 7 0 0 0-1.32.55L7.35 4.63 5.58 6.4l1.08 1.95a7 7 0 0 0-.55 1.32L3.95 10.3l-.07 2.5 2.16.63a7 7 0 0 0 .55 1.32L5.51 16.7l1.77 1.77 1.95-1.08a7 7 0 0 0 1.32.55l.63 2.16h2.5l.63-2.16a7 7 0 0 0 1.32-.55l1.95 1.08 1.77-1.77-1.08-1.95a7 7 0 0 0 .55-1.32ZM12.5 15.5a3.5 3.5 0 1 1 3.5-3.5 3.5 3.5 0 0 1-3.5 3.5Z"/></svg>',
  tasks: '<svg viewBox="0 0 24 24" focusable="false"><path d="M3 5h4v4H3Zm0 5h4v4H3Zm0 5h4v4H3Zm6-9h12v2H9Zm0 5h12v2H9Zm0 5h12v2H9Z"/></svg>',
  award: '<svg viewBox="0 0 24 24" focusable="false"><path d="M7 2h10v5.08a5.5 5.5 0 1 1-10 0Zm3.2 11.86L8 22l4-1.95L16 22l-2.2-8.14A5.4 5.4 0 0 1 12 14a5.4 5.4 0 0 1-1.8-.14ZM9 4v3.08a3.5 3.5 0 1 0 7 0V4Z"/></svg>',
  "check-circle": '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14.2-3.7-3.7 1.4-1.4 2.3 2.3 4.8-4.8 1.4 1.4Z"/></svg>',
  "pencil-alt": '<svg viewBox="0 0 24 24" focusable="false"><path d="m3 17.25 9.9-9.9 3.75 3.75-9.9 9.9L3 21Zm14.71-9.04-3.75-3.75 1.5-1.5a1 1 0 0 1 1.42 0l2.33 2.33a1 1 0 0 1 0 1.42Z"/></svg>',
  default: '<svg viewBox="0 0 24 24" focusable="false"><path d="M12 3 21 12 12 21 3 12Z"/></svg>',
} as const;

export async function markdownToHtml(
  markdown: string,
  options: MarkdownRenderOptions = {},
  headingIds: Map<string, number> = new Map(),
): Promise<string> {
  if (!markdown) return "";

  const normalized = markdown.replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  const out: string[] = [];
  const darkMode = options.darkMode ?? true;
  const highlightingTheme = options.highlightingTheme;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) {
      i += 1;
      continue;
    }

    if (parseStandaloneBlockRef(trimmed)) {
      i += 1;
      continue;
    }

    const singleBlockMath = trimmed.match(/^\$\$(.+)\$\$$/);
    if (singleBlockMath) {
      let html = renderMath(singleBlockMath[1].trim(), true);
      i += 1;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (trimmed === "$$") {
      i += 1;
      const mathLines: string[] = [];
      while (i < lines.length && lines[i]?.trim() !== "$$") {
        mathLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      let html = renderMath(mathLines.join("\n"), true);
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    const fence = trimmed.match(/^```([^\s`]+)?\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      i += 1;
      const codeLines: string[] = [];
      while (i < lines.length && !/^```\s*$/.test(lines[i] ?? "")) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      let html = await renderCodeBlock(codeLines.join("\n"), lang, darkMode, highlightingTheme);
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
      let html = "<hr>";
      i += 1;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      const headingText = heading[2].trim();
      const headingId = buildHeadingId(headingText, headingIds);
      const idAttr = headingId ? ` id="${escapeAttribute(headingId)}"` : "";
      let html = `<h${level}${idAttr}>${renderInline(headingText)}</h${level}>`;
      i += 1;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      if (level <= 6) {
        const sectionEnd = findHeadingSectionEnd(lines, i, level);
        const sectionLines = lines.slice(i, sectionEnd).join("\n").trim();
        const body = sectionLines ? await markdownToHtml(sectionLines, { darkMode, highlightingTheme }, headingIds) : "";
        out.push(`<details class="heading-section heading-section-h${level}" open><summary class="heading-summary">${html}</summary>${body}</details>`);
        i = sectionEnd;
        continue;
      }
      out.push(html);
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quoteLines: string[] = [];
      while (i < lines.length) {
        const current = lines[i] ?? "";
        const currentTrimmed = current.trim();
        if (!currentTrimmed) {
          break;
        }
        if (!/^>\s?/.test(currentTrimmed)) break;
        quoteLines.push(current.replace(/^\s*>\s?/, ""));
        i += 1;
      }
      const firstLine = quoteLines[0] ?? "";
      const calloutMatch = firstLine.match(/^\x5b!([\w-]+)\x5d([+-])?(?:\s+(.*))?$/i);
      if (calloutMatch) {
        const type = calloutMatch[1].toLowerCase();
        const indicator = calloutMatch[2];
        const title = calloutMatch[3]?.trim() || (type.charAt(0).toUpperCase() + type.slice(1));
        const icon = renderCalloutIcon(type);
        const contentLines = quoteLines.slice(1);
        const inner = await markdownToHtml(contentLines.join("\n"), { darkMode, highlightingTheme });
        if (indicator === "+" || indicator === "-") {
          const openAttr = indicator === "+" ? " open" : "";
          let html = `<details class="callout callout-${escapeAttribute(type)}"${openAttr}><summary class="callout-title">${icon}${escapeHtml(title)}</summary><div class="callout-content">${inner}</div></details>`;
          const blockAnchor = consumeFollowingBlockAnchor(lines, i);
          html = applyBlockAnchor(html, blockAnchor.anchorId);
          i = blockAnchor.nextIndex;
          out.push(html);
        } else {
          let html = `<div class="callout callout-${escapeAttribute(type)}"><div class="callout-title">${icon}${escapeHtml(title)}</div><div class="callout-content">${inner}</div></div>`;
          const blockAnchor = consumeFollowingBlockAnchor(lines, i);
          html = applyBlockAnchor(html, blockAnchor.anchorId);
          i = blockAnchor.nextIndex;
          out.push(html);
        }
      } else {
        const inner = await markdownToHtml(quoteLines.join("\n"), { darkMode, highlightingTheme });
        let html = `<blockquote>${inner}</blockquote>`;
        const blockAnchor = consumeFollowingBlockAnchor(lines, i);
        html = applyBlockAnchor(html, blockAnchor.anchorId);
        i = blockAnchor.nextIndex;
        out.push(html);
      }
      continue;
    }

    if (isTableStart(lines, i)) {
      const table = renderTable(lines, i);
      let html = table.html;
      i = table.nextIndex;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const list = parseListBlock(lines, i, "ul");
      let html = `<ul>${list.items.map((item) => `<li>${renderListItemLines(item)}</li>`).join("")}</ul>`;
      i = list.nextIndex;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const list = parseListBlock(lines, i, "ol");
      let html = `<ol>${list.items.map((item) => `<li>${renderListItemLines(item)}</li>`).join("")}</ol>`;
      i = list.nextIndex;
      const blockAnchor = consumeFollowingBlockAnchor(lines, i);
      html = applyBlockAnchor(html, blockAnchor.anchorId);
      i = blockAnchor.nextIndex;
      out.push(html);
      continue;
    }

    const paraLines: string[] = [];
    while (i < lines.length) {
      const current = lines[i] ?? "";
      const currentTrimmed = current.trim();
      if (!currentTrimmed) break;
      if (/^(#{1,6})\s+/.test(currentTrimmed)) break;
      if (/^```/.test(currentTrimmed)) break;
      if (/^\$\$/.test(currentTrimmed)) break;
      if (/^>\s?/.test(currentTrimmed)) break;
      if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(currentTrimmed)) break;
      if (/^[-*+]\s+/.test(currentTrimmed)) break;
      if (/^\d+\.\s+/.test(currentTrimmed)) break;
      if (isTableStart(lines, i)) break;
      if (parseStandaloneBlockRef(currentTrimmed)) break;
      paraLines.push(current.replace(/\s+$/, ""));
      i += 1;
    }
    let html = `<p>${renderParagraphLines(paraLines)}</p>`;
    const blockAnchor = consumeFollowingBlockAnchor(lines, i);
    html = applyBlockAnchor(html, blockAnchor.anchorId);
    i = blockAnchor.nextIndex;
    out.push(html);
  }

  return out.join("\n");
}

function findHeadingSectionEnd(lines: string[], startIndex: number, level: number): number {
  let fenceMarker: string | null = null;
  for (let index = startIndex; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    const fence = line.trim().match(/^(```+|~~~+)/);
    if (fence) {
      const marker = fence[1][0];
      if (!fenceMarker) {
        fenceMarker = marker;
      } else if (fenceMarker === marker) {
        fenceMarker = null;
      }
      continue;
    }
    if (fenceMarker) continue;
    const match = /^(#{1,6})\s+/.exec(line);
    if (match && match[1].length <= level) {
      return index;
    }
  }
  return lines.length;
}

function renderParagraphLines(lines: string[]): string {
  return renderInline(lines.join("\n").replace(/(?:\\| {2,})\n/g, "\n")).replace(/\n/g, "<br>\n");
}

function renderListItemLines(lines: string[]): string {
  return renderParagraphLines(lines);
}

function parseListBlock(lines: string[], startIndex: number, kind: "ul" | "ol"): { items: string[][]; nextIndex: number } {
  const markerPattern = kind === "ul" ? /^\s*[-*+]\s+(.*)$/ : /^\s*\d+\.\s+(.*)$/;
  const otherMarkerPattern = kind === "ul" ? /^\s*\d+\.\s+/ : /^\s*[-*+]\s+/;
  const items: string[][] = [];
  let currentItem: string[] | null = null;
  let i = startIndex;

  while (i < lines.length) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    if (!trimmed) break;

    const marker = markerPattern.exec(line);
    if (marker) {
      currentItem = [marker[1]];
      items.push(currentItem);
      i += 1;
      continue;
    }

    if (!currentItem) break;
    if (otherMarkerPattern.test(line)) break;
    if (isStandaloneBlockStart(lines, i)) break;
    if (!isIndentedListContinuation(line) && !hasExplicitLineBreak(currentItem[currentItem.length - 1] || "")) break;

    currentItem.push(line.replace(/^\s{1,4}/, ""));
    i += 1;
  }

  return { items, nextIndex: i };
}

function hasExplicitLineBreak(line: string): boolean {
  return /(?:\\| {2,})$/.test(line);
}

function isIndentedListContinuation(line: string): boolean {
  return /^\s+/.test(line);
}

function isStandaloneBlockStart(lines: string[], index: number): boolean {
  const currentTrimmed = (lines[index] ?? "").trim();
  if (/^(#{1,6})\s+/.test(currentTrimmed)) return true;
  if (/^```/.test(currentTrimmed)) return true;
  if (/^\$\$/.test(currentTrimmed)) return true;
  if (/^>\s?/.test(currentTrimmed)) return true;
  if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(currentTrimmed)) return true;
  if (isTableStart(lines, index)) return true;
  if (parseStandaloneBlockRef(currentTrimmed)) return true;
  return false;
}

function parseStandaloneBlockRef(value: string): string | null {
  const match = /^\^([A-Za-z0-9_-]+)$/.exec(String(value || "").trim());
  return match ? match[1] : null;
}

function consumeFollowingBlockAnchor(lines: string[], index: number): { anchorId: string; nextIndex: number } {
  const blockRef = parseStandaloneBlockRef(lines[index] ?? "");
  if (!blockRef) {
    return { anchorId: "", nextIndex: index };
  }
  return { anchorId: buildBlockAnchorId(blockRef), nextIndex: index + 1 };
}

function applyBlockAnchor(html: string, anchorId: string): string {
  if (!anchorId) return html;
  const openingTag = /^<([a-z0-9-]+)([^>]*)>/i;
  const match = openingTag.exec(html);
  if (!match) return html;
  if (/\sid=/.test(match[0])) {
    return `<div id="${escapeAttribute(anchorId)}">${html}</div>`;
  }
  return html.replace(openingTag, `<$1$2 id="${escapeAttribute(anchorId)}">`);
}

function isTableStart(lines: string[], index: number): boolean {
  const header = (lines[index] ?? "").trim();
  const separator = (lines[index + 1] ?? "").trim();
  if (!header.includes("|") || !separator.includes("|")) return false;
  const cells = splitTableRow(separator);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()));
}

function renderTable(lines: string[], index: number): { html: string; nextIndex: number } {
  const headers = splitTableRow(lines[index] ?? "").map((cell) => renderInline(cell.trim()));
  const alignSpec = splitTableRow(lines[index + 1] ?? "").map((cell) => cell.trim());
  const alignAttrs = alignSpec.map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return ' style="text-align:center"';
    if (right) return ' style="text-align:right"';
    return "";
  });

  const rows: string[] = [];
  let i = index + 2;
  while (i < lines.length) {
    const raw = (lines[i] ?? "").trim();
    if (!raw || !raw.includes("|")) break;
    const cells = splitTableRow(lines[i] ?? "");
    rows.push(`<tr>${cells.map((cell, idx) => `<td${alignAttrs[idx] || ""}>${renderInline(cell.trim())}</td>`).join("")}</tr>`);
    i += 1;
  }

  const thead = `<thead><tr>${headers.map((cell, idx) => `<th${alignAttrs[idx] || ""}>${cell}</th>`).join("")}</tr></thead>`;
  const tbody = rows.length ? `<tbody>${rows.join("")}</tbody>` : "";
  return { html: `<table>${thead}${tbody}</table>`, nextIndex: i };
}

function splitTableRow(row: string): string[] {
  let text = row.trim();
  if (text.startsWith("|")) text = text.slice(1);
  if (text.endsWith("|")) text = text.slice(0, -1);
  return text.split("|");
}

function renderInline(text: string): string {
  const smallStore: string[] = [];
  const withSmallPlaceholders = text.replace(/<small>([\s\S]*?)<\/small>/gi, (_match: string, content: string) => {
    smallStore.push(content);
    return `@@SMALL_${smallStore.length - 1}@@`;
  });
  const codeStore: string[] = [];
  const withCodePlaceholders = withSmallPlaceholders.replace(/`([^`]+)`/g, (_match: string, content: string) => {
    codeStore.push(`<code>${escapeHtml(content)}</code>`);
    return `@@CODE_${codeStore.length - 1}@@`;
  });

  const escapedCharStore: string[] = [];
  const withEscapedCharPlaceholders = withCodePlaceholders.replace(/\\([!"#$%&'()*+,.\-/:;<=>?@[\\\]^_`{|}~])/g, (_match: string, char: string) => {
    escapedCharStore.push(escapeHtml(char));
    return `@@ESC_${escapedCharStore.length - 1}@@`;
  });

  const mediaStore: string[] = [];
  const withMediaPlaceholders = replaceMarkdownMedia(withEscapedCharPlaceholders, mediaStore);

  const mathStore: string[] = [];
  const withMathPlaceholders = withMediaPlaceholders.replace(
    /(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g,
    (_match: string, content: string) => {
      mathStore.push(renderMath(content.trim(), false));
      return `@@MATH_${mathStore.length - 1}@@`;
    },
  );

  let html = escapeHtml(withMathPlaceholders);
  html = html.replace(
    /(^|[\s(>])((?:https?:\/\/|mailto:|file:)[^\s<]*[^\s<.,:;"')\]}])/g,
    '$1<a href="$2" target="_blank" rel="noopener noreferrer">$2</a>',
  );
  html = html.replace(/\x5b\x5b([^\x5d|]+)\|([^\x5d]+)\x5d\x5d/g, "[[$1|$2]]");
  html = html.replace(/\x5b\x5b([^\x5d]+)\x5d\x5d/g, "[[$1]]");
  html = html.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/___([^_\n]+)___/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
  html = html.replace(/(^|[\s([{>])\*([^*\n]+)\*(?=$|[\s)\]}<.,!?;:])/g, '$1<em>$2</em>');
  html = html.replace(/(^|[\s([{>])_([^_\n]+)_(?=$|[\s)\]}<.,!?;:])/g, '$1<em>$2</em>');
  html = html.replace(/~~([^~\n]+)~~/g, '<del>$1</del>');
  html = html.replace(/==([^=\n]+)==/g, (_match: string, content: string) => renderHighlight(content));
  html = html.replace(/&amp;emsp;/gi, "&emsp;");
  if (codeStore.length > 0) {
    html = html.replace(/@@CODE_(\d+)@@/g, (_m: string, idx: string) => codeStore[parseInt(idx, 10)] ?? "");
  }
  if (mediaStore.length > 0) {
    html = html.replace(/@@MEDIA_(\d+)@@/g, (_m: string, idx: string) => mediaStore[parseInt(idx, 10)] ?? "");
  }
  if (escapedCharStore.length > 0) {
    html = html.replace(/@@ESC_(\d+)@@/g, (_m: string, idx: string) => escapedCharStore[parseInt(idx, 10)] ?? "");
  }
  if (mathStore.length > 0) {
    html = html.replace(/@@MATH_(\d+)@@/g, (_m: string, idx: string) => mathStore[parseInt(idx, 10)] ?? "");
  }
  if (smallStore.length > 0) {
    html = html.replace(
      /@@SMALL_(\d+)@@/g,
      (_m: string, idx: string) => `<small>${renderInline(smallStore[parseInt(idx, 10)] ?? "")}</small>`,
    );
  }
  return html;
}

const HIGHLIGHT_COLORS: Record<string, string> = {
  "🔴": "rgba(255, 82, 82, 0.45)",
  "🟠": "rgba(255, 152, 0, 0.45)",
  "🟡": "rgba(255, 214, 10, 0.45)",
  "🟢": "rgba(76, 175, 80, 0.45)",
  "🔵": "rgba(33, 150, 243, 0.4)",
  "🟣": "rgba(156, 39, 176, 0.35)",
};

function renderHighlight(content: string): string {
  const colorEmoji = Object.keys(HIGHLIGHT_COLORS).find((emoji) => content.startsWith(emoji));
  const highlightedContent = colorEmoji ? content.slice(colorEmoji.length) : content;
  const color = colorEmoji ? HIGHLIGHT_COLORS[colorEmoji] : HIGHLIGHT_COLORS["🟡"];
  const colorClass = colorEmoji ? ` obsidian-highlight-${highlightColorName(colorEmoji)}` : "";
  return `<mark class="obsidian-highlight${colorClass}" style="background-color:${color};color:inherit">${highlightedContent}</mark>`;
}

function highlightColorName(emoji: string): string {
  return ({ "🔴": "red", "🟠": "orange", "🟡": "yellow", "🟢": "green", "🔵": "blue", "🟣": "purple" })[emoji] ?? "yellow";
}

function replaceMarkdownMedia(text: string, mediaStore: string[]): string {
  let out = "";
  let i = 0;

  while (i < text.length) {
    const imageMatch = tryParseMarkdownMedia(text, i, true);
    if (imageMatch) {
      mediaStore.push(`<img src="${escapeAttribute(imageMatch.target)}" alt="${escapeAttribute(imageMatch.label)}">`);
      out += `@@MEDIA_${mediaStore.length - 1}@@`;
      i = imageMatch.end;
      continue;
    }

    const linkMatch = tryParseMarkdownMedia(text, i, false);
    if (linkMatch) {
      mediaStore.push(
        `<a href="${escapeAttribute(safeNavigationUrl(linkMatch.target))}" target="_blank" rel="noopener noreferrer">${escapeHtml(linkMatch.label)}</a>`,
      );
      out += `@@MEDIA_${mediaStore.length - 1}@@`;
      i = linkMatch.end;
      continue;
    }

    out += text[i];
    i += 1;
  }

  return out;
}

function tryParseMarkdownMedia(
  text: string,
  start: number,
  isImage: boolean,
): { label: string; target: string; end: number } | null {
  const prefix = isImage ? "![" : "[";
  if (!text.startsWith(prefix, start)) return null;

  const labelStart = start + prefix.length;
  const labelEnd = text.indexOf("]", labelStart);
  if (labelEnd < 0 || text[labelEnd + 1] !== "(") return null;

  let depth = 1;
  let pos = labelEnd + 2;
  while (pos < text.length) {
    const ch = text[pos];
    if (ch === "\\") {
      pos += 2;
      continue;
    }
    if (ch === "(") depth += 1;
    if (ch === ")") {
      depth -= 1;
      if (depth === 0) {
        return {
          label: text.slice(labelStart, labelEnd),
          target: text.slice(labelEnd + 2, pos),
          end: pos + 1,
        };
      }
    }
    pos += 1;
  }

  return null;
}

function buildHeadingId(text: string, seen: Map<string, number>): string {
  const base = normalizeHeadingId(text);
  if (!base) return "";
  const current = seen.get(base) ?? 0;
  seen.set(base, current + 1);
  return current === 0 ? base : `${base}-${current}`;
}

function normalizeHeadingId(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

export function buildBlockAnchorId(value: string): string {
  const raw = String(value || "").trim().replace(/^#?\^/, "");
  const normalized = raw.replace(/[^A-Za-z0-9_-]/g, "-").replace(/-+/g, "-").replace(/^[-]+|[-]+$/g, "");
  return normalized ? `block-${normalized}` : "";
}

function renderMath(content: string, displayMode: boolean): string {
  try {
    return katex.renderToString(content, {
      output: "mathml",
      displayMode,
      throwOnError: true,
    });
  } catch {
    return `<code>${escapeHtml(content)}</code>`;
  }
}
