export function buildPreviewText(raw: string): string {
  return raw
    .replace(/^```[\s\S]*?```/gm, " ")
    .replace(/!\[[^\]]*\]\([^)]+\)/g, " ")
    .replace(/!\[\[([^\]]+)\]\]/g, " $1 ")
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\[[^\]]+\]\([^)]+\)/g, " ")
    .replace(/[#>*`_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}
