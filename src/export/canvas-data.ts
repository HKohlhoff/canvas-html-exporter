import type {
  CanvasData,
  CanvasNode,
  CanvasNodeBorderStyle,
  CanvasNodeShape,
  CanvasNodeTextAlign,
} from "../render/converter";

const ADVANCED_NODE_SHAPES = [
  "pill",
  "diamond",
  "parallelogram",
  "circle",
  "predefined-process",
  "document",
  "database",
] as const satisfies readonly CanvasNodeShape[];

const ADVANCED_NODE_BORDER_STYLES = [
  "dashed",
  "dotted",
  "invisible",
] as const satisfies readonly CanvasNodeBorderStyle[];

const ADVANCED_NODE_TEXT_ALIGNMENTS = [
  "center",
  "right",
] as const satisfies readonly CanvasNodeTextAlign[];

const ADVANCED_EDGE_PATH_STYLES = [
  "dotted",
  "short-dashed",
  "long-dashed",
] as const;

const ADVANCED_EDGE_ARROW_STYLES = [
  "triangle",
  "triangle-outline",
  "thin-triangle",
  "halved-triangle",
  "diamond",
  "diamond-outline",
  "circle",
  "circle-outline",
  "blunt",
] as const;

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

  const expanded = expandAdvancedCollapsedData(raw);

  const nodes = expanded.nodes
    .filter((item) => item && typeof item === "object")
    .map((item) => normalizeCanvasNode(item))
    .filter((node): node is CanvasNode => node !== null);

  const edges = expanded.edges
    .filter((item) => item && typeof item === "object")
    .map((item) => normalizeCanvasEdge(item))
    .filter((edge): edge is CanvasData["edges"][number] => edge !== null);

  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : fallbackName;

  return { nodes, edges, name };
}

export function collectCanvasColorKeys(data: Pick<CanvasData, "nodes" | "edges">): readonly string[] {
  const keys = new Set<string>();
  for (const color of [
    ...data.nodes.map((node) => node.color),
    ...data.edges.map((edge) => edge.color),
  ]) {
    const normalized = String(color || "").trim();
    if (/^\d+$/.test(normalized)) keys.add(normalized);
  }
  return [...keys].sort((left, right) => Number(left) - Number(right));
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
  const styleAttributes = toRecord(input.styleAttributes);
  const shape = type.toLowerCase() === "text"
    ? knownString(styleAttributes?.shape, ADVANCED_NODE_SHAPES)
    : undefined;
  const borderStyle = knownString(styleAttributes?.border, ADVANCED_NODE_BORDER_STYLES);
  const textAlign = type.toLowerCase() === "text"
    ? knownString(styleAttributes?.textAlign, ADVANCED_NODE_TEXT_ALIGNMENTS)
    : undefined;
  const advancedGroupCollapsed = type.toLowerCase() === "group" && input.collapsed === true
    ? true
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
    shape,
    borderStyle,
    textAlign,
    advancedGroupCollapsed,
  };
}

function normalizeCanvasEdge(input: Record<string, unknown>): CanvasData["edges"][number] | null {
  const fromNode = typeof input.fromNode === "string" && input.fromNode.trim() ? input.fromNode.trim() : "";
  const toNode = typeof input.toNode === "string" && input.toNode.trim() ? input.toNode.trim() : "";
  if (!fromNode || !toNode) return null;

  const id = typeof input.id === "string" ? input.id : undefined;
  const fromSide = typeof input.fromSide === "string" ? input.fromSide : undefined;
  const toSide = typeof input.toSide === "string" ? input.toSide : undefined;
  const label = typeof input.label === "string" ? input.label : undefined;
  const styleAttributes = toRecord(input.styleAttributes);
  const advancedArrowStyle = knownString(
    styleAttributes?.arrow,
    ADVANCED_EDGE_ARROW_STYLES,
  );
  const nativeFromEnd = firstString(input.fromEnd, input.fromArrow, input.startArrow, input.startMarker);
  const nativeToEnd = firstString(
    input.toEnd,
    input.toArrow,
    input.endArrow,
    input.endMarker,
  );
  const fromEnd = applyAdvancedArrowStyle(nativeFromEnd, advancedArrowStyle, false);
  const toEnd = applyAdvancedArrowStyle(nativeToEnd, advancedArrowStyle, true);
  const advancedLineStyle = knownString(styleAttributes?.path, ADVANCED_EDGE_PATH_STYLES);
  const lineStyle = firstString(
    input.lineStyle,
    input.style,
    input.strokeStyle,
    input.pathStyle,
    advancedLineStyle,
  );
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

function applyAdvancedArrowStyle(
  nativeEnd: string | undefined,
  advancedArrowStyle: typeof ADVANCED_EDGE_ARROW_STYLES[number] | undefined,
  defaultsToArrow: boolean,
): string | undefined {
  if (!advancedArrowStyle) return nativeEnd;
  if (nativeEnd?.trim().toLowerCase() === "none") return nativeEnd;
  if (nativeEnd || defaultsToArrow) return advancedArrowStyle;
  return nativeEnd;
}

function expandAdvancedCollapsedData(raw: Record<string, unknown>): {
  nodes: Record<string, unknown>[];
  edges: Record<string, unknown>[];
} {
  const sourceNodes = Array.isArray(raw.nodes)
    ? raw.nodes.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
  const sourceEdges = Array.isArray(raw.edges)
    ? raw.edges.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
  const nodesById = new Map<string, Record<string, unknown>>();
  const edgesById = new Map<string, Record<string, unknown>>();
  const anonymousEdges: Record<string, unknown>[] = [];

  const addEdge = (edge: Record<string, unknown>, replaceExisting = false): void => {
    const id = typeof edge.id === "string" && edge.id.trim() ? edge.id.trim() : "";
    if (id) {
      if (replaceExisting || !edgesById.has(id)) edgesById.set(id, edge);
    } else {
      anonymousEdges.push(edge);
    }
  };

  const addNode = (
    node: Record<string, unknown>,
    offsetX: number,
    offsetY: number,
    replaceExisting = false,
  ): void => {
    const id = typeof node.id === "string" && node.id.trim() ? node.id.trim() : "";
    if (!id || (nodesById.has(id) && !replaceExisting)) return;
    const x = toFiniteNumber(node.x) + offsetX;
    const y = toFiniteNumber(node.y) + offsetY;
    const restored = { ...node, x, y };
    nodesById.set(id, restored);

    const collapsedData = toRecord(node.collapsedData);
    const nestedNodes = Array.isArray(collapsedData?.nodes)
      ? collapsedData.nodes.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      : [];
    const nestedEdges = Array.isArray(collapsedData?.edges)
      ? collapsedData.edges.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      : [];
    for (const nestedEdge of nestedEdges) addEdge(nestedEdge);
    for (const nestedNode of nestedNodes) addNode(nestedNode, x, y);
  };

  for (const node of sourceNodes) addNode(node, 0, 0, true);
  for (const edge of sourceEdges) addEdge(edge, true);
  return {
    nodes: [...nodesById.values()],
    edges: [...edgesById.values(), ...anonymousEdges],
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

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function knownString<const T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return allowed.includes(normalized as T) ? normalized as T : undefined;
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
