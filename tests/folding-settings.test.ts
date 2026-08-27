import assert from "node:assert/strict";
import {
  DEFAULT_FOLDING_INITIAL_STATE,
  normalizeFoldingInitialStateChoice,
} from "../src/folding/types";

assert.equal(DEFAULT_FOLDING_INITIAL_STATE, "none");
assert.equal(normalizeFoldingInitialStateChoice(undefined), "none");
assert.equal(normalizeFoldingInitialStateChoice(""), "none");
assert.equal(normalizeFoldingInitialStateChoice("invalid"), "none");
assert.equal(normalizeFoldingInitialStateChoice("none"), "none");
assert.equal(normalizeFoldingInitialStateChoice("expanded"), "expanded");
assert.equal(normalizeFoldingInitialStateChoice("current"), "current");

console.log("PASS normalizes no folding as the default without replacing explicit choices");
