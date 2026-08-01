export type SupportsCssColor = (value: string) => boolean;

export function normalizeThemeColor(raw: string, supportsColor?: SupportsCssColor): string {
  const value = String(raw || "").trim();
  if (!value) return "";

  const rgbTriplet = value.match(/^(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})$/);
  if (rgbTriplet) {
    const channels = rgbTriplet.slice(1).map((channel) => Math.max(0, Math.min(255, Number(channel))));
    return `rgb(${channels.join(", ")})`;
  }

  if (supportsColor) {
    return supportsColor(value) ? value : "";
  }

  return /^(?:#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})|(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\(.+\)|transparent|currentcolor)$/i.test(value)
    ? value
    : "";
}
