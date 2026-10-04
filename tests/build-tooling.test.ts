import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "canvas-exporter-build-"));
try {
  fs.copyFileSync("build.mjs", path.join(root, "build.mjs"));
  fs.symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"), "dir");
  fs.mkdirSync(path.join(root, "src"));
  fs.mkdirSync(path.join(root, "release"));
  fs.writeFileSync(path.join(root, "src/main.ts"), "export const broken = ;");
  fs.writeFileSync(path.join(root, "main.js"), "old main");
  fs.writeFileSync(path.join(root, "manifest.json"), '{"id":"canvas-html-exporter","version":"9.9.9"}');
  fs.writeFileSync(path.join(root, "styles.css"), "body { color: red; }");
  fs.writeFileSync(path.join(root, "release/main.js"), "reviewed main");
  fs.writeFileSync(path.join(root, "release/manifest.json"), "reviewed manifest");
  const env = { ...process.env, OBSIDIAN_PLUGINS_DIR: "" };
  const run = (args: string[], pluginsDir = "") => spawnSync(process.execPath, ["build.mjs", ...args], { cwd: root, env: { ...env, OBSIDIAN_PLUGINS_DIR: pluginsDir }, encoding: "utf8" });
  assert.notEqual(run(["--production"]).status, 0);
  assert.equal(fs.readFileSync(path.join(root, "release/main.js"), "utf8"), "reviewed main");
  assert.equal(fs.readFileSync(path.join(root, "release/manifest.json"), "utf8"), "reviewed manifest");
  fs.writeFileSync(path.join(root, "src/main.ts"), "export const valid = 42;");
  assert.notEqual(run(["--production", "--deploy"]).status, 0, "missing deployment destination must fail");
  const pluginsDir = path.join(root, "test-vault", "custom-config", "plugins");
  const pluginDir = path.join(pluginsDir, "canvas-html-exporter");
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.writeFileSync(path.join(pluginDir, "data.json"), '{"preserve":true}');
  const built = run(["--production", "--deploy"], pluginsDir);
  assert.equal(built.status, 0, built.stderr);
  for (const file of ["main.js", "manifest.json", "styles.css"]) {
    assert.deepEqual(fs.readFileSync(path.join(root, file)), fs.readFileSync(path.join(root, "release", file)));
    assert.deepEqual(fs.readFileSync(path.join(root, file)), fs.readFileSync(path.join(pluginDir, file)));
  }
  assert.equal(fs.readFileSync(path.join(pluginDir, "data.json"), "utf8"), '{"preserve":true}');
  assert.ok(fs.existsSync(path.join(pluginDir, ".hotreload")));
  console.log("PASS failed builds preserve release artifacts and explicit deployment preserves plugin data");
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}

const manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8")) as { version: string };
for (const tag of [manifest.version, "invalid-tag"]) {
  const result = spawnSync(process.execPath, ["scripts/check-release-metadata.mjs"], { env: { ...process.env, EXPECTED_RELEASE_TAG: tag }, encoding: "utf8" });
  assert.equal(result.status === 0, tag === manifest.version, result.stderr);
}
console.log("PASS release metadata rejects a mismatched publication tag");

const releaseWorkflow = fs.readFileSync(".github/workflows/release.yml", "utf8");
assert.match(
  releaseWorkflow,
  /if gh release view "\$tag" >\/dev\/null 2>&1; then/,
  "release reruns must detect an existing GitHub release",
);
assert.match(
  releaseWorkflow,
  /gh release upload "\$tag" \\\n+\s+--clobber \\\n+\s+release\/main\.js \\\n+\s+release\/manifest\.json \\\n+\s+release\/styles\.css/,
  "release reruns must refresh all reviewed assets without replacing release notes",
);
assert.match(
  releaseWorkflow,
  /gh release create "\$tag" \\\n+\s+--verify-tag/,
  "first publication must create a release only for the pushed tag",
);
console.log("PASS release workflow safely reuses an existing GitHub release");
