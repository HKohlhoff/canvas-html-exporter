import assert from "node:assert/strict";
import {
  buildStoredPluginData,
  PLUGIN_DATA_SCHEMA_VERSION,
  readPluginData,
} from "../src/plugin-data";
import type { PluginSettings } from "../src/settings";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

const settings: PluginSettings = {
  darkMode: false,
  outputDir: "Canvas-Exports",
  exportFormat: "package",
  foldingInitialState: "expanded",
  highlightingTheme: "shiki",
  showMinimap: true,
  showSearch: true,
};

test("reads legacy top-level settings without losing the migration source", () => {
  const legacy = { ...settings };
  assert.deepEqual(readPluginData(legacy), {
    settingsSource: legacy,
    lastShownReleaseNotesId: "",
  });
});

test("reads settings and UI state from versioned plugin data", () => {
  assert.deepEqual(readPluginData({
    schemaVersion: 1,
    settings,
    ui: { lastShownReleaseNotesId: " folding-v1 " },
  }), {
    settingsSource: settings,
    lastShownReleaseNotesId: "folding-v1",
  });
});

test("builds versioned plugin data with normalized release-note state", () => {
  assert.deepEqual(buildStoredPluginData(settings, " folding-v1 "), {
    schemaVersion: PLUGIN_DATA_SCHEMA_VERSION,
    settings,
    ui: { lastShownReleaseNotesId: "folding-v1" },
  });
});
