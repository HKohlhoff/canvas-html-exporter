import assert from "node:assert/strict";
import { deduplicateSearchEntries } from "../src/render/search-entries";
import type { SearchEntry } from "../src/render/types";

function entry(id: string, dedupeKey?: string): SearchEntry {
  return {
    id,
    title: id,
    snippet: id,
    text: id,
    kindLabel: "Markdown",
    positionLabel: "Canvas",
    dedupeKey,
  };
}

const results = deduplicateSearchEntries([
  entry("local", "file:notes/identity.md"),
  entry("descendant", "file:notes/identity.md"),
  entry("text-a"),
  entry("text-b"),
]);

assert.deepEqual(results.map((result) => result.id), ["local", "text-a", "text-b"]);
console.log("PASS deduplicates file-backed search results while preserving distinct text cards");
