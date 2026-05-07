import assert from "node:assert/strict";
import {
  buildUniqueOutputName,
  normalizeFolder,
  safeSegment,
  toExportRelativePath,
} from "../src/export/files";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("sanitizes file name segments", () => {
  assert.equal(safeSegment("Müller & Söhne.pdf"), "Muller-Sohne.pdf");
  assert.equal(safeSegment("  ###  "), "item");
});

test("normalizes output folder values", () => {
  assert.equal(normalizeFolder("/Exports/Test/"), "Exports/Test");
  assert.equal(normalizeFolder("   "), "Canvas-Exports");
});

test("computes export-relative paths", () => {
  assert.equal(
    toExportRelativePath("Canvas-Exports/Test/assets/files/datei.pdf", "Canvas-Exports/Test"),
    "assets/files/datei.pdf",
  );
});

test("builds numbered output names", () => {
  assert.equal(buildUniqueOutputName(7, "Mein Bild", ".png"), "007_Mein-Bild.png");
  assert.equal(buildUniqueOutputName(42, "Résumé", "html"), "042_Resume.html");
});
