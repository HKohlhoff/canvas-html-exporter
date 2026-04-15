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

test("renders inline math as MathML", () => {
  const html = markdownToHtml("Energie: $E=mc^2$.");
  assert.match(html, /<math/);
  assert.doesNotMatch(html, /<code>E=mc\^2<\/code>/);
});

test("renders block math as MathML", () => {
  const html = markdownToHtml("$$\n\\frac{a}{b}\n$$");
  assert.match(html, /<math/);
  assert.match(html, /<mfrac>/);
});

test("keeps inline code literal when it contains math markers", () => {
  const html = markdownToHtml("Code: `$x$`");
  assert.match(html, /<code>\$x\$<\/code>/);
  assert.doesNotMatch(html, /<math/);
});

test("keeps fenced code blocks literal when they contain math markers", () => {
  const html = markdownToHtml("```tex\n$x$\n$$y$$\n```");
  assert.match(html, /<pre><code class="language-tex">\$x\$\n\$\$y\$\$<\/code><\/pre>/);
  assert.doesNotMatch(html, /<math/);
});

test("degrades invalid latex without throwing", () => {
  const html = markdownToHtml("$\\notARealCommand{$");
  assert.match(html, /<code>\\notARealCommand\{<\/code>/);
});
