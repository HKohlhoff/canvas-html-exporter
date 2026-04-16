type NodeFsModule = typeof import("node:fs/promises");
type NodePathModule = typeof import("node:path");

declare const require: ((id: string) => unknown) | undefined;
declare const module: { require?: (id: string) => unknown } | undefined;

export function isAbsoluteFilesystemPath(value: string): boolean {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  return /^([A-Za-z]:[\\/]|\/)/.test(normalized);
}

export function isMobileRuntime(): boolean {
  if (typeof navigator === "undefined") return false;
  const agent = String(navigator.userAgent || navigator.vendor || "");
  return /iPhone|iPad|iPod|Android/i.test(agent);
}

export function normalizeStoredOutputPathValue(raw: string): string {
  const value = String(raw || "").trim();
  if (!value) return "";
  if (isAbsoluteFilesystemPath(value)) {
    return normalizeAbsoluteFolderPath(value);
  }
  if (value === "/" || value === ".") return "/";
  return value.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

export function normalizeAbsoluteFolderPath(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/+$/, "") || "/";
}

export function getDesktopNodeFs(): NodeFsModule | null {
  try {
    const requireFn = getRuntimeRequire();
    if (!requireFn) return null;
    return requireFn("node:fs/promises") as NodeFsModule;
  } catch {
    return null;
  }
}

export function getDesktopNodePath(): NodePathModule | null {
  try {
    const requireFn = getRuntimeRequire();
    if (!requireFn) return null;
    return requireFn("node:path") as NodePathModule;
  } catch {
    return null;
  }
}

export function requireDesktopNodeApis(): { fs: NodeFsModule; path: NodePathModule } {
  const fs = getDesktopNodeFs();
  const path = getDesktopNodePath();
  if (!fs || !path) {
    throw new Error("Absolute filesystem export is available on desktop only.");
  }
  return { fs, path };
}

function getRuntimeRequire(): ((id: string) => unknown) | null {
  if (typeof require === "function") {
    return require;
  }
  if (module && typeof module.require === "function") {
    return module.require.bind(module);
  }
  return null;
}
