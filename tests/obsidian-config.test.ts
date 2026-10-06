import assert from "node:assert/strict";
import { shouldShowInlineTitle } from "../src/helpers/obsidian-config";

function appWith(getConfig?: (key: string) => unknown): Parameters<typeof shouldShowInlineTitle>[0] {
  return { vault: { getConfig } } as never;
}

assert.equal(shouldShowInlineTitle(appWith(() => true)), true);
assert.equal(shouldShowInlineTitle(appWith(() => false)), false);
assert.equal(shouldShowInlineTitle(appWith()), true);
assert.equal(shouldShowInlineTitle(appWith(() => {
  throw new Error("Unavailable");
})), true);

console.log("PASS reads the inline-title setting with a compatibility fallback");
