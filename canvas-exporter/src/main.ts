import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { convertCanvasToHtml } from "./converter";
import { exportCanvasPackage } from "./exporter";

type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
};

type CanvasColorMap = Record<string, string>;

const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: true,
  outputDir: "Canvas-Exports",
};

export default class CanvasExporterPlugin extends Plugin {
  settings: PluginSettings = DEFAULT_SETTINGS;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.addRibbonIcon("file-down", "Canvas als HTML exportieren", async () => {
      await this.exportCurrentCanvas();
    });

    this.addCommand({
      id: "export-current-canvas-to-html",
      name: "Export: Aktuelles Canvas als HTML speichern",
      callback: async () => {
        await this.exportCurrentCanvas();
      },
    });

    this.addSettingTab(new CanvasExporterSettingTab(this.app, this));
  }

  async exportCurrentCanvas(): Promise<void> {
    const file = this.getActiveCanvasFile();
    if (!file) {
      new Notice("Keine aktive Canvas-Datei gefunden.", 4000);
      return;
    }

    try {
      console.log("[canvas-exporter] Starte Export", { canvas: file.path, outputDir: this.settings.outputDir });
      const canvasColors = this.readCanvasPaletteColors();
      const result = await exportCanvasPackage(this.app, file, { ...this.settings, canvasColors });
      console.log("[canvas-exporter] Paket vorbereitet", { folderPath: result.folderPath, nodes: result.data.nodes.length, edges: result.data.edges.length });
      const html = convertCanvasToHtml(result.data, result.options);
      await this.writeIndexFile(result.folderPath, html);
      console.log("[canvas-exporter] index.html geschrieben", { folderPath: result.folderPath });
      new Notice(`Canvas-Paket exportiert: ${result.folderPath}`, 6000);
    } catch (error) {
      console.error("[canvas-exporter] Export fehlgeschlagen", error);
      const message = error instanceof Error ? error.message : "Unbekannter Fehler";
      new Notice(`Canvas-Export fehlgeschlagen: ${message}`, 7000);
    }
  }

  private async writeIndexFile(folderPath: string, html: string): Promise<void> {
    const filePath = `${folderPath}/index.html`;
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
    this.settings = { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

class CanvasExporterSettingTab extends PluginSettingTab {
  plugin: CanvasExporterPlugin;

  constructor(app: App, plugin: CanvasExporterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Canvas to HTML" });
    containerEl.createEl("p", {
      text: "Exportiert ein portables Paket pro Canvas mit index.html sowie assets/images und assets/files. Markdown-Dateiknoten werden dabei zusätzlich als einfache HTML-Unterseiten exportiert.",
    });

    new Setting(containerEl)
      .setName("Dunkles Standard-Theme")
      .setDesc("Verwendet beim Export standardmäßig ein dunkles HTML-Layout.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.darkMode).onChange(async (value) => {
          this.plugin.settings.darkMode = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Ausgabeordner")
      .setDesc("Relativer Zielordner im Vault, zum Beispiel Canvas-Exports.")
      .addText((text) =>
        text
          .setPlaceholder("Canvas-Exports")
          .setValue(this.plugin.settings.outputDir)
          .onChange(async (value) => {
            this.plugin.settings.outputDir = value || DEFAULT_SETTINGS.outputDir;
            await this.plugin.saveSettings();
          }),
      );
  }
}
