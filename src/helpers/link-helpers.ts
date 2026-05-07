export type ParsedWikiRef = { core: string; display: string | null; size: { width?: number; height?: number } | null };

export function splitTargetSuffix(value: string): { path: string; suffix: string } {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  let cut = -1;
  if (hashIndex >= 0 && queryIndex >= 0) cut = Math.min(hashIndex, queryIndex);
  else cut = Math.max(hashIndex, queryIndex);
  if (cut < 0) return { path: value, suffix: "" };
  return { path: value.slice(0, cut), suffix: value.slice(cut) };
}

export function parseWikiReference(value: string): ParsedWikiRef {
  const normalized = normalizeWikiTarget(value);
  const pipeIndex = normalized.indexOf("|");
  const core = (pipeIndex >= 0 ? normalized.slice(0, pipeIndex) : normalized).trim();
  const displayRaw = pipeIndex >= 0 ? normalized.slice(pipeIndex + 1).trim() : "";
  return { core, display: displayRaw || null, size: parseEmbedSize(displayRaw) };
}

export function parseEmbedSize(value: string): { width?: number; height?: number } | null {
  const raw = (value || "").trim();
  if (!raw) return null;
  const cleaned = raw.replace(/\s+/g, "");
  const pair = cleaned.match(/^(\d+)x(\d+)$/i);
  if (pair) {
    return { width: Number(pair[1]), height: Number(pair[2]) };
  }
  const single = cleaned.match(/^(\d+)$/);
  if (single) {
    return { width: Number(single[1]) };
  }
  return null;
}

export function embedSizeAttributes(size: { width?: number; height?: number } | null): string {
  if (!size) return "";
  const attrs: string[] = [];
  if (size.width && Number.isFinite(size.width)) attrs.push(` width="${Math.max(1, Math.round(size.width))}"`);
  if (size.height && Number.isFinite(size.height)) attrs.push(` height="${Math.max(1, Math.round(size.height))}"`);
  return attrs.join("");
}

export function normalizeWikiTarget(value: string): string {
  let out = value.trim();
  if (!out) return out;
  if (out.startsWith("![[") && out.endsWith("]]")) {
    out = out.slice(3, -2);
  } else if (out.startsWith("[[") && out.endsWith("]]")) {
    out = out.slice(2, -2);
  }
  return out.trim();
}
