import assert from "node:assert/strict";
import { markdownToHtml } from "../src/converter";

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
await test("renders inline math as MathML", async () => {
  const html = await markdownToHtml("Energie: $E=mc^2$.");
  assert.match(html, /<math/);
  assert.doesNotMatch(html, /<code>E=mc\^2<\/code>/);
});

await test("renders block math as MathML", async () => {
  const html = await markdownToHtml("$$\n\\frac{a}{b}\n$$");
  assert.match(html, /<math/);
  assert.match(html, /<mfrac>/);
});

await test("keeps inline code literal when it contains math markers", async () => {
  const html = await markdownToHtml("Code: `$x$`");
  assert.match(html, /<code>\$x\$<\/code>/);
  assert.doesNotMatch(html, /<math/);
});

await test("treats escaped dollar signs as literal text before inline math", async () => {
  const html = await markdownToHtml(
    "steht in einfachen \\$-Zeichen und zeigt z.B. $\\nu = \\frac{\\omega}{2\\pi}$ eine Formel",
  );
  assert.match(html, /einfachen \$-Zeichen und zeigt z\.B\./);
  assert.match(html, /<math/);
  assert.match(html, /<mi>\u03bd<\/mi>/);
});

await test("keeps fenced code blocks literal when they contain math markers", async () => {
  const html = await markdownToHtml("```tex\n$x$\n$$y$$\n```");
  assert.match(html, /class="shiki|<pre><code class="language-tex">/);
  assert.match(html, />x</);
  assert.match(html, />y</);
  assert.doesNotMatch(html, /<math/);
});

await test("degrades invalid latex without throwing", async () => {
  const html = await markdownToHtml("$\\notARealCommand{$");
  assert.match(html, /<code>\\notARealCommand\{<\/code>/);
});
})();
