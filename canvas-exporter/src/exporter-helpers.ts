import { CanvasData, CanvasNode } from "./converter";

function normalizeSimplePath(value: string): string {
  return value.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "");
}

function normalizeExportHref(href: string): string {
  return normalizeSimplePath(href).replace(/^\/+/, "");
}

function isExternalLink(value: string): boolean {
  return /^(https?:|mailto:|file:)/i.test(value);
}

export function shouldRewriteInternalTarget(target: string): boolean {
  const cleaned = target.trim();
  if (!cleaned) return false;
  if (isExternalLink(cleaned)) return false;
  if (cleaned.startsWith("#")) return false;

  const normalized = normalizeExportHref(cleaned);
  if (normalized.startsWith("assets/files/") || normalized.startsWith("assets/images/")) {
    return false;
  }

  return true;
}

export function normalizeCanvasData(input: unknown, fallbackName: string): CanvasData {
  const raw = (input && typeof input === "object") ? input as Record<string, unknown> : {};

  const nodes = Array.isArray(raw.nodes)
    ? raw.nodes
        .filter((item) => item && typeof item === "object")
        .map((item) => normalizeCanvasNode(item as Record<string, unknown>))
        .filter((node): node is CanvasNode => node !== null)
    : [];

  const edges = Array.isArray(raw.edges)
    ? raw.edges
        .filter((item) => item && typeof item === "object")
        .map((item) => normalizeCanvasEdge(item as Record<string, unknown>))
        .filter((edge): edge is CanvasData["edges"][number] => edge !== null)
    : [];

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : fallbackName;

  return { nodes, edges, name };
}

function normalizeCanvasNode(input: Record<string, unknown>): CanvasNode | null {
  const id = typeof input.id === "string" && input.id.trim() ? input.id.trim() : "";
  if (!id) return null;

  const type = typeof input.type === "string" ? input.type : "text";
  const x = toFiniteNumber(input.x);
  const y = toFiniteNumber(input.y);
  const width = toFiniteNumber(input.width);
  const height = toFiniteNumber(input.height);
  const text = typeof input.text === "string" ? input.text : undefined;
  const label = typeof input.label === "string" ? input.label : undefined;
  const file = typeof input.file === "string" ? input.file : undefined;
  const url = typeof input.url === "string" ? input.url : undefined;
  const color =
    typeof input.color === "string" || typeof input.color === "number"
      ? String(input.color).trim()
      : undefined;

  return {
    id,
    type,
    x,
    y,
    width,
    height,
    text,
    label,
    file,
    url,
    color: color || undefined,
  };
}

function normalizeCanvasEdge(input: Record<string, unknown>): CanvasData["edges"][number] | null {
  const fromNode = typeof input.fromNode === "string" && input.fromNode.trim() ? input.fromNode.trim() : "";
  const toNode = typeof input.toNode === "string" && input.toNode.trim() ? input.toNode.trim() : "";
  if (!fromNode || !toNode) return null;

  const id = typeof input.id === "string" ? input.id : undefined;
  const fromSide = typeof input.fromSide === "string" ? input.fromSide : undefined;
  const toSide = typeof input.toSide === "string" ? input.toSide : undefined;
  const fromEnd = firstString(input.fromEnd, input.fromArrow, input.startArrow, input.startMarker);
  const toEnd = firstString(input.toEnd, input.toArrow, input.endArrow, input.endMarker);
  const label = typeof input.label === "string" ? input.label : undefined;
  const lineStyle = firstString(input.lineStyle, input.style, input.strokeStyle, input.pathStyle);
  const color =
    typeof input.color === "string" || typeof input.color === "number"
      ? String(input.color).trim()
      : undefined;
  const width = toFiniteNumberOrUndefined(input.width ?? input.strokeWidth ?? input.lineWidth);

  return {
    id,
    fromNode,
    fromSide,
    fromEnd: fromEnd || undefined,
    toNode,
    toSide,
    toEnd: toEnd || undefined,
    label,
    color: color || undefined,
    lineStyle: lineStyle || undefined,
    width,
  };
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
}

function toFiniteNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function toFiniteNumberOrUndefined(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
}
