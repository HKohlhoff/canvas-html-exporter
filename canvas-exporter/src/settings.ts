import { App, PluginSettingTab, Setting, TextComponent } from "obsidian";
import type { HighlightingThemeChoice } from "./converter";
import { isAbsoluteFilesystemPath, isMobileRuntime } from "./desktop-paths";
import { normalizeStoredOutputPath, openVaultFolderPicker, pickFolderPath } from "./path-pickers";

export type ExportFormatChoice = "package" | "single-html";

export type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
  exportFormat: ExportFormatChoice;
  highlightingTheme: HighlightingThemeChoice;
  showMinimap: boolean;
  showSearch: boolean;
};

export const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: false,
  outputDir: "Canvas-Exports",
  exportFormat: "package",
  highlightingTheme: "shiki",
  showMinimap: true,
  showSearch: true,
};

const EXPORT_FORMAT_LABELS: Record<ExportFormatChoice, string> = {
  package: "Package folder",
  "single-html": "Single HTML file",
};

const HIGHLIGHTING_THEME_LABELS: Record<HighlightingThemeChoice, string> = {
  shiki: "Shiki",
  github: "GitHub",
  vscode: "VS Code",
  catppuccin: "Catppuccin",
  material: "Material",
};

const VALID_EXPORT_FORMATS = new Set<ExportFormatChoice>(Object.keys(EXPORT_FORMAT_LABELS) as ExportFormatChoice[]);
const VALID_HIGHLIGHTING_THEMES = new Set<HighlightingThemeChoice>(Object.keys(HIGHLIGHTING_THEME_LABELS) as HighlightingThemeChoice[]);

export function normalizePluginSettings(saved: unknown): PluginSettings {
  const data = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
  const exportFormat = String(data.exportFormat || "").trim() as ExportFormatChoice;
  const highlightingTheme = String(data.highlightingTheme || "").trim() as HighlightingThemeChoice;
  let normalizedOutputDir = normalizeStoredOutputPath(typeof data.outputDir === "string" ? data.outputDir : "");
  if (isMobileRuntime() && isAbsoluteFilesystemPath(normalizedOutputDir)) {
    normalizedOutputDir = DEFAULT_SETTINGS.outputDir;
  }

  return {
    darkMode: typeof data.darkMode === "boolean" ? data.darkMode : DEFAULT_SETTINGS.darkMode,
    outputDir: normalizedOutputDir || DEFAULT_SETTINGS.outputDir,
    exportFormat: VALID_EXPORT_FORMATS.has(exportFormat) ? exportFormat : DEFAULT_SETTINGS.exportFormat,
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
  private outputDirText: TextComponent | null = null;

  constructor(app: App, plugin: SettingsHost) {
    super(app, plugin as never);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const isMobile = isMobileRuntime();
    containerEl.empty();

    containerEl.createEl("h2", { text: "Canvas to HTML" });
    containerEl.createEl("p", {
      text: "Exports the active canvas either as a portable package folder or as a single self-contained HTML file.",
    });

    new Setting(containerEl)
      .setName("Export format")
      .setDesc("Choose between the classic package folder export and a single self-contained HTML file.")
      .addDropdown((dropdown) => {
        for (const [value, label] of Object.entries(EXPORT_FORMAT_LABELS)) {
          dropdown.addOption(value, label);
        }

        dropdown.setValue(this.plugin.settings.exportFormat).onChange(async (value) => {
          const selected = value as ExportFormatChoice;
          this.plugin.settings.exportFormat = VALID_EXPORT_FORMATS.has(selected)
            ? selected
            : DEFAULT_SETTINGS.exportFormat;
          await this.plugin.saveSettings();
        });
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

    const outputFolderSetting = new Setting(containerEl)
      .setName("Output folder")
      .setDesc(
        isMobile
          ? "Choose a folder inside the vault. Absolute system folders are available on desktop only."
          : "Use either a folder inside the vault or an absolute folder on your system.",
      )
      .addText((text) => {
        this.outputDirText = text;
        text
          .setPlaceholder("Canvas-Exports")
          .setValue(this.plugin.settings.outputDir)
          .onChange(async (value) => {
            this.plugin.settings.outputDir = normalizeStoredOutputPath(value) || DEFAULT_SETTINGS.outputDir;
            await this.plugin.saveSettings();
          });
      })
      .addButton((button) => {
        button.setButtonText("In vault...");
        button.onClick(() => {
          openVaultFolderPicker(this.app, async (vaultPath) => {
            const nextValue = normalizeStoredOutputPath(vaultPath) || DEFAULT_SETTINGS.outputDir;
            this.plugin.settings.outputDir = nextValue;
            this.outputDirText?.setValue(nextValue);
            await this.plugin.saveSettings();
          });
        });
      })
    if (!isMobile) {
      outputFolderSetting.addButton((button) => {
        button.setButtonText("Choose folder...");
        button.onClick(async () => {
          const picked = await pickFolderPath();
          if (!picked) return;
          const nextValue = normalizeStoredOutputPath(picked) || DEFAULT_SETTINGS.outputDir;
          this.plugin.settings.outputDir = nextValue;
          this.outputDirText?.setValue(nextValue);
          await this.plugin.saveSettings();
        });
      });
    }

    this.layoutOutputFolderSetting(outputFolderSetting);
  }

  private layoutOutputFolderSetting(setting: Setting): void {
    const controlEl = (setting as unknown as { controlEl?: HTMLElement }).controlEl;
    if (!controlEl) return;

    controlEl.style.display = "block";
    controlEl.style.width = "100%";

    const textInput = this.outputDirText?.inputEl;
    const textWrapper = textInput?.parentElement as HTMLElement | null;
    if (textWrapper) {
      textWrapper.style.display = "block";
      textWrapper.style.width = "100%";
      textWrapper.style.marginBottom = "8px";
    }
    if (textInput) {
      textInput.style.width = "100%";
      textInput.style.maxWidth = "100%";
      textInput.style.boxSizing = "border-box";
    }

    const buttonRow = document.createElement("div");
    buttonRow.style.display = "flex";
    buttonRow.style.flexWrap = "wrap";
    buttonRow.style.gap = "8px";
    buttonRow.style.justifyContent = "flex-start";

    const buttonWrappers = Array.from(controlEl.children)
      .filter((child) => child !== textWrapper) as HTMLElement[];

    for (const wrapper of buttonWrappers) {
      wrapper.style.marginTop = "0";
      buttonRow.appendChild(wrapper);
    }

    controlEl.appendChild(buttonRow);
  }
}
