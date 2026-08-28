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
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /This major update turns an exported Canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /## New interactive tools/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /## Improvements to existing exports/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Folding in every export/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /same folded branches currently shown in Obsidian/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /plugin is installed and enabled/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /works only while Canvas Folding is active/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /API v1/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Unobtrusive default/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Enable folding/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Package folder.*recommended format/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /how many content nodes are hidden/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /branch control stays visible but disabled/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /shown or hidden independently/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /safely creates a normal, fully usable export/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Smarter reset and fit/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Clearer search feedback/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Area zoom/);
assert.ok(
  CURRENT_RELEASE_NOTES_MARKDOWN.indexOf("Unobtrusive default") <
    CURRENT_RELEASE_NOTES_MARKDOWN.indexOf("Optional state transfer with Canvas Folding"),
);
assert.ok(
  CURRENT_RELEASE_NOTES_MARKDOWN.indexOf("Optional state transfer with Canvas Folding") <
    CURRENT_RELEASE_NOTES_MARKDOWN.indexOf("## Improvements to existing exports"),
);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show last update/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /buy me a coffee on Ko-fi/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /https:\/\/ko-fi\.com\/hokdev/);
assert.equal(
  readFileSync("Last Update.md", "utf8").trim(),
  CURRENT_RELEASE_NOTES_MARKDOWN.trim(),
);
console.log("PASS keeps the transient update note and repository Markdown synchronized");
