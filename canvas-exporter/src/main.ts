import { Notice, Plugin, TFile } from "obsidian";
import { convertCanvasToHtml } from "./converter";
import { isAbsoluteFilesystemPath, requireDesktopNodeApis } from "./desktop-paths";
import { exportCanvasPackage } from "./exporter";
import { CanvasExporterSettingTab, DEFAULT_SETTINGS, normalizePluginSettings, PluginSettings } from "./settings";

type CanvasColorMap = Record<string, string>;

export default class CanvasExporterPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addRibbonIcon("file-down", "Export canvas as HTML", async () => {
      await this.exportCurrentCanvas();
    });

    this.addCommand({
      id: "export-current-canvas-to-html",
      name: "Export active canvas as HTML",
      callback: async () => {
        await this.exportCurrentCanvas();
      },
    });

    this.addSettingTab(new CanvasExporterSettingTab(this.app, this));
  }

  async exportCurrentCanvas(): Promise<void> {
    const file = this.getActiveCanvasFile();
    if (!file) {
      new Notice("No active canvas file found.", 4000);
      return;
    }

    try {
      const canvasColors = this.readCanvasPaletteColors();
      const result = await exportCanvasPackage(this.app, file, { ...this.settings, canvasColors });
      const html = await convertCanvasToHtml(result.data, result.options);
      await this.writeOutput(result.outputPath, result.outputKind, html);
      const label = result.outputKind === "file" ? "Self-contained canvas HTML exported" : "Canvas package exported";
      new Notice(`${label}: ${result.outputPath}`, 6000);
    } catch (error) {
      console.error("[canvas-exporter] Export failed", error);
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
    if (typeof window === "undefined" || typeof document === "undefined" || !document.body) {
      return {};
    }

    const result: CanvasColorMap = {};

    // Obsidian Canvas Farb-Index → CSS-Variable (aus app.css):
    // 1 → --color-red-rgb
    // 2 → --color-orange-rgb
    // 3 → --color-yellow-rgb
    // 4 → --color-green-rgb
    // 5 → --color-cyan-rgb
    // 6 → --color-purple-rgb
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

  private resolveCssVariable(cssVar: string): string {
    if (typeof document === "undefined" || !document.body) return "";

    // Hole den Wert der CSS-Variablen direkt vom Wurzel-Element
    const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();

    if (!value) return "";

    // Falls der Wert als RGB-String vorliegt (z.B. "255, 0, 0"), konvertiere zu rgb()
    const rgbMatch = value.match(/^(\d+)\s*,\s*(\d+)\s*,\s*(\d+)$/);
    if (rgbMatch) {
      return `rgb(${value})`;
    }

    // Falls es bereits ein korrektes Farbformat ist, gib es zurück
    if (/^(rgb|#)/.test(value) || /^rgba?\(/.test(value)) {
      return value;
    }

    // Fallback: Versuche die Farbe über ein Probe-Element zu rendern
    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.width = "1px";
    probe.style.height = "1px";
    probe.style.pointerEvents = "none";
    probe.style.opacity = "0";
    probe.style.backgroundColor = `var(${cssVar})`;

    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).backgroundColor.trim();
    probe.remove();

    if (!resolved || resolved === "rgba(0, 0, 0, 0)" || resolved === "transparent") {
      return "";
    }

    return resolved;
  }

  private async loadSettings(): Promise<void> {
    const saved = await this.loadData();
    this.settings = normalizePluginSettings(saved);
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}
