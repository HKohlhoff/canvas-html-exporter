import type { PluginSettings } from "./settings";

export const PLUGIN_DATA_SCHEMA_VERSION = 1;

export type PluginDataSnapshot = {
  lastShownReleaseNotesId: string;
  settingsSource: unknown;
};

export type StoredPluginData = {
  schemaVersion: typeof PLUGIN_DATA_SCHEMA_VERSION;
  settings: PluginSettings;
  ui: {
    lastShownReleaseNotesId: string;
  };
};

export function readPluginData(saved: unknown): PluginDataSnapshot {
  const data = asRecord(saved);
  const ui = asRecord(data.ui);
  const settingsSource = data.settings && typeof data.settings === "object"
    ? data.settings
    : saved;

  return {
    settingsSource,
    lastShownReleaseNotesId: typeof ui.lastShownReleaseNotesId === "string"
      ? ui.lastShownReleaseNotesId.trim()
      : "",
  };
}

export function buildStoredPluginData(
  settings: PluginSettings,
  lastShownReleaseNotesId: string,
): StoredPluginData {
  return {
    schemaVersion: PLUGIN_DATA_SCHEMA_VERSION,
    settings,
    ui: {
      lastShownReleaseNotesId: lastShownReleaseNotesId.trim(),
    },
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
}
