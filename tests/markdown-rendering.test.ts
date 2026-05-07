import assert from "node:assert/strict";
import { buildBlockAnchorId, markdownToHtml } from "../src/converter";

function countDistinctHighlightColors(html: string): number {
  const matches = html.match(/style="color:#([0-9A-Fa-f]{6})/g) || [];
  return new Set(matches).size;
}

function test(name: string, fn: () => Promise<void> | void): Promise<void> | void {
  try {
    const result = fn();
    if (result && typeof (result as Promise<void>).then === "function") {
      return (result as Promise<void>).then(
        () => console.log(`PASS ${name}`),
        (error) => {
          console.error(`FAIL ${name}`);
          throw error;
        },
      );
    }
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

(async () => {
await test("renders regular callouts with title and content", async () => {
  const html = await markdownToHtml("> [!note] Hinweis\n> Das ist wichtig.");
  assert.match(html, /class="callout callout-note"/);
  assert.match(html, /class="callout-title"/);
  assert.match(html, /class="callout-icon" data-icon="pencil-alt"/);
  assert.match(html, /<svg viewBox="0 0 24 24"/);
  assert.match(html, /Hinweis/);
  assert.match(html, /Das ist wichtig\./);
});

await test("renders collapsible callouts as details blocks", async () => {
  const html = await markdownToHtml("> [!tip]- Zugeklappt\n> Versteckter Inhalt");
  assert.match(html, /<details class="callout callout-tip">/);
  assert.match(html, /<summary class="callout-title">/);
  assert.match(html, /Versteckter Inhalt/);
});

await test("renders open collapsible callouts with open attribute", async () => {
  const html = await markdownToHtml("> [!info]+ Offen\n> Sichtbarer Inhalt");
  assert.match(html, /<details class="callout callout-info" open>/);
  assert.match(html, /Sichtbarer Inhalt/);
});

await test("renders markdown links as anchors", async () => {
  const html = await markdownToHtml("[OpenAI](https://openai.com)");
  assert.match(html, /<a href="https:\/\/openai\.com"/);
  assert.match(html, /target="_blank"/);
});

await test("auto-links bare urls", async () => {
  const html = await markdownToHtml("Mehr Infos unter https://example.com/docs.");
  assert.match(html, /<a href="https:\/\/example\.com\/docs" target="_blank" rel="noopener noreferrer">https:\/\/example\.com\/docs<\/a>\./);
});

await test("adds normalized ids to headings", async () => {
  const html = await markdownToHtml("## Über Café");
  assert.match(html, /<details class="heading-section heading-section-h2" open>/);
  assert.match(html, /<summary class="heading-summary"><h2 id="uber-cafe">Über Café<\/h2><\/summary>/);
  assert.match(html, /<h2 id="uber-cafe">Über Café<\/h2>/);
});

await test("wraps h1 through h6 sections as collapsible heading details", async () => {
  const html = await markdownToHtml("# Titel\nIntro\n## Abschnitt\nText\n###### Klein");
  assert.match(html, /<details class="heading-section heading-section-h1" open><summary class="heading-summary"><h1 id="titel">Titel<\/h1><\/summary>/);
  assert.match(html, /<details class="heading-section heading-section-h2" open><summary class="heading-summary"><h2 id="abschnitt">Abschnitt<\/h2><\/summary>/);
  assert.match(html, /<details class="heading-section heading-section-h6" open><summary class="heading-summary"><h6 id="klein">Klein<\/h6><\/summary>/);
});

await test("adds anchor ids for standalone block references", async () => {
  const html = await markdownToHtml("Wichtiger Absatz\n^kern-aussage");
  assert.equal(buildBlockAnchorId("^kern-aussage"), "block-kern-aussage");
  assert.match(html, /<p id="block-kern-aussage">Wichtiger Absatz<\/p>/);
  assert.doesNotMatch(html, /\^kern-aussage/);
});

await test("renders markdown images", async () => {
  const html = await markdownToHtml("![Alt](bild.png)");
  assert.match(html, /<img src="bild\.png" alt="Alt">/);
});

await test("keeps wiki links literal for later export rewriting", async () => {
  const html = await markdownToHtml("[[Zielseite|Titel]] und [[NochEins]]");
  assert.match(html, /\[\[Zielseite\|Titel\]\]/);
  assert.match(html, /\[\[NochEins\]\]/);
});

await test("renders fenced code blocks without inline markdown parsing", async () => {
  const html = await markdownToHtml("```js\n**bold**\n```");
  assert.match(html, /class="shiki/);
  assert.match(html, />bold<\/span>/);
  assert.doesNotMatch(html, /<strong>/);
});

await test("does not treat hash comments inside fenced code as headings", async () => {
  const html = await markdownToHtml("# Abschnitt\n```python\n# Kommentar\nprint('hi')\n```\nWeiter");
  assert.match(html, /<details class="heading-section heading-section-h1" open>/);
  assert.match(html, /class="shiki/);
  assert.match(html, /># Kommentar<\/span>|># Kommentar</);
  assert.match(html, /print/);
  assert.match(html, /<p>Weiter<\/p>/);
  assert.doesNotMatch(html, /id="kommentar"/);
  assert.doesNotMatch(html, /heading-section-h1" open><summary class="heading-summary"><h1 id="kommentar"/);
});

await test("treats csharp fences as code blocks", async () => {
  const html = await markdownToHtml(
    "```c#\nusing System;\nstatic void Main(string[] args)\n{\n    Console.WriteLine(\"Hello World!\");\n}\n```",
  );
  assert.match(html, /class="shiki/);
  assert.match(html, />using</);
  assert.match(html, /> System</);
  assert.match(html, /string/);
  assert.match(html, /\[\]/);
  assert.match(html, />args</);
  assert.match(html, /Console/);
  assert.match(html, />WriteLine</);
  assert.doesNotMatch(html, /<p>using System;/);
});

await test("highlights sql and php fences with shiki", async () => {
  const sqlHtml = await markdownToHtml("```sql\nselect * from users;\n```");
  const phpHtml = await markdownToHtml("```php\n<?php echo 'hi';\n```");

  assert.match(sqlHtml, /class="shiki/);
  assert.ok(countDistinctHighlightColors(sqlHtml) >= 2);
  assert.match(phpHtml, /class="shiki/);
  assert.match(phpHtml, /&#x3C;\?|&#x3C;<\/span><span[^>]*>\?/);
  assert.ok(countDistinctHighlightColors(phpHtml) >= 3);
});

await test("highlights tex and latex fences with shiki", async () => {
  const texHtml = await markdownToHtml("```tex\n\\\\frac{a}{b}\n```");
  const latexHtml = await markdownToHtml("```latex\n\\\\section{Intro}\n```");

  assert.match(texHtml, /class="shiki/);
  assert.match(texHtml, /frac\{a\}\{b\}/);
  assert.match(latexHtml, /class="shiki/);
  assert.match(latexHtml, /section\{Intro\}/);
});

await test("supports alternate highlighting themes", async () => {
  const vscodeHtml = await markdownToHtml("```sql\nselect 1;\n```", { darkMode: false, highlightingTheme: "vscode" });
  const catppuccinHtml = await markdownToHtml("```sql\nselect 1;\n```", { darkMode: false, highlightingTheme: "catppuccin" });
  const materialHtml = await markdownToHtml("```sql\nselect 1;\n```", { darkMode: false, highlightingTheme: "material" });

  assert.match(vscodeHtml, /class="shiki light-plus"/);
  assert.match(catppuccinHtml, /class="shiki catppuccin-latte"/);
  assert.match(materialHtml, /class="shiki material-theme-lighter"/);
});

await test("renders unordered lists", async () => {
  const html = await markdownToHtml("- Eins\n- Zwei");
  assert.match(html, /<ul><li>Eins<\/li><li>Zwei<\/li><\/ul>/);
});

await test("ends unordered lists before unindented paragraph lines", async () => {
  const html = await markdownToHtml("- Eins\nzweite Zeile\n- Zwei");
  assert.equal(html, "<ul><li>Eins</li></ul>\n<p>zweite Zeile</p>\n<ul><li>Zwei</li></ul>");
});

await test("keeps indented continuation lines inside unordered list items", async () => {
  const html = await markdownToHtml("- Eins\n  zweite Zeile\n- Zwei");
  assert.equal(html, "<ul><li>Eins<br>\nzweite Zeile</li><li>Zwei</li></ul>");
});

await test("keeps hard line breaks inside unordered list items without rendering the marker", async () => {
  const html = await markdownToHtml("- Eins\\\nzweite Zeile\n- Zwei");
  assert.equal(html, "<ul><li>Eins<br>\nzweite Zeile</li><li>Zwei</li></ul>");
});

await test("keeps two-space hard line breaks inside unordered list items without rendering the marker", async () => {
  const html = await markdownToHtml("- Eins  \nzweite Zeile\n- Zwei");
  assert.equal(html, "<ul><li>Eins<br>\nzweite Zeile</li><li>Zwei</li></ul>");
});

await test("renders ordered lists", async () => {
  const html = await markdownToHtml("1. Alpha\n2. Beta");
  assert.match(html, /<ol><li>Alpha<\/li><li>Beta<\/li><\/ol>/);
});

await test("renders markdown tables", async () => {
  const html = await markdownToHtml("| A | B |\n| --- | ---: |\n| x | y |");
  assert.match(html, /<table>/);
  assert.match(html, /<th>A<\/th>/);
  assert.match(html, /<th style="text-align:right">B<\/th>/);
  assert.match(html, /<td>x<\/td>/);
  assert.match(html, /<td style="text-align:right">y<\/td>/);
});

await test("renders plain blockquotes when no callout syntax is present", async () => {
  const html = await markdownToHtml("> Zitat");
  assert.match(html, /<blockquote><p>Zitat<\/p><\/blockquote>/);
});

await test("renders horizontal rules", async () => {
  const html = await markdownToHtml("Vorher\n\n---\n\nNachher");
  assert.match(html, /<hr>/);
});

await test("renders line breaks inside paragraphs", async () => {
  const html = await markdownToHtml("Erste Zeile\nZweite Zeile");
  assert.match(html, /<p>Erste Zeile<br>\nZweite Zeile<\/p>/);
});

await test("renders escaped markdown punctuation as literal characters", async () => {
  const html = await markdownToHtml("Zeige \\*Stern\\*, \\_Unterstrich\\_, \\[Klammer\\] und \\$5.");
  assert.equal(html, "<p>Zeige *Stern*, _Unterstrich_, [Klammer] und $5.</p>");
  assert.doesNotMatch(html, /<em>/);
});

await test("escapes special characters in markdown image attributes", async () => {
  const html = await markdownToHtml('![A "Zitat" & mehr](bild(1).png?x=1&y=2)');
  assert.match(html, /alt="A &quot;Zitat&quot; &amp; mehr"/);
});

await test("escapes special characters in markdown link hrefs", async () => {
  const html = await markdownToHtml('[Link](https://example.com?a=1&b=2"c")');
  assert.match(html, /href="https:\/\/example\.com\?a=1&amp;b=2&quot;c&quot;"/);
});
})();
