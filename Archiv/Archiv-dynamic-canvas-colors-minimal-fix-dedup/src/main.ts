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
      const canvasColors = this.readCanvasPaletteColors();
      const result = await exportCanvasPackage(this.app, file, { ...this.settings, canvasColors });
      const html = convertCanvasToHtml(result.data, result.options);
      await this.writeIndexFile(result.folderPath, html);
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

    const styleTargets: HTMLElement[] = [];
    const activeView = (this.app.workspace as any)?.activeLeaf?.view;
    const viewContainer = activeView?.containerEl instanceof HTMLElement ? activeView.containerEl : null;
    if (viewContainer) styleTargets.push(viewContainer);
    styleTargets.push(document.body);
    if (document.documentElement instanceof HTMLElement) {
      styleTargets.push(document.documentElement);
    }

    const result: CanvasColorMap = {};

    for (let index = 1; index <= 6; index += 1) {
      const cssVar = `--canvas-color-${index}`;
      let resolved = "";

      for (const target of styleTargets) {
        const concrete = this.resolveCssColorValue(cssVar, target);
        if (concrete) {
          resolved = concrete;
          break;
        }
        const raw = getComputedStyle(target).getPropertyValue(cssVar).trim();
        if (raw) {
          resolved = raw;
          break;
        }
      }

      if (resolved) {
        result[String(index)] = resolved;
        // also support older 0-based color ids if present in canvas JSON
        result[String(index - 1)] = resolved;
      }
    }

    return result;
  }

  private resolveCssColorValue(cssVar: string, target: HTMLElement): string {
    if (typeof document === "undefined" || !document.body) return "";

    const probe = document.createElement("div");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "-9999px";
    probe.style.width = "1px";
    probe.style.height = "1px";
    probe.style.pointerEvents = "none";
    probe.style.opacity = "0";
    probe.style.backgroundColor = `var(${cssVar})`;

    target.appendChild(probe);
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
