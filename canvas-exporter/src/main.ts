import { App, Canvas, Plugin, PluginSettingTab, Setting, Notice, TFile } from "obsidian";
import { convertCanvasToHtml, CanvasData, ExportOptions } from "./converter";

export default class CanvasExporterPlugin extends Plugin {

  // ═══════════════════════════════════════════════════════════════
  //  Zeile 6 — KEIN Initializer, KEIN Constructor-Aufruf hier
  //  Das alte:  settings: PluginSettings = this.loadSettings();
  //  Erzeugt sofort new PluginSettings(this) → plugin.data.get()
  //  existiert nicht → settings = undefined → GAR NICHTS funktioniert
  // ═══════════════════════════════════════════════════════════════
  settings!: PluginSettings;

  async onload(): Promise<void> {
    await this.loadSettings();  // ← jetzt async, nutzt loadData()

    this.addRibbonIcon("file-down", "Canvas → HTML exportieren", async () => {
      await this.exportCurrentCanvas();
    });

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

    this.addSettingTab(new CanvasExporterSettingsTab(this.app, this));
  }

  onunload(): void {}

  async exportCurrentCanvas(): Promise<void> {
    const canvas = this.getActiveCanvas();
    if (!canvas) {
      new Notice("Kein Canvas gefunden. Öffne ein Canvas und versuche es erneut.", 4000);
      return;
    }

    const html = this.canvasToHtml(canvas);
    // canvas.getName() existiert NICHT in der Obsidian-API
    // Name kommt aus canvas.data.name
    const name = this.getCanvasName(canvas);
    await this.saveHtmlFile(html, name);
    new Notice("Canvas erfolgreich als HTML exportiert!", 3000);
  }

  async exportAllCanvases(): Promise<void> {
    const outputDir = this.settings.outputDir || "Canvas-Exports";
    const vault = this.app.vault;
    const allFiles = vault.getAllLoadedFiles();

    let count = 0;
    const skipped: string[] = [];

    for (const file of allFiles) {
      if (file instanceof TFile && file.extension === "canvas") {
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

          const folder = vault.getAbstractFileByPath(outputDir);
          if (!folder) await vault.createFolder(outputDir);

          await vault.create(outPath, html);
          count++;
        } catch {
          skipped.push(file.basename);
        }
      }
    }

    if (count > 0) new Notice(`${count} Canvas-Dateien exportiert!`, 3000);
    if (skipped.length > 0) {
      new Notice(`${skipped.length} fehlgeschlagen: ${skipped.join(", ")}`, 5000);
    }
  }

  async previewCanvasHtml(): Promise<void> {
    const canvas = this.getActiveCanvas();
    if (!canvas) {
      new Notice("Kein Canvas gefunden.", 4000);
      return;
    }

    const html = this.canvasToHtml(canvas);
    const name = this.getCanvasName(canvas);
    const tmpPath = `.canvas-preview-${Date.now()}.html`;

    await this.app.vault.create(tmpPath, html);

    const file = this.app.vault.getAbstractFileByPath(tmpPath);
    if (file instanceof TFile) {
      // korrekter Weg: openFile(), nicht openUri()
      this.app.workspace.getLeaf(true).openFile(file);
    }
  }

  private getActiveCanvas(): Canvas | null {
    const { workspace } = this.app;

    for (const leaf of workspace.getLeavesOfType("canvas")) {
      const view = leaf.view;
      if (view && "canvas" in view) {
        return (view as unknown as { canvas: Canvas }).canvas;
      }
    }

    const activeLeaf = workspace.getMostRecentLeaf();
    if (activeLeaf?.view && "canvas" in activeLeaf.view) {
      return (activeLeaf.view as unknown as { canvas: Canvas }).canvas;
    }

    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  //  canvas.getName() existiert NICHT → Hilfsfunktion
  // ═══════════════════════════════════════════════════════════════
  private getCanvasName(canvas: Canvas): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = (canvas as any).data;
    return rawData?.name || "Canvas-Export";
  }

  private canvasToHtml(canvas: Canvas): string {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawData = (canvas as any).data;

    const data: CanvasData = {
      nodes: rawData.nodes || [],
      edges: rawData.edges || [],
      name:  rawData.name,
      backgroundColor: rawData.backgroundColor,
    };

    const opts: ExportOptions = {
      darkMode: this.settings.darkMode,
      title:    rawData.name || "Canvas Export",
      exportImages: this.settings.exportImages,
    };

    return convertCanvasToHtml(data, opts);
  }

  private async saveHtmlFile(html: string, baseName: string): Promise<void> {
    const outDir  = this.settings.outputDir || "Canvas-Exports";
    const outPath = `${outDir}/${baseName}.html`;

    const folder = this.app.vault.getAbstractFileByPath(outDir);
    if (!folder) await this.app.vault.createFolder(outDir);

    const existing = this.app.vault.getAbstractFileByPath(outPath);
    if (existing) {
      await this.app.vault.modify(existing as TFile, html);
    } else {
      await this.app.vault.create(outPath, html);
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  loadSettings — SO muss es aussehen (async, mit loadData())
  //  Das alte: return new PluginSettings(this)
  //  → new PluginSettings ruft plugin.data.get() auf
  //  → plugin.data existiert NICHT → TypeError → settings = undefined
  // ═══════════════════════════════════════════════════════════════
  private async loadSettings(): Promise<void> {
    const defaults: PluginSettings = {
      darkMode: true,
      outputDir: "Canvas-Exports",
      exportImages: true,
    };
    const saved = await this.loadData();
    this.settings = { ...defaults, ...(saved as Partial<PluginSettings>) };
  }

  async saveSettings(): Promise<void> {
    // this.app.saveData() existiert NICHT
    // Korrekt: this.saveData() auf dem Plugin
    await this.saveData(this.settings);
  }
}

// ═══════════════════════════════════════════════════════════════
//  type statt class — kein Constructor, kein plugin.data.get()
// ═══════════════════════════════════════════════════════════════
type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
  exportImages: boolean;
};

// ═══════════════════════════════════════════════════════════════
//  Die alte class PluginSettings { constructor(plugin) { ... } }
//  war der HAUPTFEGLER — plugin.data.get() existiert nicht
// ═══════════════════════════════════════════════════════════════

class CanvasExporterSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: CanvasExporterPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Canvas to HTML — Einstellungen" });

    new Setting(containerEl)
      .setName("Dark Mode")
      .setDesc("Standardmäßig dunklen Modus verwenden")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.darkMode).onChange(async (val) => {
          this.plugin.settings.darkMode = val;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Ausgabeordner")
      .setDesc("Relativer Pfad im Vault (Standard: Canvas-Exports)")
      .addText((text) =>
        text.setValue(this.plugin.settings.outputDir).onChange(async (val) => {
          this.plugin.settings.outputDir = val || "Canvas-Exports";
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName("Bilder einbetten")
      .setDesc("Referenzierte Bilder als Base64 einbetten")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.exportImages).onChange(async (val) => {
          this.plugin.settings.exportImages = val;
          await this.plugin.saveSettings();
        })
      );
  }
}