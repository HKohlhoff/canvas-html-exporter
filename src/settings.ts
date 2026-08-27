import { App, Plugin, PluginSettingTab, SettingDefinitionItem } from "obsidian";
import type { HighlightingThemeChoice } from "./render/converter";
import {
  DEFAULT_FOLDING_INITIAL_STATE,
  normalizeFoldingInitialStateChoice,
  type FoldingInitialStateChoice,
} from "./folding/types";
import { isAbsoluteFilesystemPath, isMobileRuntime } from "./helpers/desktop-paths";
import { normalizeStoredOutputPath, openVaultFolderPicker, pickFolderPath } from "./path-pickers";

export type ExportFormatChoice = "package" | "single-html";

export type PluginSettings = {
  darkMode: boolean;
  outputDir: string;
  exportFormat: ExportFormatChoice;
  foldingInitialState: FoldingInitialStateChoice;
  highlightingTheme: HighlightingThemeChoice;
  showMinimap: boolean;
  showSearch: boolean;
};

export const DEFAULT_SETTINGS: PluginSettings = {
  darkMode: false,
  outputDir: "Canvas-Exports",
  exportFormat: "package",
  foldingInitialState: DEFAULT_FOLDING_INITIAL_STATE,
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

const FOLDING_INITIAL_STATE_LABELS: Record<FoldingInitialStateChoice, string> = {
  none: "No folding",
  expanded: "Fully expanded",
  current: "Current Canvas Folding state",
};

const VALID_EXPORT_FORMATS = new Set<ExportFormatChoice>(Object.keys(EXPORT_FORMAT_LABELS) as ExportFormatChoice[]);
const VALID_FOLDING_INITIAL_STATES = new Set<FoldingInitialStateChoice>(Object.keys(FOLDING_INITIAL_STATE_LABELS) as FoldingInitialStateChoice[]);
const VALID_HIGHLIGHTING_THEMES = new Set<HighlightingThemeChoice>(Object.keys(HIGHLIGHTING_THEME_LABELS) as HighlightingThemeChoice[]);
const DEFAULT_OUTPUT_PLACEHOLDER = DEFAULT_SETTINGS.outputDir;

export function normalizePluginSettings(saved: unknown): PluginSettings {
  const data = saved && typeof saved === "object" ? (saved as Record<string, unknown>) : {};
  const exportFormat = (typeof data.exportFormat === "string" ? data.exportFormat.trim() : "") as ExportFormatChoice;
  const highlightingTheme = (typeof data.highlightingTheme === "string" ? data.highlightingTheme.trim() : "") as HighlightingThemeChoice;
  const foldingInitialState = normalizeFoldingInitialStateChoice(
    typeof data.foldingInitialState === "string" ? data.foldingInitialState.trim() : "",
  );
  let normalizedOutputDir = normalizeStoredOutputPath(typeof data.outputDir === "string" ? data.outputDir : "");
  if (isMobileRuntime() && isAbsoluteFilesystemPath(normalizedOutputDir)) {
    normalizedOutputDir = DEFAULT_SETTINGS.outputDir;
  }

  return {
    darkMode: typeof data.darkMode === "boolean" ? data.darkMode : DEFAULT_SETTINGS.darkMode,
    outputDir: normalizedOutputDir || DEFAULT_SETTINGS.outputDir,
    exportFormat: VALID_EXPORT_FORMATS.has(exportFormat) ? exportFormat : DEFAULT_SETTINGS.exportFormat,
    foldingInitialState,
    highlightingTheme: VALID_HIGHLIGHTING_THEMES.has(highlightingTheme) ? highlightingTheme : DEFAULT_SETTINGS.highlightingTheme,
    showMinimap: typeof data.showMinimap === "boolean" ? data.showMinimap : DEFAULT_SETTINGS.showMinimap,
    showSearch: typeof data.showSearch === "boolean" ? data.showSearch : DEFAULT_SETTINGS.showSearch,
  };
}

type SettingsHost = Plugin & {
  settings: PluginSettings;
  saveSettings(): Promise<void>;
};

type PluginSettingKey = keyof PluginSettings;

export class CanvasHtmlExporterSettingTab extends PluginSettingTab {
  plugin: SettingsHost;

  constructor(app: App, plugin: SettingsHost) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem<PluginSettingKey>[] {
    const isMobile = isMobileRuntime();

    return [
      {
        name: "Export format",
        desc: "Export as a portable package folder or a single self-contained HTML file.",
        aliases: ["package", "standalone", "single HTML"],
        control: {
          type: "dropdown",
          key: "exportFormat",
          defaultValue: DEFAULT_SETTINGS.exportFormat,
          options: EXPORT_FORMAT_LABELS,
        },
      },
      {
        name: "Output folder",
        desc: isMobile
          ? "Enter a folder inside the vault."
          : "Enter a vault folder or an absolute folder on this system.",
        aliases: ["destination", "directory", "path"],
        control: {
          type: "text",
          key: "outputDir",
          defaultValue: DEFAULT_SETTINGS.outputDir,
          placeholder: DEFAULT_OUTPUT_PLACEHOLDER,
          validate: (value) => {
            const normalized = normalizeStoredOutputPath(value);
            if (!normalized) return "Choose or enter an output folder.";
            if (isMobile && isAbsoluteFilesystemPath(normalized)) {
              return "Absolute system folders are available on desktop only.";
            }
            return undefined;
          },
        },
      },
      {
        name: "Choose vault folder",
        desc: "Select an output folder inside the current vault.",
        aliases: ["browse", "destination", "directory"],
        action: () => this.chooseVaultFolder(),
      },
      {
        name: "Choose system folder",
        desc: "Select an absolute output folder on this computer.",
        aliases: ["browse", "filesystem", "destination", "directory"],
        visible: !isMobile,
        action: () => {
          void this.chooseSystemFolder();
        },
      },
      {
        type: "group",
        heading: "Exported page",
        items: [
          {
            name: "Dark default theme",
            desc: "Use a dark layout by default for exported pages.",
            aliases: ["appearance", "color scheme"],
            control: {
              type: "toggle",
              key: "darkMode",
              defaultValue: DEFAULT_SETTINGS.darkMode,
            },
          },
          {
            name: "Show minimap",
            desc: "Include a minimap with the current viewport on the canvas page.",
            aliases: ["navigation", "overview"],
            control: {
              type: "toggle",
              key: "showMinimap",
              defaultValue: DEFAULT_SETTINGS.showMinimap,
            },
          },
          {
            name: "Show search",
            desc: "Include search with a result list and node navigation.",
            aliases: ["find", "search overlay"],
            control: {
              type: "toggle",
              key: "showSearch",
              defaultValue: DEFAULT_SETTINGS.showSearch,
            },
          },
          {
            name: "Folding",
            desc: "Start with folding switched off, start enabled and fully expanded, or import the current state from the optional Canvas Folding plugin.",
            aliases: ["canvas folding", "tree", "collapsed branches"],
            control: {
              type: "dropdown",
              key: "foldingInitialState",
              defaultValue: DEFAULT_SETTINGS.foldingInitialState,
              options: FOLDING_INITIAL_STATE_LABELS,
            },
          },
          {
            name: "Syntax highlighting",
            desc: "Choose the color theme for fenced code blocks.",
            aliases: ["code", "highlighting theme"],
            control: {
              type: "dropdown",
              key: "highlightingTheme",
              defaultValue: DEFAULT_SETTINGS.highlightingTheme,
              options: HIGHLIGHTING_THEME_LABELS,
            },
          },
        ],
      },
    ];
  }

  getControlValue(key: string): unknown {
    return this.isPluginSettingKey(key) ? this.plugin.settings[key] : undefined;
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    if (!this.isPluginSettingKey(key)) return;

    switch (key) {
      case "outputDir": {
        const normalized = normalizeStoredOutputPath(typeof value === "string" ? value : "");
        this.plugin.settings.outputDir = normalized || DEFAULT_SETTINGS.outputDir;
        break;
      }
      case "exportFormat": {
        const selected = value as ExportFormatChoice;
        this.plugin.settings.exportFormat = VALID_EXPORT_FORMATS.has(selected)
          ? selected
          : DEFAULT_SETTINGS.exportFormat;
        break;
      }
      case "highlightingTheme": {
        const selected = value as HighlightingThemeChoice;
        this.plugin.settings.highlightingTheme = VALID_HIGHLIGHTING_THEMES.has(selected)
          ? selected
          : DEFAULT_SETTINGS.highlightingTheme;
        break;
      }
      case "foldingInitialState": {
        const selected = value as FoldingInitialStateChoice;
        this.plugin.settings.foldingInitialState = VALID_FOLDING_INITIAL_STATES.has(selected)
          ? selected
          : DEFAULT_SETTINGS.foldingInitialState;
        break;
      }
      case "darkMode":
      case "showMinimap":
      case "showSearch":
        this.plugin.settings[key] = typeof value === "boolean" ? value : DEFAULT_SETTINGS[key];
        break;
    }

    await this.plugin.saveSettings();
  }

  private isPluginSettingKey(key: string): key is PluginSettingKey {
    return Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key);
  }

  private chooseVaultFolder(): void {
    openVaultFolderPicker(this.app, (vaultPath) => {
      void this.updateOutputFolder(vaultPath);
    });
  }

  private async chooseSystemFolder(): Promise<void> {
    const picked = await pickFolderPath();
    if (!picked) return;
    await this.updateOutputFolder(picked);
  }

  private async updateOutputFolder(value: string): Promise<void> {
    const normalized = normalizeStoredOutputPath(value);
    this.plugin.settings.outputDir = normalized || DEFAULT_SETTINGS.outputDir;
    await this.plugin.saveSettings();
    this.update();
  }
}
