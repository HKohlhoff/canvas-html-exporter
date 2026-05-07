import assert from "node:assert/strict";
import {
  embedSizeAttributes,
  normalizeWikiTarget,
  parseEmbedSize,
  parseWikiReference,
  splitTargetSuffix,
} from "../src/helpers/link-helpers";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("parses wiki links with alias", () => {
  const parsed = parseWikiReference("Zielseite|Titel");
  assert.equal(parsed.core, "Zielseite");
  assert.equal(parsed.display, "Titel");
  assert.equal(parsed.size, null);
});

test("parses wiki embeds with size hints", () => {
  const parsed = parseWikiReference("bild.png|320x180");
  assert.equal(parsed.core, "bild.png");
  assert.deepEqual(parsed.size, { width: 320, height: 180 });
});

test("normalizes wrapped wiki syntax", () => {
  assert.equal(normalizeWikiTarget("[[Test]]"), "Test");
  assert.equal(normalizeWikiTarget("![[Ordner/Bild.png]]"), "Ordner/Bild.png");
});

test("parses single width embed size", () => {
  assert.deepEqual(parseEmbedSize("480"), { width: 480 });
});

test("renders embed size attributes", () => {
  assert.equal(embedSizeAttributes({ width: 320, height: 200 }), ' width="320" height="200"');
});

test("splits target suffixes into path and suffix", () => {
  assert.deepEqual(splitTargetSuffix("Ordner/Datei.md#Abschnitt"), {
    path: "Ordner/Datei.md",
    suffix: "#Abschnitt",
  });
  assert.deepEqual(splitTargetSuffix("Ordner/Datei.md?query=1"), {
    path: "Ordner/Datei.md",
    suffix: "?query=1",
  });
});
