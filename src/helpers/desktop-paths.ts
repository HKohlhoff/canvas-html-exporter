type DesktopFsModule = {
  mkdir(path: string, options: { recursive: true }): Promise<void>;
  writeFile(path: string, data: string | Uint8Array, encoding?: "utf8"): Promise<void>;
};

type DesktopPathModule = {
  dirname(path: string): string;
  join(...paths: string[]): string;
  resolve(...paths: string[]): string;
};

type ObsidianPlatform = { isMobile?: boolean };
type UnknownFunction = (...args: unknown[]) => unknown;

declare const require: ((id: string) => unknown) | undefined;
declare const module: { require?: (id: string) => unknown } | undefined;

export function isAbsoluteFilesystemPath(value: string): boolean {
  const normalized = String(value || "").trim();
  if (!normalized) return false;
  return /^([A-Za-z]:[/\\]|\/)/.test(normalized);
}

export function isMobileRuntime(): boolean {
  const Platform = getObsidianPlatform();
  return Platform?.isMobile === true;
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

export function getDesktopNodeFs(): DesktopFsModule | null {
  try {
    const requireFn = getRuntimeRequire();
    if (!requireFn) return null;
    return createDesktopFsModule(requireFn("node:fs/promises"));
  } catch {
    return null;
  }
}

export function getDesktopNodePath(): DesktopPathModule | null {
  try {
    const requireFn = getRuntimeRequire();
    if (!requireFn) return null;
    return createDesktopPathModule(requireFn("node:path"));
  } catch {
    return null;
  }
}

export function requireDesktopNodeApis(): { fs: DesktopFsModule; path: DesktopPathModule } {
  const fs = getDesktopNodeFs();
  const path = getDesktopNodePath();
  if (!fs || !path) {
    throw new Error("Absolute filesystem export is available on desktop only.");
  }
  return { fs, path };
}

export function getRuntimeRequire(): ((id: string) => unknown) | null {
  if (typeof require === "function") {
    return require;
  }
  if (typeof module !== "undefined" && typeof module.require === "function") {
    return module.require.bind(module);
  }
  return null;
}

function createDesktopFsModule(value: unknown): DesktopFsModule | null {
  const moduleRecord = getObjectRecord(value);
  const mkdir = getFunction(moduleRecord, "mkdir");
  const writeFile = getFunction(moduleRecord, "writeFile");
  if (!mkdir || !writeFile) return null;

  return {
    async mkdir(folderPath, options): Promise<void> {
      await Promise.resolve(mkdir(folderPath, options));
    },
    async writeFile(filePath, data, encoding): Promise<void> {
      await Promise.resolve(writeFile(filePath, data, encoding));
    },
  };
}

function createDesktopPathModule(value: unknown): DesktopPathModule | null {
  const moduleRecord = getObjectRecord(value);
  const dirname = getFunction(moduleRecord, "dirname");
  const join = getFunction(moduleRecord, "join");
  const resolve = getFunction(moduleRecord, "resolve");
  if (!dirname || !join || !resolve) return null;

  return {
    dirname(filePath): string {
      return requireStringResult(dirname(filePath), "path.dirname");
    },
    join(...paths): string {
      return requireStringResult(join(...paths), "path.join");
    },
    resolve(...paths): string {
      return requireStringResult(resolve(...paths), "path.resolve");
    },
  };
}

function getObjectRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

function getFunction(record: Record<string, unknown> | null, key: string): UnknownFunction | null {
  const value = record?.[key];
  return typeof value === "function" ? value as UnknownFunction : null;
}

function requireStringResult(value: unknown, operation: string): string {
  if (typeof value !== "string") {
    throw new Error(`${operation} returned an invalid value.`);
  }
  return value;
}

function getObsidianPlatform(): ObsidianPlatform | null {
  try {
    const requireFn = getRuntimeRequire();
    if (!requireFn) return null;
    const obsidianApi = requireFn("obsidian") as { Platform?: ObsidianPlatform };
    return obsidianApi.Platform ?? null;
  } catch {
    return null;
  }
}
