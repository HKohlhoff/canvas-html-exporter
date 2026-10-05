import type { SearchEntry } from "./types";

export function deduplicateSearchEntries(entries: SearchEntry[]): SearchEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (!entry.dedupeKey) return true;
    if (seen.has(entry.dedupeKey)) return false;
    seen.add(entry.dedupeKey);
    return true;
  });
}
