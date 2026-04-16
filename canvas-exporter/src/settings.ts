import { App, PluginSettingTab, Setting } from "obsidian";
import type { HighlightingThemeChoice } from "./converter";

export type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
  highlightingTheme: HighlightingThemeChoice;
  showMinimap: boolean;
};

export const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: false,
  outputDir: "Canvas-Exports",
  highlightingTheme: "shiki",
  showMinimap: true,
};

const HIGHLIGHTING_THEME_LABELS: Record<HighlightingThemeChoice, string> = {
  shiki: "Shiki",
  github: "GitHub",
  vscode: "VS Code",
  catppuccin: "Catppuccin",
  material: "Material",
};

const VALID_HIGHLIGHTING_THEMES = new Set<HighlightingThemeChoice>(Object.keys(HIGHLIGHTING_THEME_LABELS) as HighlightingThemeChoice[]);

export function normalizePluginSettings(saved: unknown): PluginSettings {
  const data = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
  const highlightingTheme = String(data.highlightingTheme || "").trim() as HighlightingThemeChoice;

  return {
    darkMode: typeof data.darkMode === "boolean" ? data.darkMode : DEFAULT_SETTINGS.darkMode,
    outputDir: typeof data.outputDir === "string" && data.outputDir.trim() ? data.outputDir.trim() : DEFAULT_SETTINGS.outputDir,
    highlightingTheme: VALID_HIGHLIGHTING_THEMES.has(highlightingTheme) ? highlightingTheme : DEFAULT_SETTINGS.highlightingTheme,
    showMinimap: typeof data.showMinimap === "boolean" ? data.showMinimap : DEFAULT_SETTINGS.showMinimap,
  };
}

type SettingsHost = {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
};

export class CanvasExporterSettingTab extends PluginSettingTab {
  plugin: SettingsHost;

  constructor(app: App, plugin: SettingsHost) {
    super(app, plugin as never);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Canvas to HTML" });
    containerEl.createEl("p", {
      text: "Exportiert ein portables Paket pro Canvas mit index.html sowie assets/images und assets/files. Markdown-Dateiknoten werden dabei zusätzlich als HTML-Unterseiten exportiert.",
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
      .setName("Minimap anzeigen")
      .setDesc("Blendet in der exportierten Canvas-Seite eine Minimap mit aktuellem Viewport ein.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showMinimap).onChange(async (value) => {
          this.plugin.settings.showMinimap = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Syntax-Highlighting")
      .setDesc("Waehlt das Farbschema fuer Codebloecke im HTML-Export.")
      .addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(HIGHLIGHTING_THEME_LABELS)) {
          dropdown.addOption(value, label);
        }

        dropdown.setValue(this.plugin.settings.highlightingTheme).onChange(async (value) => {
          const selected = value as HighlightingThemeChoice;
          this.plugin.settings.highlightingTheme = VALID_HIGHLIGHTING_THEMES.has(selected)
            ? selected
            : DEFAULT_SETTINGS.highlightingTheme;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName("Ausgabeordner")
      .setDesc("Relativer Zielordner im Vault, zum Beispiel Canvas-Exports.")
      .addText((text) =>
        text
          .setPlaceholder("Canvas-Exports")
          .setValue(this.plugin.settings.outputDir)
          .onChange(async (value) => {
            this.plugin.settings.outputDir = value.trim() || DEFAULT_SETTINGS.outputDir;
            await this.plugin.saveSettings();
          }),
      );
  }
}
