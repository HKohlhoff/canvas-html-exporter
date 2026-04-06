import { App, normalizePath, TAbstractFile, TFile } from "obsidian";
import { buildMarkdownDocumentHtml, CanvasData, CanvasNode, ExportOptions, markdownToHtml } from "./converter";

export type ExportSettings = {
  darkMode: boolean;
  outputDir: string;
};

type PreparedCanvasData = CanvasData;

type MarkdownContext = {
  app: App;
  outputRoot: string;
  assetsFilesDir: string;
  assetsImagesDir: string;
  darkMode: boolean;
  fileMap: Map<string, string>;
  htmlMap: Map<string, string>;
  counter: number;
  pageStack: Set<string>;
  inlineStack: Set<string>;
};

type LinkBase = "canvas" | "page";

type ResolvedInternalTarget = {
  href: string;
  found: boolean;
  kind: "markdown" | "image" | "file" | "external" | "anchor" | "missing";
  displayText?: string;
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

export async function exportCanvasPackage(
  app: App,
  canvasFile: TFile,
  settings: ExportSettings,
): Promise<{ folderPath: string; data: PreparedCanvasData; options: ExportOptions }> {
  const rawContent = await app.vault.read(canvasFile);
  const parsed = JSON.parse(rawContent) as Partial<CanvasData>;

  const baseFolder = normalizeFolder(settings.outputDir);
  await ensureFolderExists(app, baseFolder);

  const exportFolder = normalizePath(`${baseFolder}/${safeSegment(canvasFile.basename)}`);
  const assetsDir = normalizePath(`${exportFolder}/assets`);
  const imagesDir = normalizePath(`${assetsDir}/images`);
  const filesDir = normalizePath(`${assetsDir}/files`);

  await ensureFolderExists(app, exportFolder);
  await ensureFolderExists(app, assetsDir);
  await ensureFolderExists(app, imagesDir);
  await ensureFolderExists(app, filesDir);

  const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
  const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
  const title = typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : canvasFile.basename;

  const ctx: MarkdownContext = {
    app,
    outputRoot: exportFolder,
    assetsFilesDir: filesDir,
    assetsImagesDir: imagesDir,
    darkMode: settings.darkMode,
    fileMap: new Map<string, string>(),
    htmlMap: new Map<string, string>(),
    counter: 0,
    pageStack: new Set<string>(),
    inlineStack: new Set<string>(),
  };

  const preparedNodes: CanvasNode[] = [];
  for (const node of nodes as CanvasNode[]) {
    preparedNodes.push(await prepareNode(ctx, node));
  }

  return {
    folderPath: exportFolder,
    data: { nodes: preparedNodes, edges, name: title },
    options: { darkMode: settings.darkMode, title },
  };
}

async function prepareNode(ctx: MarkdownContext, node: CanvasNode): Promise<CanvasNode> {
  if ((node.type || "").toLowerCase() !== "file") {
    return { ...node };
  }

  const sourcePath = typeof node.file === "string" ? node.file.trim() : "";
  if (!sourcePath) return { ...node };

  const file = resolveVaultFile(ctx.app, sourcePath);
  if (!(file instanceof TFile)) {
    return { ...node, displayName: sourcePath, fileKind: "file" };
  }

  const ext = file.extension.toLowerCase();

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
      exportHtmlPath = await exportMarkdownNote(ctx, file);
      if (exportHtmlPath) {
        const outputName = exportHtmlPath.split("/").pop() || exportHtmlPath;
        canvasHref = normalizeExportHref(`assets/files/${outputName}`);
      }
    } catch (error) {
      console.error(`[canvas-exporter] Markdown-Seitenexport fehlgeschlagen für ${file.path}`, error);
    }

    try {
      const preview = await buildMarkdownPreview(ctx, file);
      previewText = preview.text;
      previewHtml = preview.html;
    } catch (error) {
      console.error(`[canvas-exporter] Markdown-Vorschau fehlgeschlagen für ${file.path}`, error);
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
  return {
    ...node,
    displayName: file.name,
    fileKind: ext === "pdf" ? "pdf" : "file",
    exportPath,
  };
}

async function exportMarkdownNote(ctx: MarkdownContext, file: TFile): Promise<string> {
  return renderMarkdownFileToHtml(ctx, file, "page", "page");
}

async function exportMarkdownContentInline(ctx: MarkdownContext, file: TFile): Promise<string> {
  return renderMarkdownFileToHtml(ctx, file, "inline", "canvas");
}

async function renderMarkdownFileToHtml(
  ctx: MarkdownContext,
  file: TFile,
  mode: "page" | "inline",
  linkBase: LinkBase,
): Promise<string> {
  const activeStack = mode === "page" ? ctx.pageStack : ctx.inlineStack;
  const cached = mode === "page" ? ctx.htmlMap.get(file.path) : null;

  if (mode === "page" && cached) return cached;

  if (activeStack.has(file.path)) {
    return mode === "page"
      ? toExportRelativePath(`${ctx.assetsFilesDir}/${uniqueOutputName(ctx, file.basename, "html")}`, ctx.outputRoot)
      : "";
  }

  activeStack.add(file.path);
  try {
    const content = stripFrontmatter(await ctx.app.vault.read(file));
    let htmlBody = markdownToHtml(content);
    htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, mode, linkBase);

    if (mode === "inline") {
      return htmlBody;
    }

    const outputName = uniqueOutputName(ctx, file.basename, "html");
    const outputPath = normalizePath(`${ctx.assetsFilesDir}/${outputName}`);
    const title = file.basename;
    const htmlDoc = buildMarkdownDocumentHtml(title, htmlBody, ctx.darkMode);
    await writeTextFile(ctx.app, outputPath, htmlDoc);

    const rel = normalizeExportHref(toExportRelativePath(outputPath, ctx.outputRoot));
    ctx.htmlMap.set(file.path, rel);
    return rel;
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

  const imgMatches = [...result.matchAll(/<img\s+src="([^"]+)"\s+alt="([^"]*)">/g)];
  for (const match of imgMatches) {
    const original = match[0];
    const target = match[1] || "";
    const { path: targetPath } = splitTargetSuffix(target);
    if (!shouldRewriteInternalTarget(targetPath)) continue;

    const resolved = await exportInternalTarget(ctx, sourceFile, target, true, linkBase);
    if (resolved) {
      const replacement = `<img src="${escapeHtmlAttr(resolved.href)}" alt="${escapeHtmlAttr(match[2] || "")}">`;
      result = result.replace(original, replacement);
    }
  }

  const linkMatches = [...result.matchAll(/<a\s+href="([^"]+)"([^>]*)>([\s\S]*?)<\/a>/g)];
  for (const match of linkMatches) {
    const original = match[0];
    const target = match[1] || "";
    const { path: targetPath } = splitTargetSuffix(target);
    if (!shouldRewriteInternalTarget(targetPath)) continue;

    const resolved = await exportInternalTarget(ctx, sourceFile, target, false, linkBase);
    if (resolved) {
      const label = match[3] || "";
      const attrs = match[2] || "";
      const replacement = `<a href="${escapeHtmlAttr(resolved.href)}"${attrs}>${label}</a>`;
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

  const embedMatches = [...result.matchAll(/!\[\[([^\]]+)\]\]/g)];
  for (const match of embedMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const target = normalizeWikiTarget(raw);
    if (!target) continue;

    const targetFile = resolveLinkedFileForEmbed(ctx, sourceFile, target);
    let replacement = original;

    if (!targetFile) {
      replacement = `<span class="unresolved-link">Nicht auflösbarer Embed: ${escapeHtmlAttr(target)}</span>`;
    } else if (targetFile.extension.toLowerCase() === "md") {
      try {
        if (mode === "page") {
          await exportMarkdownNote(ctx, targetFile);
        }
        replacement = await exportMarkdownContentInline(ctx, targetFile);
      } catch (error) {
        console.error(`[canvas-exporter] Markdown-Embed-Export fehlgeschlagen für ${targetFile.path}`, error);
        replacement = `<span class="unresolved-link">Nicht auflösbarer Embed: ${escapeHtmlAttr(target)}</span>`;
      }
    } else if (isImageExt(targetFile.extension.toLowerCase())) {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, true, false, mode, linkBase);
      if (resolved) {
        replacement = `<img src="${escapeHtmlAttr(resolved.href)}" alt="${escapeHtmlAttr(target)}">`;
      }
    } else {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
      if (resolved) {
        replacement = `<a href="${escapeHtmlAttr(resolved.href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlAttr(target)}</a>`;
      }
    }

    result = result.replace(original, replacement);
  }

  const wikiMatches = [...result.matchAll(/\[\[([^\]]+)\]\]/g)];
  for (const match of wikiMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const target = normalizeWikiTarget(raw);
    const alias = extractWikiAlias(raw) || target;
    const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
    if (!resolved) {
      const fallback = `<span class="unresolved-link">Nicht auflösbarer Link: ${escapeHtmlAttr(alias)}</span>`;
      result = result.replace(original, fallback);
      continue;
    }

    const replacement = `<a href="${escapeHtmlAttr(resolved.href)}" target="_blank" rel="noopener noreferrer">${escapeHtmlAttr(alias)}</a>`;
    result = result.replace(original, replacement);
  }

  return result;
}

function resolveLinkedFileForEmbed(ctx: MarkdownContext, sourceFile: TFile, target: string): TFile | null {
  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, normalizeWikiTarget(target));
  if (!(resolved instanceof TFile)) {
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
  allowMarkdownEmbed: boolean,
  mode: "page" | "inline",
  linkBase: LinkBase,
): Promise<ResolvedInternalTarget | null> {
  const target = normalizeWikiTarget(rawTarget.trim());
  if (!target) return null;
  if (!shouldRewriteInternalTarget(target)) return null;
  if (isExternalLink(target)) return { href: target, found: true, kind: "external" };
  if (target.startsWith("#")) return { href: target, found: true, kind: "anchor" };

  const { path: cleaned, suffix } = splitTargetSuffix(target);
  if (!shouldRewriteInternalTarget(cleaned)) return null;

  const resolved = resolveLinkedVaultFile(ctx.app, sourceFile, cleaned);
  if (!(resolved instanceof TFile)) {
    return {
      href: `#missing-${encodeURIComponent(cleaned)}`,
      found: false,
      kind: "missing",
      displayText: cleaned,
    };
  }

  if (resolved.extension.toLowerCase() === "md") {
    const cached = ctx.htmlMap.get(resolved.path);
    const exported = cached || await exportMarkdownNote(ctx, resolved);
    const href = linkBase === "page"
      ? getHrefForMarkdownPage(ctx.outputRoot, exported)
      : `${exported}`;
    return { href: `${href}${suffix}`, found: true, kind: "markdown", displayText: resolved.basename };
  }

  const rel = await copyVaultFile(ctx, resolved, expectImage || isImageExt(resolved.extension.toLowerCase()) ? "image" : "file");
  return {
    href: `${rel}${suffix}`,
    found: true,
    kind: isImageExt(resolved.extension.toLowerCase()) ? "image" : "file",
    displayText: resolved.basename,
  };
}

function getHrefForMarkdownPage(currentHtmlPath: string, targetHtmlPath: string): string {
  const currentDir = normalizePath(currentHtmlPath).split("/").slice(0, -1).join("/");
  const target = normalizePath(targetHtmlPath);
  const relative = currentDir ? pathRelative(currentDir, target) : target;
  return normalizeExportHref(relative);
}

function pathRelative(fromDir: string, toPath: string): string {
  const fromParts = normalizePath(fromDir).split("/").filter(Boolean);
  const toParts = normalizePath(toPath).split("/").filter(Boolean);

  while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
    fromParts.shift();
    toParts.shift();
  }

  const up = "../".repeat(fromParts.length);
  return `${up}${toParts.join("/")}`;
}

async function buildMarkdownPreview(ctx: MarkdownContext, file: TFile): Promise<{ text: string; html: string }> {
  const raw = stripFrontmatter(await ctx.app.vault.read(file));
  const previewSource = raw.slice(0, 2000);
  const text = raw
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

  let html = markdownToHtml(previewSource);
  try {
    html = await rewriteMarkdownHtmlAssets(ctx, file, html, "inline", "canvas");
  } catch (error) {
    console.error(`[canvas-exporter] Vorschau-Render fehlgeschlagen für ${file.path}`, error);
    html = markdownToHtml(previewSource);
  }

  return { text, html };
}

async function copyVaultFile(ctx: MarkdownContext, file: TFile, kind: "image" | "file"): Promise<string> {
  const cached = ctx.fileMap.get(file.path);
  if (cached) return cached;

  const folder = kind === "image" ? ctx.assetsImagesDir : ctx.assetsFilesDir;
  const outputName = uniqueOutputName(ctx, file.basename, file.extension);
  const outputPath = normalizePath(`${folder}/${outputName}`);
  const bytes = await ctx.app.vault.readBinary(file);
  await writeBinaryFile(ctx.app, outputPath, bytes);

  const rel = toExportRelativePath(outputPath, ctx.outputRoot);
  ctx.fileMap.set(file.path, rel);
  return rel;
}

function uniqueOutputName(ctx: MarkdownContext, basename: string, extension: string): string {
  ctx.counter += 1;
  const safeBase = safeSegment(basename);
  const ext = extension.startsWith(".") ? extension.slice(1) : extension;
  return `${String(ctx.counter).padStart(3, "0")}_${safeBase}.${ext}`;
}

function safeSegment(value: string): string {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return normalized || "item";
}

function normalizeFolder(dir: string): string {
  const cleaned = dir.trim().replace(/^\/+|\/+$/g, "");
  return cleaned || "Canvas-Exports";
}

function toExportRelativePath(targetPath: string, rootPath: string): string {
  const targetParts = normalizePath(targetPath).split("/").filter(Boolean);
  const rootParts = normalizePath(rootPath).split("/").filter(Boolean);
  if (targetParts.length <= rootParts.length) return targetParts.join("/");
  return targetParts.slice(rootParts.length).join("/");
}

async function ensureFolderExists(app: App, folderPath: string): Promise<void> {
  const parts = normalizePath(folderPath).split("/").filter(Boolean);
  let current = "";
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    if (!(await app.vault.adapter.exists(current))) {
      await app.vault.createFolder(current);
    }
  }
}

async function writeTextFile(app: App, filePath: string, content: string): Promise<void> {
  const existing = app.vault.getAbstractFileByPath(filePath);
  if (existing instanceof TFile) {
    await app.vault.modify(existing, content);
    return;
  }
  await app.vault.create(filePath, content);
}

async function writeBinaryFile(app: App, filePath: string, data: ArrayBuffer): Promise<void> {
  const existing = app.vault.getAbstractFileByPath(filePath);
  if (existing instanceof TFile) {
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

function isExternalLink(value: string): boolean {
  return /^(https?:|mailto:|file:|javascript:)/i.test(value);
}

function shouldRewriteInternalTarget(target: string): boolean {
  const cleaned = target.trim();
  if (!cleaned) return false;
  if (isExternalLink(cleaned)) return false;
  if (cleaned.startsWith("#")) return false;
  if (cleaned.startsWith("assets/files/") || cleaned.startsWith("assets/images/")) return false;

  const lower = cleaned.toLowerCase();
  if (
    lower.endsWith(".html") ||
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".svg") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".bmp") ||
    lower.endsWith(".pdf")
  ) {
    return false;
  }

  return true;
}

function splitTargetSuffix(value: string): { path: string; suffix: string } {
  const hashIndex = value.indexOf("#");
  const queryIndex = value.indexOf("?");
  let cut = -1;
  if (hashIndex >= 0 && queryIndex >= 0) cut = Math.min(hashIndex, queryIndex);
  else cut = Math.max(hashIndex, queryIndex);
  if (cut < 0) return { path: value, suffix: "" };
  return { path: value.slice(0, cut), suffix: value.slice(cut) };
}

function normalizeWikiTarget(value: string): string {
  let out = value.trim();
  if (!out) return out;
  if (out.startsWith("![[") && out.endsWith("]]")) {
    out = out.slice(3, -2);
  } else if (out.startsWith("[[") && out.endsWith("]]")) {
    out = out.slice(2, -2);
  }
  return out.trim();
}

function extractWikiAlias(value: string): string | null {
  const pipeIndex = value.indexOf("|");
  if (pipeIndex < 0) return null;
  const alias = value.slice(pipeIndex + 1).trim();
  return alias || null;
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
