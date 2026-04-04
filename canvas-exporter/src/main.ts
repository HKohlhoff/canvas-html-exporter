import { App, Plugin, PluginSettingTab, Setting, Notice, TFile } from "obsidian";
import { convertCanvasToHtml, CanvasData, ExportOptions } from "./converter";

// ─────────────────────────────────────────────────────────────
// Settings-Struktur
// ─────────────────────────────────────────────────────────────

interface PluginSettings {
  darkMode: boolean;
  outputDir: string;
  exportImages: boolean;
}

const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: true,
  outputDir: "Canvas-Exports",
  exportImages: true,
};

// ─────────────────────────────────────────────────────────────
// Plugin
// ─────────────────────────────────────────────────────────────

export default class CanvasExporterPlugin extends Plugin {

  settings: PluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();

    // ── Ribbon-Icon ──
    this.addRibbonIcon("file-down", "Canvas → HTML exportieren", async () => {
      await this.exportCurrentCanvas();
    });

    // ── Command Palette ──
    this.addCommand({
      id: "export-canvas-html",
      name: "Export: Aktuellen Canvas als HTML speichern",
      callback: async () => {
        await this.exportCurrentCanvas();
      },
    });

    this.addCommand({
      id: "export-all-canvases",
      name: "Export: Alle Canvas-Dateien im Vault als HTML exportieren",
      callback: async () => {
        await this.exportAllCanvases();
      },
    });

    this.addCommand({
      id: "preview-canvas-html",
      name: "Vorschau: Aktuellen Canvas als HTML anzeigen",
      callback: async () => {
        await this.previewCanvasHtml();
      },
    });

    // ── Settings Tab ──
    this.addSettingTab(new CanvasExporterSettingsTab(this.app, this));
  }

  onunload(): void {
    // Aufräumen
  }

  // ─────────────────────────────────────────────────────────────
  // Haupt-Export-Funktion
  // ─────────────────────────────────────────────────────────────

  async exportCurrentCanvas(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== "canvas") {
      new Notice("Kein Canvas gefunden. Öffne ein Canvas und versuche es erneut.", 4000);
      return;
    }

    try {
      const content = await this.app.vault.read(activeFile);
      const data: CanvasData = JSON.parse(content);

      const opts: ExportOptions = {
        darkMode: this.settings.darkMode,
        title: data.name || activeFile.basename,
        exportImages: this.settings.exportImages,
      };

      const html = convertCanvasToHtml(data, opts);
      await this.saveHtmlFile(html, activeFile.basename);
      new Notice("Canvas erfolgreich als HTML exportiert!", 3000);
    } catch (err) {
      new Notice(`Export fehlgeschlagen: ${err}`, 5000);
    }
  }

  async exportAllCanvases(): Promise<void> {
    const outputDir = this.settings.outputDir || "Canvas-Exports";
    const vault = this.app.vault;

    let count = 0;
    const skipped: string[] = [];

    const allFiles = vault.getFiles();

    for (const file of allFiles) {
      if (file.extension === "canvas") {
        try {
          const content = await vault.read(file);
          const data: CanvasData = JSON.parse(content);

          const opts: ExportOptions = {
            darkMode: this.settings.darkMode,
            title: data.name || file.basename,
            exportImages: this.settings.exportImages,
          };

          const html = convertCanvasToHtml(data, opts);
          const outPath = `${outputDir}/${file.basename}.html`;

          // Ordner erstellen falls nötig
          const folder = vault.getAbstractFileByPath(outputDir);
          if (!folder) {
            await vault.createFolder(outputDir);
          }

          // Prüfe ob Datei bereits existiert
          const existing = vault.getAbstractFileByPath(outPath);
          if (existing && existing instanceof TFile) {
            await vault.modify(existing, html);
          } else {
            await vault.create(outPath, html);
          }

          count++;
        } catch (err) {
          skipped.push(file.basename);
        }
      }
    }

    if (count > 0) {
      new Notice(`${count} Canvas-Dateien exportiert!`, 3000);
    }
    if (skipped.length > 0) {
      new Notice(`${skipped.length} Dateien fehlgeschlagen: ${skipped.join(", ")}`, 5000);
    }
  }

  async previewCanvasHtml(): Promise<void> {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== "canvas") {
      new Notice("Kein Canvas gefunden.", 4000);
      return;
    }

    try {
      const content = await this.app.vault.read(activeFile);
      const data: CanvasData = JSON.parse(content);

      const opts: ExportOptions = {
        darkMode: this.settings.darkMode,
        title: data.name || activeFile.basename,
        exportImages: this.settings.exportImages,
      };

      const html = convertCanvasToHtml(data, opts);
      const tmpPath = `.canvas-preview-${Date.now()}.html`;
      await this.app.vault.create(tmpPath, html);
      new Notice("Vorschau-Datei erstellt: " + tmpPath, 3000);
    } catch (err) {
      new Notice(`Vorschau fehlgeschlagen: ${err}`, 5000);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // HTML speichern
  // ─────────────────────────────────────────────────────────────

  private async saveHtmlFile(html: string, baseName: string): Promise<void> {
    const outDir  = this.settings.outputDir || "Canvas-Exports";
    const outName = `${baseName}.html`;
    const outPath = `${outDir}/${outName}`;

    // Ordner erstellen falls nötig
    const folder = this.app.vault.getAbstractFileByPath(outDir);
    if (!folder) {
      await this.app.vault.createFolder(outDir);
    }

    // Prüfe ob Datei bereits existiert
    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (existing && existing instanceof TFile) {
      await this.app.vault.modify(existing, html);
    } else {
      await this.app.vault.create(outPath, html);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Settings laden/speichern
  // ─────────────────────────────────────────────────────────────

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }
}

// ─────────────────────────────────────────────────────────────
// Settings Tab
// ─────────────────────────────────────────────────────────────

class CanvasExporterSettingsTab extends PluginSettingTab {
  plugin: CanvasExporterPlugin;

  constructor(app: App, plugin: CanvasExporterPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Canvas to HTML — Einstellungen" });

    new Setting(containerEl)
      .setName("Dark Mode")
      .setDesc("Standardmäßig dunklen Modus verwenden")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.darkMode)
          .onChange(async (val) => {
            this.plugin.settings.darkMode = val;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Ausgabeordner")
      .setDesc("Relativer Pfad im Vault (Standard: Canvas-Exports)")
      .addText((text) =>
        text
          .setValue(this.plugin.settings.outputDir)
          .onChange(async (val) => {
            this.plugin.settings.outputDir = val || "Canvas-Exports";
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Bilder einbetten")
      .setDesc("Referenzierte Bilder als Base64 in die HTML einbetten")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.exportImages)
          .onChange(async (val) => {
            this.plugin.settings.exportImages = val;
            await this.plugin.saveSettings();
          })
      );
  }
}