import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const TEST_DIR = "tests";
const OUTPUT_DIR = ".test-build";
const requestedFiles = process.argv.slice(2);
const availableFiles = fs
  .readdirSync(TEST_DIR, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".test.ts"))
  .map((entry) => entry.name)
  .sort();

const testFiles = requestedFiles.length > 0 ? requestedFiles : availableFiles;
for (const file of testFiles) {
  if (!availableFiles.includes(file)) {
    throw new Error(`Unknown test file: ${file}`);
  }
}

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/bin/tsc");

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });

let exitCode = 1;
try {
  const compileResult = spawnSync(
    process.execPath,
    [tscPath, "-p", "tsconfig.tests.json"],
    { stdio: "inherit" },
  );
  if (compileResult.status !== 0) {
    process.exitCode = compileResult.status ?? 1;
  } else {
    exitCode = 0;
    for (const file of testFiles) {
      const compiledFile = path.join(
        OUTPUT_DIR,
        TEST_DIR,
        file.replace(/\.ts$/, ".js"),
      );
      const testResult = spawnSync(process.execPath, [compiledFile], {
        stdio: "inherit",
      });
      if (testResult.status !== 0) {
        exitCode = testResult.status ?? 1;
        break;
      }
    }
    process.exitCode = exitCode;
  }
} finally {
  fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
