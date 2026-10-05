import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CURRENT_RELEASE_NOTES_ID,
  CURRENT_RELEASE_NOTES_MARKDOWN,
} from "../src/release-notes-content";

const manifest = JSON.parse(readFileSync("manifest.json", "utf8")) as {
  version: string;
};
const expectedReleaseNoteId = `release-${manifest.version}`;
const releaseNoteVersion = expectedReleaseNoteId.replace(/^release-/, "");
assert.equal(CURRENT_RELEASE_NOTES_ID, expectedReleaseNoteId);
assert.ok(
  CURRENT_RELEASE_NOTES_MARKDOWN.includes(
    `Canvas HTML Exporter ${releaseNoteVersion}`,
  ),
);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Large Canvases as connected pages/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /overview and\s+several linked Canvases/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /small offline preview/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Circular\s+links remain usable/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Canvases[\s\S]*Pages in this canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Back[\s\S]*returns to the Canvas that owns the file card/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /previous zoom level and\s+visible position are restored/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Search\.\.\.[\s\S]*every Canvas below it/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /complete note text/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Every result names the Canvas it belongs to/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /same query, result information, and usable links/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Package exports use separate HTML pages[\s\S]*Single HTML exports/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Export the main overview Canvas again/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /marked as\s+read\s+only after you close/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /does not alter\s+your source Canvases or notes/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /API v1/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show last update/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /buy me a coffee on\s+Ko-fi/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /https:\/\/ko-fi\.com\/hokdev/);
assert.equal(
  readFileSync("Last Update.md", "utf8").trim(),
  CURRENT_RELEASE_NOTES_MARKDOWN.trim(),
);
console.log("PASS keeps the transient update note and repository Markdown synchronized");
