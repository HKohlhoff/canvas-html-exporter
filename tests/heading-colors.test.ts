import assert from "node:assert/strict";
import { selectDistinctHeadingColors } from "../src/helpers/heading-colors";

assert.deepEqual(selectDistinctHeadingColors({}, "rgb(36, 48, 61)"), {});
assert.deepEqual(selectDistinctHeadingColors({
  h1: "rgb(36, 48, 61)",
  h2: "rgb(36,48,61)",
}, "rgb(36, 48, 61)"), {});
assert.deepEqual(selectDistinctHeadingColors({
  h1: "rgb(233, 49, 71)",
  h2: "rgb(36, 48, 61)",
}, "rgb(36, 48, 61)"), {
  h1: "rgb(233, 49, 71)",
  h2: "rgb(36, 48, 61)",
});

console.log("PASS exports only heading colors that are distinct from normal text");
