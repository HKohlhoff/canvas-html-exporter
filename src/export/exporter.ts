import type { App, TAbstractFile, TFile } from "obsidian";
import {
  EmbeddedPage,
  buildBlockAnchorId,
  buildCanvasColorVariables,
  buildMarkdownDocumentHtml,
  CanvasData,
  CanvasNode,
  ExportOptions,
  EXPORTER_SIGNATURE,
  EXPORTER_VERSION,
  HighlightingThemeChoice,
  markdownToHtml,
} from "../render/converter";
import { buildContentsNavigation } from "./contents";
import { isAbsoluteFilesystemPath, requireDesktopNodeApis } from "../helpers/desktop-paths";
import { buildUniqueOutputName, normalizeFolder, safeSegment, toExportRelativePath } from "./files";
import { normalizeCanvasData, shouldRewriteInternalTarget } from "./canvas-data";
import { safeNavigationUrl, safeWebPreviewUrl, embedSizeAttributes, normalizeWikiTarget, parseWikiReference, splitTargetSuffix } from "../helpers/link-helpers";
import { getHrefForMarkdownPage } from "../helpers/path-helpers";
import { buildPreviewText } from "../helpers/preview-helpers";
import type { ExportFormatChoice } from "../settings";
import type { CanvasFoldState } from "../folding/types";
import { filterCanvasFoldState } from "../folding/export-state";

export type ExportSettings = {
  darkMode: boolean;
  outputDir: string;
  exportFormat?: ExportFormatChoice;
  canvasColors?: Record<string, string>;
  calloutColors?: Record<string, string>;
  headingColors?: Record<string, string>;
  inlineStyleColors?: Record<string, string>;
  highlightingTheme?: HighlightingThemeChoice;
  showMinimap?: boolean;
  showSearch?: boolean;
  foldingInitiallyEnabled?: boolean;
  initialFoldState?: CanvasFoldState;
};

export type ExportResult = {
  outputPath: string;
  outputKind: "folder" | "file";
  data: PreparedCanvasData;
  options: ExportOptions;
  canvasPages: ExportedCanvasPage[];
};

type PreparedCanvasData = CanvasData;

export type ExportedCanvasPage = {
  sourcePath: string;
  title: string;
  href: string;
  data: PreparedCanvasData;
  options: ExportOptions;
  outputPath?: string;
  pageId?: string;
};

type CanvasRegistryEntry = {
  href: string;
  outputPath?: string;
  pageId?: string;
  data?: PreparedCanvasData;
  status: "preparing" | "complete";
};

type MarkdownContext = {
  app: App;
  canvasFile: TFile;
  rootCanvasPath: string;
  exportFormat: ExportFormatChoice;
  outputMode: "vault" | "filesystem";
  outputRoot: string;
  assetsFilesDir: string;
  assetsImagesDir: string;
  darkMode: boolean;
  highlightingTheme?: HighlightingThemeChoice;
  fileMap: Map<string, string>;
  htmlMap: Map<string, string>;
  outputCounter: { value: number };
  pageStack: Set<string>;
  inlineStack: Set<string>;
  canvasColors?: Record<string, string>;
  calloutColors?: Record<string, string>;
  headingColors?: Record<string, string>;
  inlineStyleColors?: Record<string, string>;
  singleHtmlPages: EmbeddedPage[];
  pageIdCounter: number;
  canvasRegistry: Map<string, CanvasRegistryEntry>;
  canvasPages: ExportedCanvasPage[];
  canvasPageCounter: { value: number };
  settings: ExportSettings;
};

type LinkBase = "canvas" | "page";

type ResolvedInternalTarget = {
  href: string;
  found: boolean;
  kind: "markdown" | "canvas" | "image" | "file" | "external" | "anchor" | "missing";
  displayText?: string;
  navigationTarget?: "_parent";
};

function stripFrontmatter(markdown: string): string {
  const normalized = markdown.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return markdown;
  }

  const end = normalized.indexOf("\n---\n", 4);
  if (end === -1) {
    return markdown;
  }

  return normalized.slice(end + 5).replace(/^\n+/, "");
}

function normalizeExportHref(href: string): string {
  return normalizePath(href).replace(/^\/+/, "");
}

function buildBinaryDataUrl(data: ArrayBuffer, mimeType: string): string {
  const base64 = bytesToBase64(new Uint8Array(data));
  return `data:${mimeType};base64,${base64}`;
}

function registerSingleHtmlPage(
  ctx: MarkdownContext,
  title: string,
  kind: EmbeddedPage["kind"],
  bodyHtml: string,
): string {
  ctx.pageIdCounter += 1;
  const pageId = `p${ctx.pageIdCounter}`;
  ctx.singleHtmlPages.push({
    id: pageId,
    title,
    kind,
    bodyHtml,
  });
  return `#page-${pageId}`;
}

function getMimeTypeForExtension(extension: string): string {
  switch (extension.toLowerCase()) {
    case "png": return "image/png";
    case "jpg":
    case "jpeg": return "image/jpeg";
    case "gif": return "image/gif";
    case "svg": return "image/svg+xml";
    case "webp": return "image/webp";
    case "bmp": return "image/bmp";
    case "pdf": return "application/pdf";
    case "mp3": return "audio/mpeg";
    case "wav": return "audio/wav";
    case "m4a": return "audio/mp4";
    case "aac": return "audio/aac";
    case "ogg": return "audio/ogg";
    case "oga": return "audio/ogg";
    case "flac": return "audio/flac";
    case "mp4": return "video/mp4";
    case "m4v": return "video/mp4";
    case "mov": return "video/quicktime";
    case "webm": return "video/webm";
    case "ogv": return "video/ogg";
    case "html": return "text/html;charset=utf-8";
    case "txt": return "text/plain;charset=utf-8";
    case "md": return "text/markdown;charset=utf-8";
    case "zip": return "application/zip";
    default: return "application/octet-stream";
  }
}

function isAudioExt(ext: string): boolean {
  return ["mp3", "wav", "m4a", "aac", "ogg", "oga", "flac"].includes(ext.toLowerCase());
}

function isVideoExt(ext: string): boolean {
  return ["mp4", "m4v", "mov", "webm", "ogv"].includes(ext.toLowerCase());
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
  }
  return btoa(chunks.join(""));
}

export async function exportCanvasPackage(
  app: App,
  canvasFile: TFile,
  settings: ExportSettings,
): Promise<ExportResult> {
  const rootParsed = await readCanvasJson(app, canvasFile);
  const outputMode = isAbsoluteFilesystemPath(settings.outputDir) && settings.outputDir.trim() !== "/" ? "filesystem" : "vault";
  const baseFolder = resolveBaseFolder(settings.outputDir, outputMode);
  const safeCanvasName = safeSegment(canvasFile.basename);
  const exportFolder = joinOutputPath(outputMode, baseFolder, safeCanvasName);
  const singleHtmlPath = joinOutputPath(outputMode, baseFolder, `${safeCanvasName}.html`);
  const exportFormat = settings.exportFormat || "package";
  const useSingleHtml = exportFormat === "single-html";
  const assetsDir = useSingleHtml ? "" : joinOutputPath(outputMode, exportFolder, "assets");
  const imagesDir = useSingleHtml ? "" : joinOutputPath(outputMode, assetsDir, "images");
  const filesDir = useSingleHtml ? "" : joinOutputPath(outputMode, assetsDir, "files");

  await ensureFolderExists(app, baseFolder, outputMode);
  if (!useSingleHtml) {
    await ensureFolderExists(app, exportFolder, outputMode);
    await ensureFolderExists(app, assetsDir, outputMode);
    await ensureFolderExists(app, imagesDir, outputMode);
    await ensureFolderExists(app, filesDir, outputMode);
  }

  const ctx: MarkdownContext = {
    app,
    canvasFile,
    rootCanvasPath: canvasFile.path,
    exportFormat,
    outputMode,
    outputRoot: useSingleHtml ? singleHtmlPath : exportFolder,
    assetsFilesDir: filesDir,
    assetsImagesDir: imagesDir,
    darkMode: settings.darkMode,
    highlightingTheme: settings.highlightingTheme,
    fileMap: new Map<string, string>(),
    htmlMap: new Map<string, string>(),
    outputCounter: { value: 0 },
    pageStack: new Set<string>(),
    inlineStack: new Set<string>(),
    canvasColors: settings.canvasColors,
    calloutColors: settings.calloutColors,
    headingColors: settings.headingColors,
    inlineStyleColors: settings.inlineStyleColors,
    singleHtmlPages: [],
    pageIdCounter: 0,
    canvasRegistry: new Map<string, CanvasRegistryEntry>(),
    canvasPages: [],
    canvasPageCounter: { value: 0 },
    settings,
  };

  ctx.canvasRegistry.set(canvasFile.path, {
    href: useSingleHtml ? "#" : "index.html",
    status: "preparing",
  });
  const root = await prepareCanvasDocument(ctx, canvasFile, settings.initialFoldState, rootParsed);
  const rootEntry = ctx.canvasRegistry.get(canvasFile.path);
  if (rootEntry) {
    rootEntry.data = root.data;
    rootEntry.status = "complete";
  }
  attachCanvasPreviews(ctx, [root.data, ...ctx.canvasPages.map((page) => page.data)]);
  const contentsDocuments = [
    {
      sourcePath: canvasFile.path,
      title: root.options.title,
      href: useSingleHtml ? "#" : "index.html",
      data: root.data,
    },
    ...ctx.canvasPages.map((page) => ({
      sourcePath: page.sourcePath,
      title: page.title,
      href: page.href,
      data: page.data,
    })),
  ];
  root.options.contents = buildContentsNavigation(
    contentsDocuments,
    canvasFile.path,
    canvasFile.path,
    ctx.exportFormat,
  );
  for (const page of ctx.canvasPages) {
    page.options.contents = buildContentsNavigation(
      contentsDocuments,
      canvasFile.path,
      page.sourcePath,
      ctx.exportFormat,
    );
  }
  if (useSingleHtml && ctx.canvasPages.length > 0) {
    root.options.embeddedPages = [
      ...(root.options.embeddedPages || []),
      ...ctx.canvasPages.map((page) => ({
        id: page.pageId || "",
        title: page.title,
        kind: "canvas" as const,
        bodyHtml: "",
      })),
    ];
  }

  return {
    outputPath: useSingleHtml ? singleHtmlPath : exportFolder,
    outputKind: useSingleHtml ? "file" : "folder",
    data: root.data,
    options: root.options,
    canvasPages: ctx.canvasPages,
  };
}

async function prepareCanvasDocument(
  ctx: MarkdownContext,
  canvasFile: TFile,
  requestedFoldState?: CanvasFoldState,
  parsedCanvas?: unknown,
): Promise<{ data: PreparedCanvasData; options: ExportOptions }> {
  const parsed = parsedCanvas === undefined
    ? await readCanvasJson(ctx.app, canvasFile)
    : parsedCanvas;
  const normalized = normalizeCanvasData(parsed, canvasFile.basename);
  const preparedNodes: CanvasNode[] = [];
  for (const node of normalized.nodes) {
    const preparedNode = await prepareNode(ctx, node);
    if (preparedNode) preparedNodes.push(preparedNode);
  }

  const nodeIds = new Set(preparedNodes.map((node) => node.id));
  const preparedEdges = normalized.edges.filter((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode));
  const initialFoldState = ctx.settings.foldingInitiallyEnabled === true && requestedFoldState
    ? filterCanvasFoldState(
      requestedFoldState,
      nodeIds,
      preparedEdges.flatMap((edge) => edge.id ? [edge.id] : []),
    )
    : undefined;
  const title = normalized.name || canvasFile.basename;

  return {
    data: { nodes: preparedNodes, edges: preparedEdges, name: title },
    options: {
      darkMode: ctx.settings.darkMode,
      title,
      highlightingTheme: ctx.settings.highlightingTheme,
      showMinimap: ctx.settings.showMinimap,
      showSearch: ctx.settings.showSearch,
      foldingInitiallyEnabled: ctx.settings.foldingInitiallyEnabled === true,
      canvasColors: ctx.settings.canvasColors,
      calloutColors: ctx.settings.calloutColors,
      headingColors: ctx.settings.headingColors,
      inlineStyleColors: ctx.settings.inlineStyleColors,
      exportFormat: ctx.exportFormat,
      canvasHomeHref: canvasFile.path !== ctx.rootCanvasPath
        ? ctx.exportFormat === "single-html" ? "#" : "index.html"
        : undefined,
      canvasHomeTarget: ctx.exportFormat === "single-html" && canvasFile.path !== ctx.rootCanvasPath
        ? "_parent"
        : undefined,
      embeddedPages: ctx.singleHtmlPages,
      initialFoldState,
    },
  };
}

async function readCanvasJson(app: App, canvasFile: TFile): Promise<unknown> {
  const rawContent = await app.vault.read(canvasFile);
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    const detail = error instanceof Error ? `: ${error.message}` : "";
    throw new Error(`Invalid canvas JSON in ${canvasFile.path}${detail}`);
  }
  return parsed;
}

function createChildCanvasContext(ctx: MarkdownContext, canvasFile: TFile): MarkdownContext {
  return {
    ...ctx,
    canvasFile,
    htmlMap: new Map<string, string>(),
    pageStack: new Set<string>(),
    inlineStack: new Set<string>(),
    singleHtmlPages: [],
    pageIdCounter: 0,
  };
}

async function exportCanvasTarget(ctx: MarkdownContext, canvasFile: TFile): Promise<CanvasRegistryEntry> {
  const existing = ctx.canvasRegistry.get(canvasFile.path);
  if (existing) return existing;

  ctx.canvasPageCounter.value += 1;
  const pageNumber = ctx.canvasPageCounter.value;
  const pageId = ctx.exportFormat === "single-html" ? `canvas-c${pageNumber}` : undefined;
  const href = ctx.exportFormat === "single-html"
    ? `#page-${pageId}`
    : `canvas-${String(pageNumber).padStart(3, "0")}-${safeSegment(canvasFile.basename)}.html`;
  const outputPath = ctx.exportFormat === "package"
    ? joinOutputPath(ctx.outputMode, ctx.outputRoot, href)
    : undefined;
  const entry: CanvasRegistryEntry = {
    href,
    outputPath,
    pageId,
    status: "preparing",
  };
  ctx.canvasRegistry.set(canvasFile.path, entry);

  try {
    const childContext = createChildCanvasContext(ctx, canvasFile);
    const prepared = await prepareCanvasDocument(childContext, canvasFile);
    ctx.canvasPages.push({
      sourcePath: canvasFile.path,
      title: prepared.options.title,
      href,
      data: prepared.data,
      options: prepared.options,
      outputPath,
      pageId,
    });
    entry.data = prepared.data;
    entry.status = "complete";
    return entry;
  } catch (error) {
    ctx.canvasRegistry.delete(canvasFile.path);
    throw error;
  }
}

function canvasNavigationTarget(ctx: MarkdownContext): "_parent" | undefined {
  return ctx.exportFormat === "single-html" && ctx.canvasFile.path !== ctx.rootCanvasPath
    ? "_parent"
    : undefined;
}

async function prepareNode(ctx: MarkdownContext, node: CanvasNode): Promise<CanvasNode | null> {
  const nodeType = (node.type || "").toLowerCase();

  if (nodeType === "link") {
    const url = typeof node.url === "string" ? node.url.trim() : "";
    if (!url) return { ...node };

    const exportHtmlPath = await exportLinkNodePage(ctx, node);
    const canvasHref = ctx.exportFormat === "single-html"
      ? exportHtmlPath
      : normalizeExportHref(`assets/files/${exportHtmlPath.split("/").pop() || exportHtmlPath}`);

    return {
      ...node,
      displayName: url,
      exportHtmlPath,
      canvasHref,
    };
  }

  if (nodeType === "text" && node.text) {
    const html = await markdownToHtml(node.text, { darkMode: ctx.darkMode, highlightingTheme: ctx.highlightingTheme });
    const renderedTextHtml = await rewriteMarkdownHtmlAssets(ctx, ctx.canvasFile, html, "inline", "canvas");
    return { ...node, renderedTextHtml };
  }

  if (nodeType !== "file") {
    return { ...node };
  }

  const sourcePath = typeof node.file === "string" ? node.file.trim() : "";
  if (!sourcePath) return { ...node };

  const file = resolveVaultFile(ctx.app, sourcePath);
  if (!isTFile(file)) {
    return { ...node, displayName: sourcePath, fileKind: "file" };
  }

  const ext = file.extension.toLowerCase();

  if (ext === "canvas") {
    if (ctx.canvasFile.path !== ctx.rootCanvasPath && file.path === ctx.rootCanvasPath) {
      return null;
    }
    try {
      const target = await exportCanvasTarget(ctx, file);
      return {
        ...node,
        displayName: file.basename,
        fileKind: "canvas",
        exportHtmlPath: target.outputPath ? target.href : undefined,
        canvasHref: target.href,
        canvasNavigationTarget: canvasNavigationTarget(ctx),
        canvasSourcePath: file.path,
      };
    } catch (error) {
      console.error(`[canvas-html-exporter] Subcanvas export failed for ${file.path}`, error);
      const exportPath = await copyVaultFile(ctx, file, "file");
      return { ...node, displayName: file.basename, fileKind: "file", exportPath };
    }
  }

  if (isImageExt(ext)) {
    const exportPath = await copyVaultFile(ctx, file, "image");
    return {
      ...node,
      displayName: file.name,
      fileKind: "image",
      exportPath,
    };
  }

  if (ext === "md") {
    let exportHtmlPath: string | undefined;
    let previewText: string | undefined;
    let previewHtml: string | undefined;
    let canvasHref: string | undefined;

    try {
      const pageTitle = typeof node.label === "string" && node.label.trim() ? node.label.trim() : file.basename;
      exportHtmlPath = await exportMarkdownNote(ctx, file, pageTitle);
      if (exportHtmlPath) {
        canvasHref = ctx.exportFormat === "single-html"
          ? exportHtmlPath
          : normalizeExportHref(`assets/files/${exportHtmlPath.split("/").pop() || exportHtmlPath}`);
      }
    } catch (error) {
      console.error(`[canvas-html-exporter] Markdown page export failed for ${file.path}`, error);
    }

    try {
      const preview = await buildMarkdownPreview(ctx, file);
      previewText = preview.text;
      previewHtml = preview.html;
    } catch (error) {
      console.error(`[canvas-html-exporter] Markdown preview generation failed for ${file.path}`, error);
    }

    if (exportHtmlPath) {
      return {
        ...node,
        displayName: file.basename,
        fileKind: "markdown",
        exportHtmlPath,
        canvasHref,
        previewText: previewText || undefined,
        previewHtml: previewHtml || undefined,
      };
    }

    const fallbackExportPath = await copyVaultFile(ctx, file, "file");
    return {
      ...node,
      displayName: file.basename,
      fileKind: "file",
      exportPath: fallbackExportPath,
      previewText: previewText || undefined,
      previewHtml: previewHtml || undefined,
    };
  }

  const exportPath = await copyVaultFile(ctx, file, "file");

  if (ext === "pdf") {
    const pdfFilename = ctx.exportFormat === "single-html"
      ? exportPath
      : exportPath.split("/").pop() || "";
    const viewerName = uniqueOutputName(ctx, `${file.basename}-viewer`, "html");
    const viewerPath = joinOutputPath(ctx.outputMode, ctx.assetsFilesDir, viewerName);
    const canvasHrefForViewer = normalizeExportHref(getHrefForMarkdownPage(normalizeExportHref(`assets/files/${viewerName}`), "index.html"));
    const viewerHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="generator" content="${EXPORTER_SIGNATURE}">
  <meta name="canvas-html-exporter-build" content="${EXPORTER_VERSION}-${ctx.highlightingTheme || "shiki"}">
  <title>${escapeHtmlAttr(file.basename)}</title>
  <!-- Exported by ${EXPORTER_SIGNATURE} -->
  <style>
    html,body{margin:0;padding:0;height:100%;}
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f3f5f8;color:#1b2733;}
    .pdf-viewer-toolbar{display:flex;justify-content:flex-end;padding:12px 16px;border-bottom:1px solid #d6dde7;background:#fff;}
    .pdf-viewer-canvas-link{color:#1967d2;text-decoration:none;font-size:0.95em;font-weight:600;}
    .pdf-viewer-canvas-link:hover{text-decoration:underline;}
    iframe{display:block;width:100%;height:calc(100vh - 53px);border:none;}
  </style>
</head>
<body><div class="pdf-viewer-toolbar"><a class="pdf-viewer-canvas-link" href="${escapeHtmlAttr(canvasHrefForViewer)}">Canvas</a></div><iframe src="${escapeHtmlAttr(pdfFilename)}" title="${escapeHtmlAttr(file.basename)}"></iframe></body>
</html>`;
    if (ctx.exportFormat !== "single-html") {
      await writeTextFile(ctx.app, viewerPath, viewerHtml, ctx.outputMode);
    }
    const canvasHref = ctx.exportFormat === "single-html"
      ? registerSingleHtmlPage(
          ctx,
          file.basename,
          "pdf",
          `<div class="single-link-page"><iframe src="${escapeHtmlAttr(pdfFilename)}" title="${escapeHtmlAttr(file.basename)}" loading="lazy"></iframe></div>`,
        )
      : normalizeExportHref(`assets/files/${viewerName}`);
    return {
      ...node,
      displayName: file.name,
      fileKind: "pdf" as const,
      exportPath,
      canvasHref,
    };
  }

  if (isAudioExt(ext) || isVideoExt(ext)) {
    return {
      ...node,
      displayName: file.name,
      fileKind: isAudioExt(ext) ? "audio" as const : "video" as const,
      exportPath,
    };
  }

  return {
    ...node,
    displayName: file.name,
    fileKind: "file" as const,
    exportPath,
  };
}

function attachCanvasPreviews(ctx: MarkdownContext, documents: PreparedCanvasData[]): void {
  const previewCache = new Map<string, CanvasData>();
  for (const document of documents) {
    for (const node of document.nodes) {
      if (node.fileKind !== "canvas" || !node.canvasSourcePath) continue;
      let preview = previewCache.get(node.canvasSourcePath);
      if (!preview) {
        const target = ctx.canvasRegistry.get(node.canvasSourcePath)?.data;
        if (!target) continue;
        preview = projectCanvasPreview(target);
        previewCache.set(node.canvasSourcePath, preview);
      }
      node.canvasPreview = preview;
    }
  }
}

function projectCanvasPreview(data: PreparedCanvasData): CanvasData {
  return {
    nodes: data.nodes.map((node) => ({
      id: node.id,
      type: node.type,
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
      color: node.color,
      shape: node.shape,
      borderStyle: node.borderStyle,
    })),
    edges: data.edges.map((edge) => ({
      id: edge.id,
      fromNode: edge.fromNode,
      toNode: edge.toNode,
      color: edge.color,
    })),
  };
}

async function exportLinkNodePage(ctx: MarkdownContext, node: CanvasNode): Promise<string> {
  const url = typeof node.url === "string" ? node.url.trim() : "";
  const title = typeof node.label === "string" && node.label.trim() ? node.label.trim() : url || "Link";
  if (ctx.exportFormat === "single-html") {
    return registerSingleHtmlPage(ctx, title, "link", buildSingleHtmlLinkPageBody(title, url));
  }
  const outputName = uniqueOutputName(ctx, title || "Link", "html");
  const outputPath = joinOutputPath(ctx.outputMode, ctx.assetsFilesDir, outputName);
  const rel = normalizeExportHref(toExportRelativePath(outputPath, ctx.outputRoot));
  const canvasHref = normalizeExportHref(getHrefForMarkdownPage(rel, "index.html"));
  const html = buildLinkDocumentHtml(title, url, ctx.darkMode, ctx.canvasColors, ctx.highlightingTheme, canvasHref);
  await writeTextFile(ctx.app, outputPath, html, ctx.outputMode);
  return rel;
}

async function exportMarkdownNote(ctx: MarkdownContext, file: TFile, pageTitle?: string): Promise<string> {
  return renderMarkdownFileToHtml(ctx, file, "page", "page", pageTitle);
}

async function exportMarkdownContentInline(
  ctx: MarkdownContext,
  file: TFile,
  linkBase: LinkBase,
): Promise<string> {
  return renderMarkdownFileToHtml(ctx, file, "inline", linkBase);
}

async function exportMarkdownSectionInline(
  ctx: MarkdownContext,
  file: TFile,
  heading: string,
  linkBase: LinkBase,
): Promise<string> {
  const sectionKey = `${file.path}#${heading}`;
  if (ctx.inlineStack.has(sectionKey)) return "";
  ctx.inlineStack.add(sectionKey);
  try {
    const content = stripFrontmatter(await ctx.app.vault.read(file));
    const section = extractMarkdownSection(content, heading);
    if (!section) return "";
    let htmlBody = await markdownToHtml(section, { darkMode: ctx.darkMode, highlightingTheme: ctx.highlightingTheme });
    htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, "inline", linkBase);
    return htmlBody;
  } finally {
    ctx.inlineStack.delete(sectionKey);
  }
}

function extractMarkdownSection(markdown: string, headingRef: string): string {
  if (isBlockReference(headingRef)) {
    return extractMarkdownBlockByRef(markdown, headingRef);
  }
  return extractMarkdownHeadingSection(markdown, headingRef);
}

function extractMarkdownHeadingSection(markdown: string, headingRef: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const ref = normalizeHeadingRef(headingRef);
  if (!ref) return markdown;

  let start = -1;
  let level = 0;

  for (let i = 0; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i] ?? "");
    if (!m) continue;
    const text = m[2].trim();
    if (normalizeHeadingRef(text) === ref) {
      start = i;
      level = m[1].length;
      break;
    }
  }

  if (start < 0) return "";

  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = /^(#{1,6})\s+(.+?)\s*$/.exec(lines[i] ?? "");
    if (!m) continue;
    const nextLevel = m[1].length;
    if (nextLevel <= level) {
      end = i;
      break;
    }
  }

  return lines.slice(start, end).join("\n").trim();
}

function extractMarkdownBlockByRef(markdown: string, blockRef: string): string {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const ref = normalizeBlockRef(blockRef);
  if (!ref) return "";

  for (let i = 0; i < lines.length; i++) {
    if (normalizeBlockRef(lines[i] ?? "") !== ref) continue;

    let start = i - 1;
    while (start >= 0 && !(lines[start] ?? "").trim()) {
      start -= 1;
    }
    if (start < 0) return "";

    let end = i;

    if (/^```/.test((lines[start] ?? "").trim())) {
      let fenceStart = start;
      while (fenceStart > 0) {
        if (/^```/.test((lines[fenceStart - 1] ?? "").trim())) {
          fenceStart -= 1;
          break;
        }
        fenceStart -= 1;
      }
      start = fenceStart;
    } else {
      while (start > 0 && (lines[start - 1] ?? "").trim()) {
        start -= 1;
      }
    }

    return lines.slice(start, end + 1).join("\n").trim();
  }

  return "";
}

function normalizeHeadingRef(value: string): string {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-]+|[-]+$/g, "");
}

function normalizeBlockRef(value: string): string {
  return String(value || "")
    .trim()
    .replace(/^#?\^/, "")
    .toLowerCase();
}

function isBlockReference(value: string): boolean {
  return /^\^/.test(String(value || "").trim());
}

async function renderMarkdownFileToHtml(
  ctx: MarkdownContext,
  file: TFile,
  mode: "page" | "inline",
  linkBase: LinkBase,
  pageTitle?: string,
): Promise<string> {
  const activeStack = mode === "page" ? ctx.pageStack : ctx.inlineStack;
  const cached = mode === "page" ? ctx.htmlMap.get(file.path) : null;

  if (mode === "page" && cached) return cached;

  if (activeStack.has(file.path)) {
    return mode === "page"
      ? normalizeExportHref(ctx.htmlMap.get(file.path) || toExportRelativePath(joinOutputPath(ctx.outputMode, ctx.assetsFilesDir, uniqueOutputName(ctx, file.basename, "html")), ctx.outputRoot))
      : "";
  }

  activeStack.add(file.path);
  try {
    let outputPath = "";
    let rel = "";

    if (mode === "page" && ctx.exportFormat !== "single-html") {
      const outputName = uniqueOutputName(ctx, file.basename, "html");
      outputPath = joinOutputPath(ctx.outputMode, ctx.assetsFilesDir, outputName);
      rel = normalizeExportHref(toExportRelativePath(outputPath, ctx.outputRoot));
      ctx.htmlMap.set(file.path, rel);
    }

    if (mode === "page" && ctx.exportFormat === "single-html") {
      rel = registerSingleHtmlPage(ctx, (pageTitle || file.basename || file.name).trim(), "markdown", "");
      ctx.htmlMap.set(file.path, rel);
    }

    const content = stripFrontmatter(await ctx.app.vault.read(file));
    let htmlBody = await markdownToHtml(content, { darkMode: ctx.darkMode, highlightingTheme: ctx.highlightingTheme });
    htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, mode, linkBase);

    if (mode === "inline") {
      return htmlBody;
    }

    if (ctx.exportFormat === "single-html") {
      const title = (pageTitle || file.basename || file.name).trim();
      const page = ctx.singleHtmlPages.find((entry) => `#page-${entry.id}` === rel);
      if (page) page.bodyHtml = buildSingleHtmlMarkdownPageBody(title, htmlBody);
      return rel;
    }
    const title = (pageTitle || file.basename || file.name).trim();
    const canvasHref = getHrefForMarkdownPage(rel, "index.html");
    const htmlDoc = buildMarkdownDocumentHtml(
      title,
      htmlBody,
      ctx.darkMode,
      ctx.canvasColors,
      ctx.calloutColors,
      ctx.headingColors,
      ctx.inlineStyleColors,
      ctx.highlightingTheme,
      canvasHref,
    );
    await writeTextFile(ctx.app, outputPath, htmlDoc, ctx.outputMode);
    return rel;
  } catch (error) {
    if (mode === "page") {
      const failedHref = ctx.htmlMap.get(file.path);
      ctx.htmlMap.delete(file.path);
      ctx.singleHtmlPages = ctx.singleHtmlPages.filter((page) => `#page-${page.id}` !== failedHref);
    }
    throw error;
  } finally {
    activeStack.delete(file.path);
  }
}

async function rewriteMarkdownHtmlAssets(
  ctx: MarkdownContext,
  sourceFile: TFile,
  html: string,
  mode: "page" | "inline",
  linkBase: LinkBase,
): Promise<string> {
  let result = html;

  const imgMatches = [...result.matchAll(/<img\b([^>]*?)\bsrc="([^"]*)"([^>]*)>/g)];
  for (const match of imgMatches) {
    const original = match[0];
    const leadingAttrs = match[1] || "";
    const target = match[2] || "";
    const trailingAttrs = match[3] || "";
    const { path: targetPath } = splitTargetSuffix(target);
    if (!shouldRewriteInternalTarget(targetPath)) continue;

    const resolved = await exportInternalTarget(ctx, sourceFile, target, true, linkBase);
    if (resolved) {
      const replacement = `<img${leadingAttrs}src="${escapeHtmlAttr(resolved.href)}"${trailingAttrs}>`;
      result = result.replace(original, replacement);
    }
  }

  const linkMatches = [...result.matchAll(/<a\s+href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
  for (const match of linkMatches) {
    const original = match[0];
    const target = match[1] || "";
    if (target.trim().startsWith("#")) {
      const normalizedAnchor = buildMarkdownAnchorSuffix(target.trim().slice(1));
      if (normalizedAnchor) {
        const label = match[3] || "";
        const attrs = match[2] || "";
        const replacement = `<a href="${escapeHtmlAttr(normalizedAnchor)}"${attrs}>${label}</a>`;
        result = result.replace(original, replacement);
      }
      continue;
    }
    const { path: targetPath } = splitTargetSuffix(target);
    if (!shouldRewriteInternalTarget(targetPath)) continue;

    const resolved = await exportInternalTarget(ctx, sourceFile, target, false, linkBase);
    if (resolved) {
      const label = match[3] || "";
      const attrs = match[2] || "";
      const replacement = `<a ${buildPageAnchorAttributes(ctx, resolved.href, resolved.navigationTarget)}${attrs}>${label}</a>`;
      result = result.replace(original, replacement);
    }
  }

  result = await rewriteWikiLinks(ctx, sourceFile, result, mode, linkBase);

  return result;
}

async function rewriteWikiLinks(
  ctx: MarkdownContext,
  sourceFile: TFile,
  html: string,
  mode: "page" | "inline",
  linkBase: LinkBase,
): Promise<string> {
  let result = html;

  const embedMatches = [...result.matchAll(/!\x5b\x5b([^\x5d]+)\x5d\x5d/g)];
  for (const match of embedMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const parsed = parseWikiReference(raw);
    const target = parsed.core;
    if (!target) continue;
    const embedLabel = getEmbedLabel(parsed.display, parsed.size, targetFileName(target));

    const targetFile = resolveLinkedFileForEmbed(ctx, sourceFile, target);
    let replacement = original;

    if (!targetFile) {
      replacement = `<span class="unresolved-link">Unresolved embed: ${escapeHtmlAttr(target)}</span>`;
    } else if (targetFile.extension.toLowerCase() === "md") {
      try {
        if (mode === "page") {
          await exportMarkdownNote(ctx, targetFile);
        }
        replacement = parsedTargetSection(parsed.core)
          ? await exportMarkdownSectionInline(ctx, targetFile, parsedTargetSection(parsed.core)!, linkBase)
          : await exportMarkdownContentInline(ctx, targetFile, linkBase);
        if (!replacement) {
          replacement = `<span class="unresolved-link">Unresolved embed: ${escapeHtmlAttr(target)}</span>`;
        } else {
          replacement = `<div class="md-embed-block">${replacement}</div>`;
        }
      } catch (error) {
        console.error(`[canvas-html-exporter] Markdown embed export failed for ${targetFile.path}`, error);
        replacement = `<span class="unresolved-link">Unresolved embed: ${escapeHtmlAttr(target)}</span>`;
      }
    } else if (isImageExt(targetFile.extension.toLowerCase())) {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, true, false, mode, linkBase);
      if (resolved) {
        replacement = `<img src="${escapeHtmlAttr(resolved.href)}" alt="${escapeHtmlAttr(embedLabel || targetFile.basename || target)}"${embedSizeAttributes(parsed.size)}>`;
      }
    } else {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
      if (resolved) {
        replacement = renderFileEmbed(resolved.href, targetFile, embedLabel || target, parsed.size, ctx, resolved.navigationTarget);
      }
    }

    result = result.replace(original, replacement);
  }

  result = cleanupMarkdownEmbedBlocks(result);

  const wikiMatches = [...result.matchAll(/\x5b\x5b([^\x5d]+)\x5d\x5d/g)];
  for (const match of wikiMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const parsed = parseWikiReference(raw);
    const target = parsed.core;
    const alias = parsed.display || target;
    const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
    if (!resolved) {
      const fallback = `<span class="unresolved-link">Unresolved link: ${escapeHtmlAttr(alias)}</span>`;
      result = result.replace(original, fallback);
      continue;
    }

    const replacement = `<a ${buildPageAnchorAttributes(ctx, resolved.href, resolved.navigationTarget)}>${escapeHtmlAttr(alias)}</a>`;
    result = result.replace(original, replacement);
  }

  return result;
}

function cleanupMarkdownEmbedBlocks(html: string): string {
  return html
    .replace(/<p>\s*(<div class="(?:md|pdf|file|media)-embed-block">[\s\S]*?<\/div>)\s*<\/p>/g, "$1")
    .replace(/<p>([\s\S]*?)<br>\s*(<div class="(?:md|pdf|file|media)-embed-block">[\s\S]*?<\/div>)\s*<\/p>/g, "<p>$1</p>\n$2");
}

function renderFileEmbed(
  href: string,
  file: TFile,
  label: string,
  size: { width?: number; height?: number } | null,
  ctx?: MarkdownContext,
  navigationTarget?: "_parent",
): string {
  const safeHref = escapeHtmlAttr(href);
  const safeLabel = escapeHtmlAttr(label || file.basename || file.name);
  const anchorAttrs = ctx ? buildPageAnchorAttributes(ctx, href, navigationTarget) : `href="${safeHref}" target="_blank" rel="noopener noreferrer"`;

  if (file.extension.toLowerCase() === "pdf") {
    const sizeAttrs = embedSizeAttributes(size);
    return `<div class="pdf-embed-block"><a class="pdf-title-link" ${anchorAttrs}><div class="pdf-title">${safeLabel}</div></a><iframe src="${safeHref}" title="${safeLabel}" loading="lazy"${sizeAttrs}></iframe></div>`;
  }

  if (isAudioExt(file.extension)) {
    return `<div class="media-embed-block audio-embed-block"><audio src="${safeHref}" title="${safeLabel}" controls preload="metadata"></audio></div>`;
  }

  if (isVideoExt(file.extension)) {
    const sizeAttrs = embedSizeAttributes(size);
    return `<div class="media-embed-block video-embed-block"><video src="${safeHref}" title="${safeLabel}" controls preload="metadata"${sizeAttrs}></video></div>`;
  }

  return `<div class="file-embed-block"><a class="file-chip" ${anchorAttrs}>${safeLabel}</a></div>`;
}

function buildPageAnchorAttributes(ctx: MarkdownContext, href: string, navigationTarget?: "_parent"): string {
  const safeHref = escapeHtmlAttr(href);
  if (ctx.exportFormat === "single-html" && href.startsWith("#page-") && !navigationTarget) {
    const pageId = href.replace(/^#page-/, "").split(/[?#]/)[0];
    return `href="${safeHref}" data-inline-page="${escapeHtmlAttr(pageId)}"`;
  }
  return `href="${safeHref}"${navigationTarget ? ` target="${navigationTarget}"` : ""}`;
}

function getEmbedLabel(
  display: string | null,
  size: { width?: number; height?: number } | null,
  fallback: string,
): string {
  const raw = String(display || "").trim();
  if (!raw) return fallback;
  if (size && raw.replace(/\s+/g, "") === formatEmbedSize(size)) {
    return fallback;
  }
  return raw;
}

function formatEmbedSize(size: { width?: number; height?: number } | null): string {
  if (!size) return "";
  if (size.width && size.height) return `${size.width}x${size.height}`;
  if (size.width) return `${size.width}`;
  return "";
}

function targetFileName(target: string): string {
  const cleaned = splitTargetSuffix(normalizeWikiTarget(target)).path;
  const last = cleaned.split("/").pop() || cleaned;
  return last || target;
}

function resolveLinkedFileForEmbed(ctx: MarkdownContext, sourceFile: TFile, target: string): TFile | null {
  const cleaned = splitTargetSuffix(normalizeWikiTarget(target)).path;
  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, cleaned);
  if (!isTFile(resolved)) {
    return null;
  }
  return resolved;
}

async function exportInternalTarget(
  ctx: MarkdownContext,
  sourceFile: TFile,
  rawTarget: string,
  expectImage: boolean,
  linkBase: LinkBase,
): Promise<ResolvedInternalTarget | null> {
  const resolved = await resolveObsidianTarget(ctx, sourceFile, rawTarget, expectImage, false, "page", linkBase);
  if (!resolved) return null;
  return resolved;
}

async function resolveObsidianTarget(
  ctx: MarkdownContext,
  sourceFile: TFile,
  rawTarget: string,
  expectImage: boolean,
  _allowMarkdownEmbed: boolean,
  _mode: "page" | "inline",
  linkBase: LinkBase,
): Promise<ResolvedInternalTarget | null> {
  const parsedTarget = parseWikiReference(rawTarget.trim());
  const target = parsedTarget.core;
  if (!target) return null;
  if (isExternalLink(target)) return { href: target, found: true, kind: "external" };
  if (target.startsWith("#")) {
    const href = buildMarkdownAnchorSuffix(target.slice(1)) || target;
    return { href, found: true, kind: "anchor" };
  }
  if (!shouldRewriteInternalTarget(target)) return null;

  const { path: cleaned, suffix } = splitTargetSuffix(target);
  if (!shouldRewriteInternalTarget(cleaned)) return null;

  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, cleaned);
  if (!isTFile(resolved)) {
    return {
      href: `#missing-${encodeURIComponent(cleaned)}`,
      found: false,
      kind: "missing",
      displayText: cleaned,
    };
  }

  if (resolved.extension.toLowerCase() === "canvas") {
    try {
      const exported = await exportCanvasTarget(ctx, resolved);
      const href = ctx.exportFormat === "single-html"
        ? exported.href
        : linkBase === "page"
        ? getHrefForMarkdownPage(ctx.htmlMap.get(sourceFile.path) || "", exported.href)
        : exported.href;
      return {
        href: `${href}${suffix}`,
        found: true,
        kind: "canvas",
        displayText: resolved.basename,
        navigationTarget: canvasNavigationTarget(ctx),
      };
    } catch (error) {
      console.error(`[canvas-html-exporter] Linked subcanvas export failed for ${resolved.path}`, error);
    }
  }

  if (resolved.extension.toLowerCase() === "md") {
    const cached = ctx.htmlMap.get(resolved.path);
    const exported = cached || await exportMarkdownNote(ctx, resolved);
    const headingSuffix = parsedTargetSection(target);
    const normalizedSuffix = headingSuffix ? buildMarkdownAnchorSuffix(headingSuffix) : suffix;
    const href = ctx.exportFormat === "single-html"
      ? exported
      : linkBase === "page"
      ? getHrefForMarkdownPage(ctx.htmlMap.get(sourceFile.path) || "", exported)
      : `${exported}`;
    return { href: `${href}${normalizedSuffix}`, found: true, kind: "markdown", displayText: resolved.basename };
  }

  const rel = await copyVaultFile(ctx, resolved, expectImage || isImageExt(resolved.extension.toLowerCase()) ? "image" : "file");
  const href = ctx.exportFormat === "single-html"
    ? rel
    : linkBase === "page"
    ? getHrefForMarkdownPage(ctx.htmlMap.get(sourceFile.path) || "", rel)
    : rel;
  return {
    href: `${href}${suffix}`,
    found: true,
    kind: isImageExt(resolved.extension.toLowerCase()) ? "image" : "file",
    displayText: resolved.basename,
  };
}

async function buildMarkdownPreview(ctx: MarkdownContext, file: TFile): Promise<{ text: string; html: string }> {
  const raw = stripFrontmatter(await ctx.app.vault.read(file));
  const previewSource = raw.slice(0, 2000);
  const text = buildPreviewText(raw);

  let html = await markdownToHtml(previewSource, { darkMode: ctx.darkMode, highlightingTheme: ctx.highlightingTheme });
  try {
    html = await rewriteMarkdownHtmlAssets(ctx, file, html, "inline", "canvas");
  } catch (error) {
    console.error(`[canvas-html-exporter] Preview rendering failed for ${file.path}`, error);
    html = await markdownToHtml(previewSource, { darkMode: ctx.darkMode, highlightingTheme: ctx.highlightingTheme });
  }

  return { text, html };
}

async function copyVaultFile(ctx: MarkdownContext, file: TFile, kind: "image" | "file"): Promise<string> {
  const cached = ctx.fileMap.get(file.path);
  if (cached) return cached;

  const bytes = await ctx.app.vault.readBinary(file);
  if (ctx.exportFormat === "single-html") {
    const dataUrl = buildBinaryDataUrl(bytes, getMimeTypeForExtension(file.extension));
    ctx.fileMap.set(file.path, dataUrl);
    return dataUrl;
  }

  const folder = kind === "image" ? ctx.assetsImagesDir : ctx.assetsFilesDir;
  const outputName = uniqueOutputName(ctx, file.basename, file.extension);
  const outputPath = joinOutputPath(ctx.outputMode, folder, outputName);
  await writeBinaryFile(ctx.app, outputPath, bytes, ctx.outputMode);

  const rel = toExportRelativePath(outputPath, ctx.outputRoot);
  ctx.fileMap.set(file.path, rel);
  return rel;
}

function uniqueOutputName(ctx: MarkdownContext, basename: string, extension: string): string {
  ctx.outputCounter.value += 1;
  return buildUniqueOutputName(ctx.outputCounter.value, basename, extension);
}

async function ensureFolderExists(app: App, folderPath: string, outputMode: "vault" | "filesystem"): Promise<void> {
  if (outputMode === "filesystem") {
    if (!folderPath) return;
    const { fs } = requireDesktopNodeApis();
    await fs.mkdir(folderPath, { recursive: true });
    return;
  }

  const parts = normalizePath(folderPath).split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    const existing = app.vault.getAbstractFileByPath(current);
    if (existing) continue;
    try {
      await app.vault.createFolder(current);
    } catch (error) {
      const retry = app.vault.getAbstractFileByPath(current);
      if (!retry) {
        throw error;
      }
    }
  }
}

async function writeTextFile(app: App, filePath: string, content: string, outputMode: "vault" | "filesystem" = "vault"): Promise<void> {
  if (outputMode === "filesystem") {
    const { fs, path } = requireDesktopNodeApis();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
    return;
  }

  const existing = app.vault.getAbstractFileByPath(filePath);
  if (isTFile(existing)) {
    await app.vault.modify(existing, content);
    return;
  }
  await app.vault.create(filePath, content);
}

async function writeBinaryFile(app: App, filePath: string, data: ArrayBuffer, outputMode: "vault" | "filesystem" = "vault"): Promise<void> {
  if (outputMode === "filesystem") {
    const { fs, path } = requireDesktopNodeApis();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, new Uint8Array(data));
    return;
  }

  const existing = app.vault.getAbstractFileByPath(filePath);
  if (isTFile(existing)) {
    await app.vault.modifyBinary(existing, data);
    return;
  }
  await app.vault.createBinary(filePath, data);
}

function resolveVaultFile(app: App, pathLike: string): TAbstractFile | null {
  return app.vault.getAbstractFileByPath(normalizePath(pathLike));
}

function resolveLinkedVaultFile(app: App, sourceFile: TFile, target: string): TAbstractFile | null {
  const normalizedTarget = normalizePath(target);
  const direct = app.vault.getAbstractFileByPath(normalizedTarget);
  if (direct) return direct;

  const folder = sourceFile.parent?.path ?? "";
  if (folder) {
    const relative = normalizePath(`${folder}/${normalizedTarget}`);
    const relFile = app.vault.getAbstractFileByPath(relative);
    if (relFile) return relFile;
  }

  const basename = normalizedTarget.split("/").pop() || normalizedTarget;
  const byName = app.metadataCache.getFirstLinkpathDest(normalizedTarget, sourceFile.path)
    ?? app.metadataCache.getFirstLinkpathDest(basename, sourceFile.path);
  return byName ?? null;
}

function isTFile(value: unknown): value is TFile {
  if (!value || typeof value !== "object") return false;
  const file = value as Record<string, unknown>;
  return (
    typeof file.path === "string" &&
    typeof file.name === "string" &&
    typeof file.basename === "string" &&
    typeof file.extension === "string"
  );
}

function normalizePath(pathLike: string): string {
  return String(pathLike || "")
    .replace(/\\/g, "/")
    .replace(/\/+/g, "/")
    .replace(/\/\.\//g, "/")
    .replace(/^\.\/+/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function isExternalLink(value: string): boolean {
  return /^(https?:|mailto:|file:)/i.test(value);
}

function parsedTargetSection(target: string): string | null {
  const hashIndex = target.indexOf("#");
  if (hashIndex < 0) return null;
  const section = target.slice(hashIndex + 1).trim();
  return section || null;
}

function buildMarkdownAnchorSuffix(section: string): string {
  if (isBlockReference(section)) {
    const blockId = buildBlockAnchorId(section);
    return blockId ? `#${blockId}` : "";
  }
  const headingId = normalizeHeadingRef(section);
  return headingId ? `#${headingId}` : "";
}

function buildLinkDocumentHtml(
  title: string,
  url: string,
  darkMode: boolean,
  canvasColors?: Record<string, string>,
  highlightingTheme?: HighlightingThemeChoice,
  canvasHref?: string,
): string {
  const theme = getLinkPageTheme(darkMode);
  const safeTitle = escapeHtmlAttr(url || title || "Link");
  const safeUrl = escapeHtmlAttr(safeNavigationUrl(url));
  const previewUrl = escapeHtmlAttr(safeWebPreviewUrl(url));
  const canvasColorVars = buildCanvasColorVariables(canvasColors);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="${EXPORTER_SIGNATURE}">
  <meta name="canvas-html-exporter-build" content="${EXPORTER_VERSION}-${highlightingTheme || "shiki"}">
  <title>${safeTitle}</title>
  <!-- Exported by ${EXPORTER_SIGNATURE} -->
  <style>
    :root { ${canvasColorVars} }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; height: 100%; }
    body {
      display: flex;
      flex-direction: column;
      background: ${theme.bodyBackground};
      color: ${theme.text};
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }
    .link-page-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 12px 16px;
      border-bottom: 1px solid ${theme.rule};
      background: ${theme.canvasBackground};
    }
    .link-page-nav {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      min-width: 0;
    }
    .link-page-title {
      color: ${theme.text};
      text-decoration: none;
      font-weight: 700;
      word-break: break-all;
    }
    .link-page-title:hover {
      text-decoration: underline;
    }
    .link-page-canvas-link {
      color: ${theme.text};
      text-decoration: none;
      font-weight: 600;
      white-space: nowrap;
    }
    .link-page-canvas-link:hover {
      text-decoration: underline;
    }
    .link-page-status {
      display: none;
      padding: 10px 16px;
      border-bottom: 1px solid ${theme.rule};
      background: ${theme.nodeBackground};
      color: ${theme.mutedText};
    }
    .link-page-status.is-visible {
      display: block;
    }
    .link-page-body {
      flex: 1 1 auto;
      min-height: 0;
      display: flex;
      flex-direction: column;
      padding: 0;
      background: ${theme.bodyBackground};
    }
    .link-page-preview {
      flex: 1 1 auto;
      min-height: 0;
      background: ${theme.canvasBackground};
    }
    .link-page-preview iframe {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100%;
      border: none;
      background: ${theme.canvasBackground};
    }
    .link-page-preview[hidden] {
      display: none;
    }
    .link-page-fallback {
      display: none;
      flex: 1 1 auto;
      min-height: 0;
      padding: 24px 16px;
      justify-content: center;
      align-items: center;
    }
    .link-page-fallback.is-visible {
      display: flex;
    }
    .link-page-card {
      max-width: 720px;
      width: 100%;
      padding: 24px;
      border-radius: 16px;
      border: 1px solid ${theme.rule};
      background: ${theme.canvasBackground};
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .link-page-card p {
      margin: 0;
      line-height: 1.55;
      color: ${theme.mutedText};
    }
    .link-page-card p + p {
      margin-top: 0.9em;
    }
    mark.search-highlight {
      background: rgba(255, 214, 10, 0.45);
      color: inherit;
      padding: 0 0.08em;
      border-radius: 3px;
    }
  </style>
</head>
<body>
  <div class="link-page-toolbar">
    <div class="link-page-nav">
      <a class="link-page-title" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a>
    </div>
    ${canvasHref ? `<a class="link-page-canvas-link" href="${escapeHtmlAttr(canvasHref)}">Canvas</a>` : ""}
  </div>
  <div id="link-status" class="link-page-status"></div>
  <div class="link-page-body">
    <div id="link-preview" class="link-page-preview">
      <iframe id="link-preview-frame" src="${previewUrl}" title="${safeTitle}" loading="lazy"></iframe>
    </div>
    <div id="link-fallback" class="link-page-fallback">
      <div class="link-page-card">
        <p>Use the link above if the website blocks embedding or if you want to open the page in its own browser tab.</p>
        <p>If there is no internet connection, only the direct link remains available.</p>
      </div>
    </div>
  </div>
  <script>
    (() => {
      const status = document.getElementById("link-status");
      const preview = document.getElementById("link-preview");
      const fallback = document.getElementById("link-fallback");
      const frame = document.getElementById("link-preview-frame");
      let frameLoaded = false;

      function showStatus(message) {
        if (!status) return;
        status.textContent = message;
        status.classList.add("is-visible");
      }

      function hideStatus() {
        if (!status) return;
        status.textContent = "";
        status.classList.remove("is-visible");
      }

      function showFallback() {
        if (preview) preview.hidden = true;
        if (fallback) fallback.classList.add("is-visible");
      }

      function showPreview() {
        if (preview) preview.hidden = false;
        if (fallback) fallback.classList.remove("is-visible");
      }

      function syncState() {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (offline) {
          showStatus("No internet connection is available.");
          showFallback();
          return;
        }
        hideStatus();
        showPreview();
      }

      if (frame) {
        frame.addEventListener("load", () => {
          frameLoaded = true;
          if (typeof navigator !== "undefined" && navigator.onLine !== false) {
            hideStatus();
            showPreview();
          }
        });
      }

      syncState();
      window.setTimeout(() => {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (!offline && !frameLoaded) {
          showStatus("This website may not allow embedded previews. Use the link above.");
          showFallback();
        }
      }, 4000);
      window.addEventListener("online", syncState);
      window.addEventListener("offline", syncState);

      const query = (new URLSearchParams(window.location.search).get("q") || "").trim();
      if (query && status) {
        status.textContent = "Search term: ";
        const mark = document.createElement("mark");
        mark.className = "search-highlight";
        mark.textContent = query;
        status.appendChild(mark);
        status.classList.add("is-visible");
      }
    })();
  </script>
</body>
</html>`;
}

function buildSingleHtmlMarkdownPageBody(title: string, bodyHtml: string): string {
  return `<article class="md-page"><h1>${escapeHtml(title)}</h1>${bodyHtml}</article>`;
}

function buildSingleHtmlLinkPageBody(title: string, url: string): string {
  const safeTitle = escapeHtmlAttr(title || url || "Link");
  const safeUrl = escapeHtmlAttr(safeNavigationUrl(url));
  const previewUrl = escapeHtmlAttr(safeWebPreviewUrl(url));
  return `<section class="single-link-page">
    <a class="link-page-title" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeTitle}</a>
    <div class="link-page-note">Use the link above if the website blocks embedding or if you want to open the page in its own browser tab.</div>
    <iframe src="${previewUrl}" title="${safeTitle}" loading="lazy"></iframe>
  </section>`;
}

function getLinkPageTheme(darkMode: boolean): {
  bodyBackground: string;
  canvasBackground: string;
  nodeBackground: string;
  text: string;
  mutedText: string;
  rule: string;
} {
  return darkMode
    ? {
        bodyBackground: "#15181d",
        canvasBackground: "#1d2229",
        nodeBackground: "#2b2f36",
        text: "#e7edf5",
        mutedText: "#aeb8c5",
        rule: "#404855",
      }
    : {
        bodyBackground: "#f3f5f8",
        canvasBackground: "#ffffff",
        nodeBackground: "#ffffff",
        text: "#1b2733",
        mutedText: "#5a6573",
        rule: "#d6dde7",
      };
}

function isImageExt(ext: string): boolean {
  return ["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp"].includes(ext.toLowerCase());
}

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeHtml(value: string): string {
  return escapeHtmlAttr(value).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function resolveBaseFolder(outputDir: string, outputMode: "vault" | "filesystem"): string {
  if (outputMode === "filesystem") {
    const { path } = requireDesktopNodeApis();
    return path.resolve(outputDir);
  }

  const normalized = String(outputDir || "").trim();
  if (normalized === "/" || normalized === ".") return "";
  return normalizeFolder(normalized);
}

function joinOutputPath(outputMode: "vault" | "filesystem", ...parts: string[]): string {
  if (outputMode === "filesystem") {
    const { path } = requireDesktopNodeApis();
    return path.join(...parts.filter(Boolean));
  }
  return normalizePath(parts.filter(Boolean).join("/"));
}
