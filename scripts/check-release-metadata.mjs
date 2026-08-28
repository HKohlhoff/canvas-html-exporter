import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const manifest = readJson("manifest.json");
const packageData = readJson("package.json");
const packageLock = readJson("package-lock.json");
const versions = readJson("versions.json");
const converterSource = readFileSync("src/render/converter.ts", "utf8");
const styles = readFileSync("styles.css", "utf8");

assert.equal(manifest.id, "canvas-html-exporter");
assert.equal(packageData.name, manifest.id);
assert.equal(packageData.version, manifest.version);
assert.equal(packageLock.version, manifest.version);
assert.equal(packageLock.packages?.[""]?.version, manifest.version);
assert.equal(versions[manifest.version], manifest.minAppVersion);
assert.equal(packageData.description, manifest.description);
assert.equal(packageData.license, "GPL-3.0-or-later");
assert.equal(manifest.isDesktopOnly, true);
assert.equal(manifest.fundingUrl, "https://ko-fi.com/hokdev");
assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
assert.match(manifest.id, /^[a-z][a-z-]*$/);
assert.match(manifest.description, /[.?!)]$/);
assert.ok(manifest.description.length <= 250);
assert.match(
  converterSource,
  new RegExp(`export const EXPORTER_VERSION = ["']${escapeRegExp(manifest.version)}["'];`),
);
assert.match(
  readFileSync("LICENSE", "utf8"),
  /GNU GENERAL PUBLIC LICENSE\s+Version 3/,
);
assert.doesNotMatch(
  styles,
  /!important\b/,
  "styles.css must not use !important; use Obsidian-scoped selector specificity instead",
);

console.log(
  `Release metadata ${manifest.version} for Obsidian ${manifest.minAppVersion}+ is consistent.`,
);

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
