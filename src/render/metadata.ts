import type { HighlightingThemeChoice } from "./types";

export const EXPORTER_VERSION = "1.5.0";

export const EXPORTER_SIGNATURE = `canvas-html-exporter v${EXPORTER_VERSION}`;

export function buildExporterBuildMeta(highlightingTheme: HighlightingThemeChoice | undefined): string {
  return `${EXPORTER_VERSION}-${highlightingTheme || "shiki"}`;
}
