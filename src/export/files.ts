export function safeSegment(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return normalized || "item";
}

export function normalizeFolder(dir: string): string {
  const cleaned = dir.trim().replace(/^\/+|\/+$/g, "");
  return cleaned || "Canvas-Exports";
}

export function toExportRelativePath(targetPath: string, rootPath: string): string {
  const targetParts = normalizeSimplePath(targetPath).split("/").filter(Boolean);
  const rootParts = normalizeSimplePath(rootPath).split("/").filter(Boolean);
  if (targetParts.length <= rootParts.length) return targetParts.join("/");
  return targetParts.slice(rootParts.length).join("/");
}

export function buildUniqueOutputName(counter: number, basename: string, extension: string): string {
  const safeBase = safeSegment(basename);
  const ext = extension.startsWith(".") ? extension.slice(1) : extension;
  return `${String(counter).padStart(3, "0")}_${safeBase}.${ext}`;
}

function normalizeSimplePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/");
}
