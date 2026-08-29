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
assert.ok(
  CURRENT_RELEASE_NOTES_MARKDOWN.includes(
    `Canvas HTML Exporter ${manifest.version}`,
  ),
);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Advanced Canvas compatibility/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Advanced Canvas is not required/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /\.canvas.*file/su);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /currently looks simpler in Obsidian/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /does not remove its stored/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /## More of your Canvas appearance in HTML/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Built-in shapes/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Borders and alignment/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /filled, outline/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Style Settings/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Collapsible groups/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Advanced Canvas Attributes\.canvas/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Floating edges, portals/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /a-star/);
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
