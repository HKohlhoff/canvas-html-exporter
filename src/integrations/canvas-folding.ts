import type { App } from "obsidian";
import type {
  CanvasFoldState,
  CanvasFoldStateSource,
  FoldingInitialStateChoice,
} from "../folding/types";

export const CANVAS_FOLDING_PLUGIN_ID = "canvas-folding";
export const SUPPORTED_CANVAS_FOLDING_API_VERSION = 1;

interface CanvasFoldStateSnapshotLike {
  readonly canvasPath: unknown;
  readonly hiddenEdgeIds: unknown;
  readonly hiddenNodeIds: unknown;
  readonly source: unknown;
}

interface CanvasFoldingApiLike {
  readonly apiVersion: unknown;
  getFoldState(canvasPath: string): Promise<unknown>;
}

type PluginManagerLike = {
  getPlugin?: (id: string) => unknown;
  plugins?: Record<string, unknown>;
};

type CanvasFoldingPluginLike = {
  api?: unknown;
};

export function findCanvasFoldingApi(app: App): CanvasFoldingApiLike | null {
  const manager = (app as App & { plugins?: PluginManagerLike }).plugins;
  const plugin = manager?.getPlugin?.(CANVAS_FOLDING_PLUGIN_ID)
    ?? manager?.plugins?.[CANVAS_FOLDING_PLUGIN_ID];
  const api = (plugin as CanvasFoldingPluginLike | undefined)?.api;

  if (!api || typeof api !== "object") return null;
  const candidate = api as Partial<CanvasFoldingApiLike>;
  if (
    candidate.apiVersion !== SUPPORTED_CANVAS_FOLDING_API_VERSION
    || typeof candidate.getFoldState !== "function"
  ) {
    return null;
  }

  return candidate as CanvasFoldingApiLike;
}

export async function loadCanvasFoldState(
  app: App,
  canvasPath: string,
): Promise<CanvasFoldState | null> {
  try {
    const api = findCanvasFoldingApi(app);
    if (!api) return null;
    const snapshot = await api.getFoldState(canvasPath);
    return normalizeCanvasFoldState(snapshot, canvasPath);
  } catch {
    return null;
  }
}

export async function resolveInitialCanvasFoldState(
  app: App,
  canvasPath: string,
  choice: FoldingInitialStateChoice,
): Promise<CanvasFoldState | null> {
  if (choice !== "current") return null;
  return loadCanvasFoldState(app, canvasPath);
}

function normalizeCanvasFoldState(
  value: unknown,
  expectedCanvasPath: string,
): CanvasFoldState | null {
  if (!value || typeof value !== "object") return null;
  const snapshot = value as CanvasFoldStateSnapshotLike;
  if (snapshot.canvasPath !== expectedCanvasPath) return null;
  if (!isCanvasFoldStateSource(snapshot.source)) return null;
  if (!isStringArray(snapshot.hiddenNodeIds) || !isStringArray(snapshot.hiddenEdgeIds)) return null;

  return Object.freeze({
    hiddenEdgeIds: Object.freeze(uniqueSorted(snapshot.hiddenEdgeIds)),
    hiddenNodeIds: Object.freeze(uniqueSorted(snapshot.hiddenNodeIds)),
    source: snapshot.source,
  });
}

function isCanvasFoldStateSource(value: unknown): value is CanvasFoldStateSource {
  return value === "active-leaf" || value === "persisted";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
