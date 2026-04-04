import { App, Notice, Plugin, PluginSettingTab, Setting, TFile } from "obsidian";
import { CanvasData, ExportOptions, convertCanvasToHtml } from "./converter";

type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
  exportImages: boolean;
};

const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: true,
  outputDir: "Canvas-Exports",
  exportImages: false,
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

    this.addCommand({
      id: "export-all-canvases-to-html",
      name: "Export: Alle Canvas-Dateien als HTML speichern",
      callback: async () => {
        await this.exportAllCanvases();
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
      const html = await this.buildHtmlForCanvasFile(file);
      const savedFile = await this.writeHtmlFile(file.basename, html);
      new Notice(`HTML exportiert: ${savedFile.path}`, 5000);
    } catch (error) {
      console.error("[canvas-exporter] Export fehlgeschlagen", error);
      new Notice("Canvas-Export fehlgeschlagen. Details in der Entwicklerkonsole.", 6000);
    }
  }

  async exportAllCanvases(): Promise<void> {
    const canvasFiles = this.app.vault
      .getFiles()
      .filter((file) => file.extension === "canvas");

    if (canvasFiles.length === 0) {
      new Notice("Im Vault wurden keine Canvas-Dateien gefunden.", 4000);
      return;
    }

    let successCount = 0;
    const failed: string[] = [];

    for (const file of canvasFiles) {
      try {
        const html = await this.buildHtmlForCanvasFile(file);
        await this.writeHtmlFile(file.basename, html);
        successCount += 1;
      } catch (error) {
        console.error(`[canvas-exporter] Export fehlgeschlagen für ${file.path}`, error);
        failed.push(file.path);
      }
    }

    if (failed.length === 0) {
      new Notice(`${successCount} Canvas-Datei(en) exportiert.`, 5000);
      return;
    }

    new Notice(
      `${successCount} exportiert, ${failed.length} fehlgeschlagen. Details in der Entwicklerkonsole.`,
      7000,
    );
  }

  private getActiveCanvasFile(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!file || file.extension !== "canvas") {
      return null;
    }
    return file;
  }

  private async buildHtmlForCanvasFile(file: TFile): Promise<string> {
    const rawContent = await this.app.vault.read(file);
    const parsed = JSON.parse(rawContent) as Partial<CanvasData>;

    const data: CanvasData = {
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name : file.basename,
    };

    const options: ExportOptions = {
      title: data.name ?? file.basename,
      darkMode: this.settings.darkMode,
      exportImages: this.settings.exportImages,
    };

    return convertCanvasToHtml(data, options);
  }

  private async writeHtmlFile(baseName: string, html: string): Promise<TFile> {
    const outputDir = this.normalizeOutputDir(this.settings.outputDir);
    await this.ensureFolderExists(outputDir);

    const filePath = `${outputDir}/${baseName}.html`;
    const existing = this.app.vault.getAbstractFileByPath(filePath);

    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, html);
      return existing;
    }

    return await this.app.vault.create(filePath, html);
  }

  private normalizeOutputDir(dir: string): string {
    const cleaned = dir.trim().replace(/^\/+|\/+$/g, "");
    return cleaned || DEFAULT_SETTINGS.outputDir;
  }

  private async ensureFolderExists(folderPath: string): Promise<void> {
    const parts = folderPath.split("/").filter(Boolean);
    let currentPath = "";

    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const existing = this.app.vault.getAbstractFileByPath(currentPath);
      if (!existing) {
        await this.app.vault.createFolder(currentPath);
      }
    }
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
      text: "Exportiert .canvas-Dateien als eigenständige HTML-Dateien. Diese stabile Basis unterstützt aktuell vor allem Text-, Link-, Datei- und Gruppen-Knoten.",
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

    new Setting(containerEl)
      .setName("Bildpfade als Bilder ausgeben")
      .setDesc("Versucht bei Bild-Dateiknoten ein img-Element mit dem Vault-Pfad zu erzeugen. Das ist nur ein erster Basis-Support, keine echte Einbettung.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.exportImages).onChange(async (value) => {
          this.plugin.settings.exportImages = value;
          await this.plugin.saveSettings();
        }),
      );
  }
}
