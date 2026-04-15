import type { App, TAbstractFile, TFile } from "obsidian";
import { buildBlockAnchorId, buildMarkdownDocumentHtml, CanvasData, CanvasNode, ExportOptions, markdownToHtml } from "./converter";
import { buildUniqueOutputName, normalizeFolder, safeSegment, toExportRelativePath } from "./export-file-helpers";
import { normalizeCanvasData, shouldRewriteInternalTarget } from "./exporter-helpers";
import { embedSizeAttributes, normalizeWikiTarget, parseWikiReference, splitTargetSuffix } from "./link-helpers";
import { getHrefForMarkdownPage } from "./path-helpers";
import { buildPreviewText } from "./preview-helpers";

export type ExportSettings = {
  darkMode: boolean;
  outputDir: string;
  canvasColors?: Record<string, string>;
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
  canvasColors?: Record<string, string>;
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
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawContent);
  } catch (error) {
    throw new Error(`Ungültiges Canvas-JSON in ${canvasFile.path}`);
  }

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

  const normalized = normalizeCanvasData(parsed, canvasFile.basename);
  const nodes = normalized.nodes;
  const edges = normalized.edges;
  const title = normalized.name || canvasFile.basename;

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
    canvasColors: settings.canvasColors,
  };

  const preparedNodes: CanvasNode[] = [];
  for (const node of nodes) {
    preparedNodes.push(await prepareNode(ctx, node));
  }

  const nodeIds = new Set(preparedNodes.map((node) => node.id));
  const preparedEdges = edges.filter((edge) => nodeIds.has(edge.fromNode) && nodeIds.has(edge.toNode));

  return {
    folderPath: exportFolder,
    data: { nodes: preparedNodes, edges: preparedEdges, name: title },
    options: { darkMode: settings.darkMode, title },
  };
}

async function prepareNode(ctx: MarkdownContext, node: CanvasNode): Promise<CanvasNode> {
  const nodeType = (node.type || "").toLowerCase();

  if (nodeType === "link") {
    const url = typeof node.url === "string" ? node.url.trim() : "";
    if (!url) return { ...node };

    const exportHtmlPath = await exportLinkNodePage(ctx, node);
    const outputName = exportHtmlPath.split("/").pop() || exportHtmlPath;
    const canvasHref = normalizeExportHref(`assets/files/${outputName}`);

    return {
      ...node,
      displayName: url,
      exportHtmlPath,
      canvasHref,
    };
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

  if (ext === "pdf") {
    const pdfFilename = exportPath.split("/").pop() || "";
    const viewerName = pdfFilename.replace(/\.pdf$/i, "-viewer.html");
    const viewerPath = normalizePath(`${ctx.assetsFilesDir}/${viewerName}`);
    const viewerHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtmlAttr(file.basename)}</title>
  <style>html,body{margin:0;padding:0;height:100%;}iframe{display:block;width:100%;height:100vh;border:none;}</style>
</head>
<body><iframe src="${escapeHtmlAttr(pdfFilename)}" title="${escapeHtmlAttr(file.basename)}"></iframe></body>
</html>`;
    await writeTextFile(ctx.app, viewerPath, viewerHtml);
    const canvasHref = normalizeExportHref(`assets/files/${viewerName}`);
    return {
      ...node,
      displayName: file.name,
      fileKind: "pdf" as const,
      exportPath,
      canvasHref,
    };
  }

  return {
    ...node,
    displayName: file.name,
    fileKind: "file" as const,
    exportPath,
  };
}

async function exportLinkNodePage(ctx: MarkdownContext, node: CanvasNode): Promise<string> {
  const url = typeof node.url === "string" ? node.url.trim() : "";
  const title = typeof node.label === "string" && node.label.trim() ? node.label.trim() : url || "Link";
  const outputName = uniqueOutputName(ctx, title || "Link", "html");
  const outputPath = normalizePath(`${ctx.assetsFilesDir}/${outputName}`);
  const rel = normalizeExportHref(toExportRelativePath(outputPath, ctx.outputRoot));
  const html = buildLinkDocumentHtml(title, url, ctx.darkMode, ctx.canvasColors);
  await writeTextFile(ctx.app, outputPath, html);
  return rel;
}

async function exportMarkdownNote(ctx: MarkdownContext, file: TFile): Promise<string> {
  return renderMarkdownFileToHtml(ctx, file, "page", "page");
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
  const content = stripFrontmatter(await ctx.app.vault.read(file));
  const section = extractMarkdownSection(content, heading);
  if (!section) return "";
  let htmlBody = markdownToHtml(section);
  htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, "inline", linkBase);
  return htmlBody;
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
): Promise<string> {
  const activeStack = mode === "page" ? ctx.pageStack : ctx.inlineStack;
  const cached = mode === "page" ? ctx.htmlMap.get(file.path) : null;

  if (mode === "page" && cached) return cached;

  if (activeStack.has(file.path)) {
    return mode === "page"
      ? normalizeExportHref(ctx.htmlMap.get(file.path) || toExportRelativePath(`${ctx.assetsFilesDir}/${uniqueOutputName(ctx, file.basename, "html")}`, ctx.outputRoot))
      : "";
  }

  activeStack.add(file.path);
  try {
    let outputPath = "";
    let rel = "";

    if (mode === "page") {
      const outputName = uniqueOutputName(ctx, file.basename, "html");
      outputPath = normalizePath(`${ctx.assetsFilesDir}/${outputName}`);
      rel = normalizeExportHref(toExportRelativePath(outputPath, ctx.outputRoot));
      ctx.htmlMap.set(file.path, rel);
    }

    const content = stripFrontmatter(await ctx.app.vault.read(file));
    let htmlBody = markdownToHtml(content);
    htmlBody = await rewriteMarkdownHtmlAssets(ctx, file, htmlBody, mode, linkBase);

    if (mode === "inline") {
      return htmlBody;
    }

    const title = file.basename;
    const htmlDoc = buildMarkdownDocumentHtml(title, htmlBody, ctx.darkMode, ctx.canvasColors);
    await writeTextFile(ctx.app, outputPath, htmlDoc);

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
    const parsed = parseWikiReference(raw);
    const target = parsed.core;
    if (!target) continue;
    const embedLabel = getEmbedLabel(parsed.display, parsed.size, targetFileName(target));

    const targetFile = resolveLinkedFileForEmbed(ctx, sourceFile, target);
    let replacement = original;

    if (!targetFile) {
      replacement = `<span class="unresolved-link">Nicht auflösbarer Embed: ${escapeHtmlAttr(target)}</span>`;
    } else if (targetFile.extension.toLowerCase() === "md") {
      try {
        if (mode === "page") {
          await exportMarkdownNote(ctx, targetFile);
        }
        replacement = parsedTargetSection(parsed.core)
          ? await exportMarkdownSectionInline(ctx, targetFile, parsedTargetSection(parsed.core)!, linkBase)
          : await exportMarkdownContentInline(ctx, targetFile, linkBase);
        if (!replacement) {
          replacement = `<span class="unresolved-link">Nicht auflösbarer Embed: ${escapeHtmlAttr(target)}</span>`;
        } else {
          replacement = `<div class="md-embed-block">${replacement}</div>`;
        }
      } catch (error) {
        console.error(`[canvas-exporter] Markdown-Embed-Export fehlgeschlagen für ${targetFile.path}`, error);
        replacement = `<span class="unresolved-link">Nicht auflösbarer Embed: ${escapeHtmlAttr(target)}</span>`;
      }
    } else if (isImageExt(targetFile.extension.toLowerCase())) {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, true, false, mode, linkBase);
      if (resolved) {
        replacement = `<img src="${escapeHtmlAttr(resolved.href)}" alt="${escapeHtmlAttr(embedLabel || targetFile.basename || target)}"${embedSizeAttributes(parsed.size)}>`;
      }
    } else {
      const resolved = await resolveObsidianTarget(ctx, sourceFile, target, false, false, mode, linkBase);
      if (resolved) {
        replacement = renderFileEmbed(resolved.href, targetFile, embedLabel || target, parsed.size);
      }
    }

    result = result.replace(original, replacement);
  }

  result = cleanupMarkdownEmbedBlocks(result);

  const wikiMatches = [...result.matchAll(/\[\[([^\]]+)\]\]/g)];
  for (const match of wikiMatches) {
    const original = match[0];
    const raw = match[1] || "";
    const parsed = parseWikiReference(raw);
    const target = parsed.core;
    const alias = parsed.display || target;
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

function cleanupMarkdownEmbedBlocks(html: string): string {
  return html
    .replace(/<p>\s*(<div class="(?:md|pdf|file)-embed-block">[\s\S]*?<\/div>)\s*<\/p>/g, "$1")
    .replace(/<p>([\s\S]*?)<br>\s*(<div class="(?:md|pdf|file)-embed-block">[\s\S]*?<\/div>)\s*<\/p>/g, "<p>$1</p>\n$2");
}

function renderFileEmbed(
  href: string,
  file: TFile,
  label: string,
  size: { width?: number; height?: number } | null,
): string {
  const safeHref = escapeHtmlAttr(href);
  const safeLabel = escapeHtmlAttr(label || file.basename || file.name);

  if (file.extension.toLowerCase() === "pdf") {
    const sizeAttrs = embedSizeAttributes(size);
    return `<div class="pdf-embed-block"><a class="pdf-title-link" href="${safeHref}" target="_blank" rel="noopener noreferrer"><div class="pdf-title">${safeLabel}</div></a><iframe src="${safeHref}" title="${safeLabel}" loading="lazy"${sizeAttrs}></iframe></div>`;
  }

  return `<div class="file-embed-block"><a class="file-chip" href="${safeHref}" target="_blank" rel="noopener noreferrer">${safeLabel}</a></div>`;
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
  allowMarkdownEmbed: boolean,
  mode: "page" | "inline",
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

  if (resolved.extension.toLowerCase() === "md") {
    const cached = ctx.htmlMap.get(resolved.path);
    const exported = cached || await exportMarkdownNote(ctx, resolved);
    const headingSuffix = parsedTargetSection(target);
    const normalizedSuffix = headingSuffix ? buildMarkdownAnchorSuffix(headingSuffix) : suffix;
    const href = linkBase === "page"
      ? getHrefForMarkdownPage(ctx.htmlMap.get(sourceFile.path) || "", exported)
      : `${exported}`;
    return { href: `${href}${normalizedSuffix}`, found: true, kind: "markdown", displayText: resolved.basename };
  }

  const rel = await copyVaultFile(ctx, resolved, expectImage || isImageExt(resolved.extension.toLowerCase()) ? "image" : "file");
  const href = linkBase === "page"
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
  return buildUniqueOutputName(ctx.counter, basename, extension);
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
  if (isTFile(existing)) {
    await app.vault.modify(existing, content);
    return;
  }
  await app.vault.create(filePath, content);
}

async function writeBinaryFile(app: App, filePath: string, data: ArrayBuffer): Promise<void> {
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

function buildLinkDocumentHtml(title: string, url: string, darkMode: boolean, canvasColors?: Record<string, string>): string {
  const safeTitle = escapeHtmlAttr(url || title || "Link");
  const safeUrl = escapeHtmlAttr(url);
  let page = buildMarkdownDocumentHtml(
    url || title || "Link",
    `<section class="link-page-card">
      <div id="offline-message" class="link-page-offline" hidden>
        <p class="link-page-note">Es besteht keine Internetverbindung.</p>
        <p><a class="file-chip" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a></p>
      </div>
      <div id="blocked-message" class="link-page-offline" hidden>
        <p class="link-page-note">Diese Website erlaubt keine Anzeige im eingebetteten Frame.</p>
        <p><a class="file-chip" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeUrl}</a></p>
      </div>
      <div id="link-preview" class="pdf-embed-block link-page-preview">
        <iframe id="link-preview-frame" src="${safeUrl}" title="${safeTitle}" loading="lazy"></iframe>
      </div>
    </section>`,
    darkMode,
    canvasColors,
  );

  page = page.replace(
    "</style>",
    `
    .link-page-card { display: flex; flex-direction: column; gap: 0.8em; }
    .link-page-note { margin: 0; }
    .link-page-offline[hidden] { display: none; }
    .link-page-preview iframe { min-height: 70vh; }
  </style>`,
  );

  return page.replace(
    "</body>",
    `  <script>
    (() => {
      const offlineMessage = document.getElementById("offline-message");
      const blockedMessage = document.getElementById("blocked-message");
      const linkPreview = document.getElementById("link-preview");
      const linkFrame = document.getElementById("link-preview-frame");
      let frameLoaded = false;

      if (linkFrame) {
        linkFrame.addEventListener("load", () => {
          frameLoaded = true;
          if (blockedMessage) blockedMessage.hidden = true;
        });
      }

      function syncOfflineState() {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (offlineMessage) offlineMessage.hidden = !offline;
        if (blockedMessage) blockedMessage.hidden = true;
        if (linkPreview) linkPreview.hidden = offline;
      }

      function checkBlockedState() {
        const offline = typeof navigator !== "undefined" && navigator.onLine === false;
        if (offline || frameLoaded) return;
        if (blockedMessage) blockedMessage.hidden = false;
        if (linkPreview) linkPreview.hidden = true;
      }

      syncOfflineState();
      window.setTimeout(checkBlockedState, 4000);
      window.addEventListener("online", syncOfflineState);
      window.addEventListener("offline", syncOfflineState);
    })();
  </script>
</body>`,
  );
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
