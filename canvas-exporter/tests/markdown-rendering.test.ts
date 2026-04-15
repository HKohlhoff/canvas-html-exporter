import assert from "node:assert/strict";
import { markdownToHtml } from "../src/converter";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("renders regular callouts with title and content", () => {
  const html = markdownToHtml("> [!note] Hinweis\n> Das ist wichtig.");
  assert.match(html, /class="callout callout-note"/);
  assert.match(html, /class="callout-title"/);
  assert.match(html, /Hinweis/);
  assert.match(html, /Das ist wichtig\./);
});

test("renders collapsible callouts as details blocks", () => {
  const html = markdownToHtml("> [!tip]- Zugeklappt\n> Versteckter Inhalt");
  assert.match(html, /<details class="callout callout-tip">/);
  assert.match(html, /<summary class="callout-title">/);
  assert.match(html, /Versteckter Inhalt/);
});

test("renders markdown links as anchors", () => {
  const html = markdownToHtml("[OpenAI](https://openai.com)");
  assert.match(html, /<a href="https:\/\/openai\.com"/);
  assert.match(html, /target="_blank"/);
});

test("renders markdown images", () => {
  const html = markdownToHtml("![Alt](bild.png)");
  assert.match(html, /<img src="bild\.png" alt="Alt">/);
});

test("keeps wiki links literal for later export rewriting", () => {
  const html = markdownToHtml("[[Zielseite|Titel]] und [[NochEins]]");
  assert.match(html, /\[\[Zielseite\|Titel\]\]/);
  assert.match(html, /\[\[NochEins\]\]/);
});

test("renders fenced code blocks without inline markdown parsing", () => {
  const html = markdownToHtml("```js\n**bold**\n```");
  assert.match(html, /<pre><code class="language-js">\*\*bold\*\*<\/code><\/pre>/);
  assert.doesNotMatch(html, /<strong>/);
});
