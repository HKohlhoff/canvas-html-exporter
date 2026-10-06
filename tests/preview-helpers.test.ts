import assert from "node:assert/strict";
import { buildMarkdownSearchText, buildPreviewText } from "../src/helpers/preview-helpers";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("strips fenced code blocks from preview text", () => {
  const text = buildPreviewText("Einleitung\n```js\nconst x = 1;\n```\nAbschluss");
  assert.equal(text, "Einleitung Abschluss");
});

test("uses wiki aliases and removes markdown links", () => {
  const text = buildPreviewText("[[Ziel|Alias]] und [Link](https://example.com)");
  assert.equal(text, "Alias und");
});

test("preserves embed targets as plain text labels", () => {
  const text = buildPreviewText("Bild ![[grafik.png]] und ![Alt](bild.png)");
  assert.equal(text, "Bild grafik.png und");
});

test("collapses markdown punctuation and whitespace", () => {
  const text = buildPreviewText("# Titel\n> **Wichtig** _hier_");
  assert.equal(text, "Titel Wichtig hier");
});

test("indexes prose but excludes every link form from markdown search text", () => {
  const text = buildMarkdownSearchText([
    "Der eigene Inhalt bleibt sichtbar.",
    "[[Orte/Wald|Korb im Alias]] ![[Anhang/Korb.png]]",
    "[Korb als Link](https://example.com/korb) ![Korb im Bild](bilder/korb.png)",
    "<https://example.com/korb> https://example.com/noch-ein-korb",
  ].join("\n"));
  assert.equal(text, "Der eigene Inhalt bleibt sichtbar.");
});
