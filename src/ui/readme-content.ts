const ABSOLUTE_LINK_PATTERN = /^(?:[a-z][a-z\d+.-]*:|#|\/)/iu;
const HTML_HREF_PATTERN = /\bhref\s*=\s*(["'])(.*?)\1/iu;
const KOFI_LINK_PATTERN = /^https:\/\/(?:www\.)?ko-fi\.com(?:\/|$)/iu;
const CANVAS_COMPARISON_SOURCE = [
  "The canvas showing the documentation of this plugin, seen in Obsidian...",
  "![Canvas in Obsidian view](images/canvas_in_obsidian.png)",
  "",
  "looks (nearly) the same in the exported interactive HTML page...",
  "![Canvas in HTML view](images/canvas_as_html.png)",
].join("\n");
const CANVAS_COMPARISON_DISPLAY =
  "The canvas showing the documentation of this plugin, seen in Obsidian, " +
  "looks (nearly) the same in the exported interactive HTML page.";
const SINGLE_HTML_EXAMPLE_PATTERN =
  /An \*\*interactive export example\*\* of the Canvas shown above is available as a\n\[single HTML file\]\(documentation\/Canvas-HTML-Exporter-Documentation\.html\)\.\nIt is a large file[^\n]*\nThis README contains the current feature documentation\./u;

export function prepareReadmeMarkdown(
  markdown: string,
  repositoryUrl: string,
): string {
  const displayMarkdown = markdown
    .replace(CANVAS_COMPARISON_SOURCE, CANVAS_COMPARISON_DISPLAY)
    .replace(SINGLE_HTML_EXAMPLE_PATTERN, "");
  return normalizeBlankLines(
    rewriteRelativeLinks(removeImages(displayMarkdown), repositoryUrl),
  );
}

function removeImages(markdown: string): string {
  return markdown
    .replace(
      /<a\b([^>]*)>\s*<img\b[^>]*>\s*<\/a>/giu,
      (_match, attributes: string) => {
        const href = attributes.match(HTML_HREF_PATTERN)?.[2];
        return href !== undefined && KOFI_LINK_PATTERN.test(href)
          ? `[Support this plugin on Ko-fi](${href})`
          : "";
      },
    )
    .replace(/<img\b[^>]*>/giu, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, "");
}

function rewriteRelativeLinks(markdown: string, repositoryUrl: string): string {
  const repository = repositoryUrl.replace(/\/+$/u, "");
  return markdown.replace(
    /\[([^\]]+)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/gu,
    (match, label: string, target: string) => {
      if (ABSOLUTE_LINK_PATTERN.test(target)) return match;
      const [rawPath, fragment = ""] = target.split("#", 2);
      if (rawPath === undefined || rawPath.length === 0) return match;
      const path = rawPath.replace(/^\.\//u, "");
      const view = path.endsWith("/") ? "tree" : "blob";
      const suffix = fragment.length === 0 ? "" : `#${fragment}`;
      return `[${label}](${repository}/${view}/master/${path}${suffix})`;
    },
  );
}

function normalizeBlankLines(markdown: string): string {
  return `${markdown.replace(/\n(?:[ \t]*\n){2,}/gu, "\n\n").trim()}\n`;
}
