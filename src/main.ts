import { Notice, Plugin, TFile } from "obsidian";
import { convertCanvasToHtml } from "./render/converter";
import { isAbsoluteFilesystemPath, requireDesktopNodeApis } from "./helpers/desktop-paths";
import { exportCanvasPackage } from "./export/exporter";
import { CanvasHtmlExporterSettingTab, DEFAULT_SETTINGS, normalizePluginSettings, PluginSettings } from "./settings";

type CanvasColorMap = Record<string, string>;
type CalloutColorMap = Record<string, string>;
type HeadingColorMap = Record<string, string>;
type InlineStyleColorMap = Record<string, string>;
const FALLBACK_HEADING_COLORS: HeadingColorMap = {
  h1: "#e63242",
  h2: "#fa8d3e",
  h3: "#f9c74f",
  h4: "#56ae6c",
  h5: "#04a5e5",
  h6: "#9c6bae",
};

export default class CanvasHtmlExporterPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addRibbonIcon("file-down", "Export canvas as HTML", () => {
      void this.exportCurrentCanvas();
    });

    this.addCommand({
      id: "export-active-canvas",
      name: "Export active canvas as HTML",
      callback: () => {
        void this.exportCurrentCanvas();
      },
    });

    this.addSettingTab(new CanvasHtmlExporterSettingTab(this.app, this));
  }

  async exportCurrentCanvas(): Promise<void> {
    const file = this.getActiveCanvasFile();
    if (!file) {
      new Notice("No active canvas file found.", 4000);
      return;
    }

    try {
      const canvasColors = this.readCanvasPaletteColors();
      const calloutColors = this.readCalloutColors();
      const headingColors = this.readHeadingColors(canvasColors);
      const inlineStyleColors = this.readInlineStyleColors();
      const result = await exportCanvasPackage(this.app, file, { ...this.settings, canvasColors, calloutColors, headingColors, inlineStyleColors });
      const html = await convertCanvasToHtml(result.data, result.options);
      await this.writeOutput(result.outputPath, result.outputKind, html);
      const label = result.outputKind === "file" ? "Self-contained canvas HTML exported" : "Canvas package exported";
      new Notice(`${label}: ${result.outputPath}`, 6000);
    } catch (error) {
      console.error("[canvas-html-exporter] Export failed", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      new Notice(`Canvas export failed: ${message}`, 7000);
    }
  }

  private async writeOutput(outputPath: string, outputKind: "folder" | "file", html: string): Promise<void> {
    if (isAbsoluteFilesystemPath(outputPath)) {
      const { fs, path } = requireDesktopNodeApis();
      const targetPath = outputKind === "folder" ? path.join(outputPath, "index.html") : outputPath;
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, html, "utf8");
      return;
    }

    const filePath = outputKind === "folder" ? `${outputPath}/index.html` : outputPath;
    const existing = this.app.vault.getAbstractFileByPath(filePath);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, html);
      return;
    }
    await this.app.vault.create(filePath, html);
  }

  private getActiveCanvasFile(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "canvas") return null;
    return file;
  }

  private readCanvasPaletteColors(): CanvasColorMap {
    if (typeof window === "undefined" || typeof activeDocument === "undefined" || !activeDocument.body) {
      return {};
    }

    const result: CanvasColorMap = {};

    const colorMap: Record<string, string> = {
      "1": "--color-red-rgb",
      "2": "--color-orange-rgb",
      "3": "--color-yellow-rgb",
      "4": "--color-green-rgb",
      "5": "--color-cyan-rgb",
      "6": "--color-purple-rgb",
    };

    for (const [colorIndex, cssVar] of Object.entries(colorMap)) {
      const resolved = this.resolveCssVariable(cssVar);
      if (resolved) {
        result[colorIndex] = resolved;
      }
    }

    return result;
  }

  private readCalloutColors(): CalloutColorMap {
    if (typeof window === "undefined" || typeof activeDocument === "undefined" || !activeDocument.body) {
      return {};
    }

    const result: CalloutColorMap = {};
    const types = [
      "note",
      "info",
      "todo",
      "abstract",
      "summary",
      "tldr",
      "tip",
      "hint",
      "important",
      "success",
      "check",
      "done",
      "warning",
      "caution",
      "attention",
      "question",
      "help",
      "faq",
      "danger",
      "error",
      "failure",
      "fail",
      "missing",
      "bug",
      "example",
      "quote",
      "cite",
      "settings",
      "award",
    ];
    const host = createDiv();
    this.applyHiddenProbeStyles(host);
    activeDocument.body.appendChild(host);

    try {
      for (const type of types) {
        const callout = createDiv({ cls: "callout" });
        callout.setAttribute("data-callout", type);
        const title = createDiv({ cls: "callout-title" });
        title.textContent = type;
        callout.appendChild(title);
        host.appendChild(callout);

        const calloutStyles = getComputedStyle(callout);
        const titleStyles = getComputedStyle(title);
        const cssVar = calloutStyles.getPropertyValue("--callout-color").trim();
        const resolved = this.normalizeCalloutColor(cssVar) || this.normalizeCalloutColor(titleStyles.color) || this.normalizeCalloutColor(calloutStyles.borderColor);
        if (resolved) {
          result[type] = resolved;
        }

        callout.remove();
      }
    } finally {
      host.remove();
    }

    return result;
  }

  private readHeadingColors(canvasColors: CanvasColorMap = {}): HeadingColorMap {
    if (typeof window === "undefined" || typeof activeDocument === "undefined" || !activeDocument.body) {
      return this.buildHeadingFallbackColors(canvasColors);
    }

    const styleScope = this.getThemeStyleScope();
    const fallbackColors = this.buildHeadingFallbackColors(canvasColors);
    const host = createDiv();
    host.className = "markdown-rendered markdown-preview-view";
    this.applyHiddenProbeStyles(host);
    styleScope.appendChild(host);

    try {
      const textColor = this.readProbeTextColor(host) || this.normalizeCalloutColor(getComputedStyle(styleScope).color) || this.resolveCssVariable("--text-normal");
      const sampledColors: HeadingColorMap = {};

      for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
        const heading = createEl(level as keyof HTMLElementTagNameMap);
        heading.textContent = level.toUpperCase();
        host.appendChild(heading);
        const resolved = this.normalizeCalloutColor(getComputedStyle(heading).color);
        if (resolved) {
          sampledColors[level] = resolved;
        }
        heading.remove();
      }

      const sampledValues = Object.values(sampledColors);
      if (!sampledValues.length) {
        return fallbackColors;
      }

      const hasDistinctHeadingColor = sampledValues.some((color) => !this.sameCssColor(color, textColor));
      return hasDistinctHeadingColor
        ? { ...fallbackColors, ...sampledColors }
        : fallbackColors;
    } finally {
      host.remove();
    }
  }

  private readInlineStyleColors(): InlineStyleColorMap {
    if (typeof window === "undefined" || typeof activeDocument === "undefined" || !activeDocument.body) {
      return {};
    }

    const styleScope = this.getThemeStyleScope();
    const host = createDiv();
    host.className = "markdown-rendered markdown-preview-view";
    this.applyHiddenProbeStyles(host);
    styleScope.appendChild(host);

    try {
      const paragraph = createEl("p");
      const strong = createEl("strong");
      strong.textContent = "Bold";
      const em = createEl("em");
      em.textContent = "Italic";
      const del = createEl("del");
      del.textContent = "Deleted";
      paragraph.append(strong, em, del);
      host.appendChild(paragraph);
      const result: InlineStyleColorMap = {};
      const textColor = this.normalizeCalloutColor(getComputedStyle(paragraph).color) || this.resolveCssVariable("--text-normal");
      const probes: Array<[keyof InlineStyleColorMap, string]> = [
        ["strong", "strong"],
        ["em", "em"],
        ["del", "del"],
      ];

      for (const [key, selector] of probes) {
        const element = paragraph.querySelector(selector);
        if (!(element instanceof HTMLElement)) continue;
        const color = this.normalizeCalloutColor(getComputedStyle(element).color);
        if (color && !this.sameCssColor(color, textColor)) {
          result[key] = color;
        }
      }

      return result;
    } finally {
      host.remove();
    }
  }

  private normalizeCalloutColor(raw: string): string {
    const value = String(raw || "").trim();
    if (!value) return "";
    const rgbTriplet = value.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
    if (rgbTriplet) return `rgb(${value})`;
    if (/^(rgb|#)/i.test(value) || /^rgba?\(/i.test(value)) return value;
    return "";
  }

  private resolveCssVariable(cssVar: string): string {
    if (typeof activeDocument === "undefined" || !activeDocument.body) return "";

    const styleScope = this.getThemeStyleScope();
    const rootValue = getComputedStyle(activeDocument.documentElement).getPropertyValue(cssVar).trim();
    const bodyValue = getComputedStyle(activeDocument.body).getPropertyValue(cssVar).trim();
    const scopeValue = getComputedStyle(styleScope).getPropertyValue(cssVar).trim();
    const value = scopeValue || bodyValue || rootValue;

    if (value) {
      const rgbMatch = value.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
      if (rgbMatch) {
        return `rgb(${value})`;
      }

      if (/^(rgb|#)/.test(value) || /^rgba?\(/.test(value)) {
        return value;
      }
    }

    const probe = createDiv();
    this.applyHiddenProbeStyles(probe);
    probe.addClass("canvas-html-exporter-color-probe");
    probe.setCssProps({ "--canvas-html-exporter-probe-bg": `var(${cssVar})` });

    styleScope.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor.trim();
    probe.remove();

    if (!resolved || resolved === "rgba(0, 0, 0, 0)" || resolved === "transparent") {
      return "";
    }

    return resolved;
  }

  private applyHiddenProbeStyles(element: HTMLElement): void {
    element.addClass("canvas-html-exporter-hidden-probe");
  }

  private readProbeTextColor(host: HTMLElement): string {
    const paragraph = createEl("p");
    paragraph.textContent = "Probe";
    host.appendChild(paragraph);
    const resolved = this.normalizeCalloutColor(getComputedStyle(paragraph).color);
    paragraph.remove();
    return resolved;
  }

  private buildHeadingFallbackColors(canvasColors: CanvasColorMap): HeadingColorMap {
    return {
      h1: canvasColors["1"] || FALLBACK_HEADING_COLORS.h1,
      h2: canvasColors["2"] || FALLBACK_HEADING_COLORS.h2,
      h3: canvasColors["3"] || FALLBACK_HEADING_COLORS.h3,
      h4: canvasColors["4"] || FALLBACK_HEADING_COLORS.h4,
      h5: canvasColors["5"] || FALLBACK_HEADING_COLORS.h5,
      h6: canvasColors["6"] || FALLBACK_HEADING_COLORS.h6,
    };
  }

  private sameCssColor(a: string, b: string): boolean {
    const normalize = (value: string) => String(value || "").replace(/\s+/g, "").toLowerCase();
    return normalize(a) === normalize(b);
  }

  private getThemeStyleScope(): HTMLElement {
    const appContainer = activeDocument.querySelector(".app-container");
    return appContainer instanceof HTMLElement
      ? appContainer
      : activeDocument.body;
  }

  private async loadSettings(): Promise<void> {
    const saved: unknown = await this.loadData();
    this.settings = normalizePluginSettings(saved);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
