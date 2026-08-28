import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURRENT_RELEASE_NOTES_ID,
  CURRENT_RELEASE_NOTES_MARKDOWN,
} from "../src/release-notes-content";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8")) as {
  version: string;
};
assert.equal(CURRENT_RELEASE_NOTES_ID, `release-${manifest.version}`);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Canvas HTML Exporter 1\.2\.0/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Optional Canvas Folding integration/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /same folded branches that are currently shown in Obsidian/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /API v1/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /No folding by default/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Enable folding/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /prefer \*\*Package folder\*\*/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /hidden descendant nodes/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Hide\/Show folding controls/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /No required dependency/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Branch controls/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Visibility-aware fit/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Improved search feedback/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show last update/);
assert.equal(
  readFileSync("Last Update.md", "utf8").trim(),
  CURRENT_RELEASE_NOTES_MARKDOWN.trim(),
);
console.log("PASS keeps the transient update note and repository Markdown synchronized");
