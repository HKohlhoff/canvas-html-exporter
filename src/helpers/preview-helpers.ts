export function buildPreviewText(raw: string): string {
  return raw
    .replace(/^```[\s\S]*?```/gm, " ")
    .replace(/!\x5b[^\x5d]*\x5d\([^)]+\)/g, " ")
    .replace(/!\x5b\x5b([^\x5d]+)\x5d\x5d/g, " $1 ")
    .replace(/\x5b\x5b([^\x5d|]+)\|([^\x5d]+)\x5d\x5d/g, "$2")
    .replace(/\x5b\x5b([^\x5d]+)\x5d\x5d/g, "$1")
    .replace(/\x5b[^\x5d]+\x5d\([^)]+\)/g, " ")
    .replace(/[#>*`_~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}
