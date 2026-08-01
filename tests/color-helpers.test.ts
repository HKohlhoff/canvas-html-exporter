import assert from "node:assert/strict";
import { normalizeThemeColor } from "../src/helpers/color-helpers";

function test(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    throw error;
  }
}

test("normalizes legacy RGB triplets", () => {
  assert.equal(normalizeThemeColor("233, 49, 71"), "rgb(233, 49, 71)");
  assert.equal(normalizeThemeColor("999, 2, 3"), "rgb(255, 2, 3)");
});

test("keeps modern CSS color functions", () => {
  assert.equal(normalizeThemeColor("oklch(62% 0.2 25)"), "oklch(62% 0.2 25)");
  assert.equal(normalizeThemeColor("color(display-p3 1 0.2 0.1)"), "color(display-p3 1 0.2 0.1)");
  assert.equal(normalizeThemeColor("hsl(20 80% 50%)"), "hsl(20 80% 50%)");
});

test("uses browser validation when available", () => {
  const supportsOnlyOklch = (value: string) => value.startsWith("oklch(");
  assert.equal(normalizeThemeColor("oklch(62% 0.2 25)", supportsOnlyOklch), "oklch(62% 0.2 25)");
  assert.equal(normalizeThemeColor("red", supportsOnlyOklch), "");
});

test("rejects empty and unsafe color values", () => {
  assert.equal(normalizeThemeColor(""), "");
  assert.equal(normalizeThemeColor("red; } body { display: none"), "");
  assert.equal(normalizeThemeColor("not-a-color"), "");
});
