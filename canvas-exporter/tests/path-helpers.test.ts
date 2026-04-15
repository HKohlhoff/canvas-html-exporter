import assert from "node:assert/strict";
import { getHrefForMarkdownPage, pathRelative } from "../src/path-helpers";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("builds relative path within same directory tree", () => {
  assert.equal(
    getHrefForMarkdownPage(
      "Canvas-Exports/Test/assets/files/seite-a.html",
      "Canvas-Exports/Test/assets/files/seite-b.html",
    ),
    "seite-b.html",
  );
});

test("builds relative path across sibling folders", () => {
  assert.equal(
    getHrefForMarkdownPage(
      "Canvas-Exports/Test/assets/files/notizen/quelle.html",
      "Canvas-Exports/Test/assets/images/bild.png",
    ),
    "../../images/bild.png",
  );
});

test("computes upward relative paths", () => {
  assert.equal(
    pathRelative("Canvas-Exports/Test/assets/files/notizen", "Canvas-Exports/Test/index.html"),
    "../../../index.html",
  );
});

test("normalizes slashes in relative hrefs", () => {
  assert.equal(
    getHrefForMarkdownPage("Canvas-Exports\\Test\\a.html", "Canvas-Exports\\Test\\ordner\\b.html"),
    "ordner/b.html",
  );
});
