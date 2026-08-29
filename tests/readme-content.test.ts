import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { prepareReadmeMarkdown } from "../src/ui/readme-content";

const prepared = prepareReadmeMarkdown(
  [
    "![Local screenshot](images/example.png)",
    '<a href="https://example.com"><img src="https://example.com/image.png" alt="Remote"></a>',
    '<a href="https://ko-fi.com/example" target="_blank"><img src="https://storage.ko-fi.com/button.png" alt="Coffee"></a>',
    "[Local document](docs/guide.md)",
    "[Folder](examples/)",
    "[External](https://obsidian.md)",
    "[Section](#usage)",
  ].join("\n"),
  "https://github.com/example/plugin/",
);

assert.doesNotMatch(prepared, /<img|!\[/u);
assert.doesNotMatch(prepared, /Image omitted|Local screenshot|Remote|Coffee/u);
assert.match(
  prepared,
  /\[Support this plugin on Ko-fi\]\(https:\/\/ko-fi\.com\/example\)/u,
);
assert.doesNotMatch(prepared, /storage\.ko-fi\.com/u);
assert.match(
  prepared,
  /https:\/\/github\.com\/example\/plugin\/blob\/master\/docs\/guide\.md/u,
);
assert.match(
  prepared,
  /https:\/\/github\.com\/example\/plugin\/tree\/master\/examples\//u,
);
assert.match(prepared, /\[External\]\(https:\/\/obsidian\.md\)/u);
assert.match(prepared, /\[Section\]\(#usage\)/u);

const actualReadme = prepareReadmeMarkdown(
  readFileSync("README.md", "utf8"),
  "https://github.com/HKohlhoff/canvas-html-exporter",
);
assert.ok(
  actualReadme.includes(
    "The canvas showing the documentation of this plugin, seen in Obsidian, " +
      "looks (nearly) the same in the exported interactive HTML page.",
  ),
);
assert.doesNotMatch(actualReadme, /seen in Obsidian\.\.\.|HTML page\.\.\./u);
assert.doesNotMatch(
  actualReadme,
  /Canvas-HTML-Exporter-Documentation\.html|interactive export example/iu,
);
assert.doesNotMatch(actualReadme, /<img|!\[|Image omitted|\n{3,}/u);
assert.match(
  actualReadme,
  /\[Support this plugin on Ko-fi\]\(https:\/\/ko-fi\.com\/R5R2151DS7\)/u,
);

console.log("PASS prepares the embedded README without automatic image requests");
