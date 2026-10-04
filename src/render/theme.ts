import { normalizeThemeColor } from "../helpers/color-helpers";
import type { CanvasNode, NodePalette } from "./types";

const CALLOUT_FALLBACK_COLORS: Record<string, string> = {
  note: "#4a9eff",
  info: "#4a9eff",
  todo: "#4a9eff",
  abstract: "#4a9eff",
  summary: "#4a9eff",
  tldr: "#4a9eff",
  tip: "#4ade80",
  hint: "#4ade80",
  important: "#4ade80",
  success: "#4ade80",
  check: "#4ade80",
  done: "#4ade80",
  warning: "#f59e0b",
  caution: "#f59e0b",
  attention: "#f59e0b",
  question: "#f59e0b",
  help: "#f59e0b",
  faq: "#f59e0b",
  danger: "#ef4444",
  error: "#ef4444",
  failure: "#ef4444",
  fail: "#ef4444",
  missing: "#ef4444",
  bug: "#ef4444",
  example: "#a855f7",
  quote: "#94a3b8",
  cite: "#94a3b8",
  settings: "#8a8f98",
  award: "#8a8f98",
};

const OBSIDIAN_COLORS: Record<string, NodePalette> = {
  "1": { background: "#e6324222", border: "#e63242" },
  "2": { background: "#fa8d3e22", border: "#fa8d3e" },
  "3": { background: "#f9c74f22", border: "#f9c74f" },
  "4": { background: "#56ae6c22", border: "#56ae6c" },
  "5": { background: "#04a5e522", border: "#04a5e5" },
  "6": { background: "#9c6bae22", border: "#9c6bae" },
};

export function resolveNodeColors(
  node: CanvasNode,
  theme: ReturnType<typeof getTheme>,
  canvasColors?: Record<string, string>,
): { background: string; border: string; minimapFill: string; minimapStroke: string } {
  const type = (node.type || "text").toLowerCase();
  const colorKey = String(node.color || "").trim();
  const isNumericColor = /^\d+$/.test(colorKey);
  const customPaletteColor = isNumericColor
    ? normalizeCssColorValue(canvasColors?.[colorKey] || "")
    : "";
  const fallbackBackground = type === "group" ? theme.groupBackground : theme.nodeBackground;
  const fallbackBorder = type === "group" ? theme.groupBorder : theme.nodeBorder;
  const fallbackMinimapFill = type === "group"
    ? (theme.darkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)")
    : (theme.darkMode ? "rgba(255,255,255,0.14)" : "rgba(36,48,61,0.08)");

  if (isNumericColor && customPaletteColor) {
    const bgVar = `--canvas-color-${colorKey}-bg`;
    const borderVar = `--canvas-color-${colorKey}`;
    const fallbackPalette = OBSIDIAN_COLORS[colorKey] || { background: fallbackBackground, border: fallbackBorder };
    const softBackground = `var(${bgVar}, ${fallbackPalette.background})`;
    return {
      background: type === "group"
        ? softBackground
        : buildOpaqueNodeBackground(softBackground, theme.nodeBackground),
      border: `var(${borderVar}, ${fallbackPalette.border})`,
      minimapFill: toSoftBackground(customPaletteColor),
      minimapStroke: customPaletteColor,
    };
  }

  if (isNumericColor) {
    const palette = OBSIDIAN_COLORS[colorKey] || { background: fallbackBackground, border: fallbackBorder };
    return {
      background: type === "group"
        ? palette.background
        : buildOpaqueNodeBackground(palette.background, theme.nodeBackground),
      border: palette.border,
      minimapFill: palette.background,
      minimapStroke: palette.border,
    };
  }

  if (colorKey.startsWith("#")) {
    const softBackground = `${colorKey}22`;
    return {
      background: type === "group"
        ? softBackground
        : buildOpaqueNodeBackground(softBackground, theme.nodeBackground),
      border: colorKey,
      minimapFill: toSoftBackground(colorKey),
      minimapStroke: colorKey,
    };
  }

  return {
    background: fallbackBackground,
    border: fallbackBorder,
    minimapFill: fallbackMinimapFill,
    minimapStroke: fallbackBorder,
  };
}

function buildOpaqueNodeBackground(softBackground: string, solidBackground: string): string {
  return `linear-gradient(${softBackground}, ${softBackground}), ${solidBackground}`;
}

export function buildCanvasColorVariables(canvasColors?: Record<string, string>): string {
  const parts: string[] = [];
  const source = canvasColors ?? {};
  for (const [key, raw] of Object.entries(source)) {
    const normalizedKey = String(key).trim();
    if (!normalizedKey) continue;
    const color = normalizeCssColorValue(raw);
    if (!color) continue;
    const bg = toSoftBackground(color);
    parts.push(`--canvas-color-${normalizedKey}: ${color};`);
    parts.push(`--canvas-color-${normalizedKey}-bg: ${bg};`);
  }
  return parts.join(" ");
}

export function buildCanvasEdgeColorMap(canvasColors?: Record<string, string>): Record<string, string> {
  const result = Object.fromEntries(
    Object.entries(OBSIDIAN_COLORS).map(([key, value]) => [key, value.border]),
  );
  for (const [rawKey, rawColor] of Object.entries(canvasColors ?? {})) {
    const key = String(rawKey).trim();
    if (!/^\d+$/.test(key)) continue;
    const color = normalizeCssColorValue(rawColor);
    if (color) result[key] = color;
  }
  return result;
}

export function indentCssBlock(css: string, spaces: number): string {
  const indent = " ".repeat(spaces);
  return css.split("\n").map((line) => line ? `${indent}${line}` : line).join("\n");
}

export function buildCalloutCss(calloutColors?: Record<string, string>): string {
  const types = [
    "note",
    "info",
    "todo",
    "abstract",
    "summary",
    "tldr",
    "tip",
    "hint",
    "important",
    "success",
    "check",
    "done",
    "warning",
    "caution",
    "attention",
    "question",
    "help",
    "faq",
    "danger",
    "error",
    "failure",
    "fail",
    "missing",
    "bug",
    "example",
    "quote",
    "cite",
    "settings",
    "award",
  ];

  return types.map((type) => {
    const color = resolveCalloutColor(type, calloutColors);
    return `.callout-${type} { border-color: ${color}; }\n.callout-${type} .callout-title { background: ${toSoftBackground(color)}; color: ${color}; }`;
  }).join("\n");
}

export function buildHeadingColorCss(prefix: string, headingColors?: Record<string, string>): string {
  const rules: string[] = [];
  for (const level of ["h1", "h2", "h3", "h4", "h5", "h6"]) {
    const color = normalizeCssColorValue(headingColors?.[level] || "");
    if (!color) continue;
    rules.push(`${prefix}${level} { color: ${color}; }`);
  }
  return rules.join("\n");
}

export function buildInlineStyleCss(
  prefix: string,
  inlineStyleColors: Record<string, string> | undefined,
  options: { strongFallbackColor?: string } = {},
): string {
  const strongColor = normalizeCssColorValue(inlineStyleColors?.strong || "") || normalizeCssColorValue(options.strongFallbackColor || "");
  const emColor = normalizeCssColorValue(inlineStyleColors?.em || "");
  const delColor = normalizeCssColorValue(inlineStyleColors?.del || "");
  const rules = [
    `${prefix}strong { font-weight: 700;${strongColor ? ` color: ${strongColor};` : ""} }`,
    `${prefix}em { font-style: italic;${emColor ? ` color: ${emColor};` : ""} }`,
    `${prefix}del { text-decoration: line-through;${delColor ? ` color: ${delColor};` : ""} }`,
  ];
  return rules.join("\n");
}

function resolveCalloutColor(type: string, calloutColors?: Record<string, string>): string {
  const key = String(type || "").toLowerCase();
  return normalizeCssColorValue(calloutColors?.[key] || "") || CALLOUT_FALLBACK_COLORS[key] || "#8a8f98";
}

export function scopeCalloutCss(css: string, prefix: string): string {
  return css
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return line;
      const braceIndex = line.indexOf("{");
      if (braceIndex < 0) return line;
      const selectorPart = line.slice(0, braceIndex).trim();
      const bodyPart = line.slice(braceIndex);
      const scopedSelectors = selectorPart
        .split(",")
        .map((selector) => `${prefix}${selector.trim()}`)
        .join(", ");
      return `${scopedSelectors} ${bodyPart}`;
    })
    .join("\n");
}

export function normalizeCssColorValue(value: string): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const rgbMatch = raw.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})(?:\s*,\s*(\d*\.?\d+))?$/);
  if (rgbMatch) {
    const r = clampColor(rgbMatch[1]);
    const g = clampColor(rgbMatch[2]);
    const b = clampColor(rgbMatch[3]);
    if (typeof rgbMatch[4] === "string") {
      const a = Math.max(0, Math.min(1, Number(rgbMatch[4])));
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }
  return normalizeThemeColor(raw);
}

function clampColor(value: string): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(255, Math.round(n)));
}

function toSoftBackground(color: string): string {
  const rgba = colorToRgba(color);
  if (!rgba) return `color-mix(in srgb, ${color} 18%, transparent)`;
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, 0.18)`;
}

function colorToRgba(color: string): { r: number; g: number; b: number; a: number } | null {
  const raw = color.trim();
  const hex = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    const value = hex[1];
    if (value.length === 3 || value.length === 4) {
      const r = parseInt(value[0] + value[0], 16);
      const g = parseInt(value[1] + value[1], 16);
      const b = parseInt(value[2] + value[2], 16);
      const a = value.length === 4 ? parseInt(value[3] + value[3], 16) / 255 : 1;
      return { r, g, b, a };
    }
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    const a = value.length === 8 ? parseInt(value.slice(6, 8), 16) / 255 : 1;
    return { r, g, b, a };
  }
  const rgba = raw.match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const parts = rgba[1].split(",").map((p) => p.trim());
    if (parts.length >= 3) {
      const r = clampColor(parts[0]);
      const g = clampColor(parts[1]);
      const b = clampColor(parts[2]);
      const a = parts.length >= 4 ? Math.max(0, Math.min(1, Number(parts[3]))) : 1;
      return { r, g, b, a };
    }
  }
  return null;
}

export function getTheme(darkMode: boolean) {
  return darkMode
    ? {
        darkMode: true,
        bodyBackground: "#15181d",
        canvasBackground: "#1d2229",
        canvasBorder: "#313843",
        text: "#e7edf5",
        mutedText: "#aeb8c5",
        nodeBackground: "#2b2f36",
        nodeBorder: "#4a5565",
        groupBackground: "rgba(255,255,255,0.03)",
        groupBorder: "#596273",
        link: "#7cb7ff",
        edge: "#aeb8c5",
        rule: "#404855",
        inlineCodeBackground: "rgba(255,255,255,0.08)",
        codeBlockBackground: "rgba(0,0,0,0.28)",
        chipBackground: "rgba(255,255,255,0.06)",
      }
    : {
        darkMode: false,
        bodyBackground: "#f4f6f9",
        canvasBackground: "#ffffff",
        canvasBorder: "#d6dde7",
        text: "#24303d",
        mutedText: "#5f6b7a",
        nodeBackground: "#ffffff",
        nodeBorder: "#c8d0da",
        groupBackground: "rgba(0,0,0,0.03)",
        groupBorder: "#aab5c4",
        link: "#1967d2",
        edge: "#5f6b7a",
        rule: "#d6dde7",
        inlineCodeBackground: "rgba(0,0,0,0.06)",
        codeBlockBackground: "rgba(0,0,0,0.05)",
        chipBackground: "rgba(0,0,0,0.04)",
      };
}
