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
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /A major step for connected Canvas projects/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /introduces three substantial new capabilities/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /structured,\s+navigable publication/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /one crowded Canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /optional\s+Navigation panel/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /choice is passed from the main overview/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /independently on every Canvas and file page/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /individual choice\s+is remembered/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /navigate the complete structure/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /small offline preview/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Circular links\s+remain usable/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /complete, interactive page/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Canvases[\s\S]*Pages in this canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Back[\s\S]*returns to its owning subcanvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /zoom level and visible position/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Refined deep search/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Search no longer stops/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Canvas nodes, pages belonging to\s+those Canvases/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /complete text of Markdown notes/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Every result also names its owning Canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /same query and\s+reopen Search/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /same exported page is referenced more than once/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /package folders and single HTML files/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /substantial gain/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Export the main overview Canvas again/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /marked as\s+read\s+only after you close/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /source Canvases and notes\s+are never changed/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /API v1/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /multi-Canvas|Vault file|Open canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Show last update/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /buy me a coffee on\s+Ko-fi/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /https:\/\/ko-fi\.com\/hokdev/);
assert.equal(
  readFileSync("Last Update.md", "utf8").trim(),
  CURRENT_RELEASE_NOTES_MARKDOWN.trim(),
);
console.log("PASS keeps the transient update note and repository Markdown synchronized");
