import { App, PluginSettingTab, Setting } from "obsidian";
import type { HighlightingThemeChoice } from "./converter";

export type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
  highlightingTheme: HighlightingThemeChoice;
  showMinimap: boolean;
  showSearch: boolean;
};

export const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: false,
  outputDir: "Canvas-Exports",
  highlightingTheme: "shiki",
  showMinimap: true,
  showSearch: true,
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
    showSearch: typeof data.showSearch === "boolean" ? data.showSearch : DEFAULT_SETTINGS.showSearch,
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
      text: "Exports a portable package for each canvas with index.html plus assets/images and assets/files. Markdown file nodes are additionally exported as HTML subpages.",
    });

    new Setting(containerEl)
      .setName("Dark default theme")
      .setDesc("Use a dark HTML layout by default for exported pages.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.darkMode).onChange(async (value) => {
          this.plugin.settings.darkMode = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show minimap")
      .setDesc("Include a minimap with the current viewport on the exported canvas page.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showMinimap).onChange(async (value) => {
          this.plugin.settings.showMinimap = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Show search")
      .setDesc("Include a search overlay with result list and node navigation on the exported canvas page.")
      .addToggle((toggle) =>
        toggle.setValue(this.plugin.settings.showSearch).onChange(async (value) => {
          this.plugin.settings.showSearch = value;
          await this.plugin.saveSettings();
        }),
      );

    new Setting(containerEl)
      .setName("Syntax-Highlighting")
      .setDesc("Choose the color theme used for fenced code blocks in the HTML export.")
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
      .setName("Output folder")
      .setDesc("Relative destination folder inside the vault, for example Canvas-Exports.")
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
