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
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Consistent group folding/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /aligns group folding[\s\S]*latest Canvas[\s\S]*Folding release, version 1\.2\.8/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /consistently in Obsidian and\s+in the exported page/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /directly to the right of its name/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Empty groups/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /only its name and control remain visible/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Other groups remain independent/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /above crossing connections/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Export the original Canvas again/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /connections are hidden together/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /marked as\s+read\s+only after you close/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /never modifies the source[\s\S]*\.canvas[\s\S]*file/);
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
