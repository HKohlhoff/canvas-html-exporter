import assert from "node:assert/strict";
import {
  CURRENT_RELEASE_NOTES_ID,
  CURRENT_RELEASE_NOTES_MARKDOWN,
} from "../src/release-notes-content";

assert.equal(CURRENT_RELEASE_NOTES_ID, "canvas-folding-integration-v1-dialog");
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Optional Canvas Folding integration/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /same folded branches that are currently shown in Obsidian/);
assert.doesNotMatch(CURRENT_RELEASE_NOTES_MARKDOWN, /API v1/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /No folding by default/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Enable folding/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /prefer \*\*Package folder\*\*/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /No required dependency/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Branch controls/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Visibility-aware fit/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /Improved search feedback/);
assert.match(CURRENT_RELEASE_NOTES_MARKDOWN, /leaves no note or other content file in your Vault/);
console.log("PASS describes the folding feature update without leaving a Vault note");
