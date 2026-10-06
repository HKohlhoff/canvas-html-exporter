export type HeadingColorMap = Record<string, string>;

export function selectDistinctHeadingColors(
  sampledColors: HeadingColorMap,
  textColor: string,
): HeadingColorMap {
  const entries = Object.entries(sampledColors).filter(([, color]) => String(color || "").trim());
  if (!entries.length) return {};

  const normalize = (value: string): string => String(value || "").replace(/\s+/g, "").toLowerCase();
  const normalizedTextColor = normalize(textColor);
  const hasDistinctHeadingColor = entries.some(([, color]) => normalize(color) !== normalizedTextColor);
  return hasDistinctHeadingColor ? Object.fromEntries(entries) : {};
}
