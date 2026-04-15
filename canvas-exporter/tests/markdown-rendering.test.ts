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

test("renders open collapsible callouts with open attribute", () => {
  const html = markdownToHtml("> [!info]+ Offen\n> Sichtbarer Inhalt");
  assert.match(html, /<details class="callout callout-info" open>/);
  assert.match(html, /Sichtbarer Inhalt/);
});

test("renders markdown links as anchors", () => {
  const html = markdownToHtml("[OpenAI](https://openai.com)");
  assert.match(html, /<a href="https:\/\/openai\.com"/);
  assert.match(html, /target="_blank"/);
});

test("adds normalized ids to headings", () => {
  const html = markdownToHtml("## Über Café");
  assert.match(html, /<h2 id="uber-cafe">Über Café<\/h2>/);
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

test("renders unordered lists", () => {
  const html = markdownToHtml("- Eins\n- Zwei");
  assert.match(html, /<ul><li>Eins<\/li><li>Zwei<\/li><\/ul>/);
});

test("renders ordered lists", () => {
  const html = markdownToHtml("1. Alpha\n2. Beta");
  assert.match(html, /<ol><li>Alpha<\/li><li>Beta<\/li><\/ol>/);
});

test("renders markdown tables", () => {
  const html = markdownToHtml("| A | B |\n| --- | ---: |\n| x | y |");
  assert.match(html, /<table>/);
  assert.match(html, /<th>A<\/th>/);
  assert.match(html, /<th style="text-align:right">B<\/th>/);
  assert.match(html, /<td>x<\/td>/);
  assert.match(html, /<td style="text-align:right">y<\/td>/);
});

test("renders plain blockquotes when no callout syntax is present", () => {
  const html = markdownToHtml("> Zitat");
  assert.match(html, /<blockquote><p>Zitat<\/p><\/blockquote>/);
});

test("renders horizontal rules", () => {
  const html = markdownToHtml("Vorher\n\n---\n\nNachher");
  assert.match(html, /<hr>/);
});

test("renders line breaks inside paragraphs", () => {
  const html = markdownToHtml("Erste Zeile\nZweite Zeile");
  assert.match(html, /<p>Erste Zeile<br>\nZweite Zeile<\/p>/);
});

test("escapes special characters in markdown image attributes", () => {
  const html = markdownToHtml('![A "Zitat" & mehr](bild(1).png?x=1&y=2)');
  assert.match(html, /alt="A &quot;Zitat&quot; &amp; mehr"/);
});

test("escapes special characters in markdown link hrefs", () => {
  const html = markdownToHtml('[Link](https://example.com?a=1&b=2"c")');
  assert.match(html, /href="https:\/\/example\.com\?a=1&amp;b=2&quot;c&quot;"/);
});
