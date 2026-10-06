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
assert.equal(CURRENT_RELEASE_NOTES_ID, expectedReleaseNoteId);
assert.ok(CURRENT_RELEASE_NOTES_MARKDOWN.includes(`Canvas HTML Exporter ${manifest.version}`));
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /more faithful Markdown pages/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Standard `==highlights==`/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Obsidian 1\.14 colored highlights/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show inline title/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /file name and the note's own content/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /package folders and single HTML files/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Canvas Folding behavior/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Source Canvases and notes are never changed/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Existing HTML exports do not update themselves/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /marked as read only after you close/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show last update/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /https:\/\/ko-fi\.com\/hokdev/);
assert.equal(
  readFileSync("Last Update.md", "utf8").trim(),
  CURRENT_RELEASE_NOTES_MARKDOWN.trim(),
);
console.log("PASS keeps the transient update note and repository Markdown synchronized");
