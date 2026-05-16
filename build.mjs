import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const isProd = process.argv.includes("--production");
const watchMode = process.argv.includes("--watch");
const deployMode = process.argv.includes("--deploy");

const RELEASE_DIR = "release";
const ENTRY = "src/main.ts";
const PLUGIN_ID = "canvas-html-exporter";

const OBSIDIAN_PLUGINS_DIR = process.env.OBSIDIAN_PLUGINS_DIR || "";

function resolveVaultPluginDir(pluginsDirOrPluginDir, pluginId) {
  if (!pluginsDirOrPluginDir) return "";

  const normalizedPath = path.resolve(pluginsDirOrPluginDir);
  if (path.basename(normalizedPath) === pluginId) {
    return normalizedPath;
  }

  return path.join(normalizedPath, pluginId);
}

const VAULT_PLUGIN_DIR = resolveVaultPluginDir(OBSIDIAN_PLUGINS_DIR, PLUGIN_ID);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeCopy(src, dst) {
  if (!fs.existsSync(src)) return false;
  ensureDir(path.dirname(dst));
  fs.copyFileSync(src, dst);
  return true;
}

function removeIfExists(file) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    return true;
  }
  return false;
}

function removeIfMissingInSource(src, dst) {
  if (!fs.existsSync(src) && fs.existsSync(dst)) {
    fs.unlinkSync(dst);
    return true;
  }
  return false;
}

function ensureReleaseDir() {
  ensureDir(RELEASE_DIR);
}

function removeStaleReleaseSourcemap() {
  if (!isProd) return;
  const sourcemapPath = path.join(RELEASE_DIR, "main.js.map");
  if (removeIfExists(sourcemapPath)) {
    console.log("[static] removed stale production sourcemap");
  }
}

function copyStaticToRelease() {
  ensureReleaseDir();
  removeStaleReleaseSourcemap();

  const copiedManifest = safeCopy(
    "manifest.json",
    path.join(RELEASE_DIR, "manifest.json")
  );
  const copiedStyles = fs.existsSync("styles.css")
    ? safeCopy("styles.css", path.join(RELEASE_DIR, "styles.css"))
    : false;
  const removedStyles = fs.existsSync("styles.css")
    ? false
    : removeIfMissingInSource(
        "styles.css",
        path.join(RELEASE_DIR, "styles.css")
      );

  console.log(
    `[static] release sync: manifest=${
      copiedManifest ? "copied" : "missing"
    }, styles=${copiedStyles ? "copied" : removedStyles ? "removed" : "missing"}`
  );
}

function ensureHotReloadMarker() {
  if (!VAULT_PLUGIN_DIR) return;
  ensureDir(VAULT_PLUGIN_DIR);
  const marker = path.join(VAULT_PLUGIN_DIR, ".hotreload");
  if (!fs.existsSync(marker)) {
    fs.writeFileSync(marker, "", "utf8");
    console.log(`[deploy] hotreload marker created: ${marker}`);
  } else {
    console.log(`[deploy] hotreload marker present: ${marker}`);
  }
}

function deployToVault() {
  if (!deployMode) {
    console.log("[deploy] skipped: --deploy not enabled");
    return;
  }

  if (!OBSIDIAN_PLUGINS_DIR) {
    console.log(
      "[deploy] skipped: OBSIDIAN_PLUGINS_DIR is not set"
    );
    return;
  }

  ensureDir(OBSIDIAN_PLUGINS_DIR);
  ensureDir(VAULT_PLUGIN_DIR);

  console.log(`[deploy] plugin id: ${PLUGIN_ID}`);
  console.log(`[deploy] plugins dir: ${OBSIDIAN_PLUGINS_DIR}`);
  console.log(`[deploy] target dir: ${VAULT_PLUGIN_DIR}`);

  const copiedMain = safeCopy(
    path.join(RELEASE_DIR, "main.js"),
    path.join(VAULT_PLUGIN_DIR, "main.js")
  );
  const copiedManifest = safeCopy(
    path.join(RELEASE_DIR, "manifest.json"),
    path.join(VAULT_PLUGIN_DIR, "manifest.json")
  );

  const releaseCss = path.join(RELEASE_DIR, "styles.css");
  const vaultCss = path.join(VAULT_PLUGIN_DIR, "styles.css");

  let cssStatus = "missing";
  if (fs.existsSync(releaseCss)) {
    safeCopy(releaseCss, vaultCss);
    cssStatus = "copied";
  } else if (removeIfExists(vaultCss)) {
    cssStatus = "removed";
  }

  ensureHotReloadMarker();

  console.log(
    `[deploy] files: main.js=${
      copiedMain ? "copied" : "missing"
    }, manifest.json=${copiedManifest ? "copied" : "missing"}, styles.css=${cssStatus}`
  );
  console.log("[deploy] copied release artifacts to the vault plugin folder");
}

function watchStaticFile(file, onChange) {
  if (!fs.existsSync(file)) return null;

  try {
    return fs.watch(file, { persistent: true }, () => onChange(file));
  } catch {
    return null;
  }
}

ensureReleaseDir();
copyStaticToRelease();

if (deployMode && !OBSIDIAN_PLUGINS_DIR) {
  console.warn(
    "[deploy] --deploy was requested, but OBSIDIAN_PLUGINS_DIR is not set."
  );
}

const common = {
  entryPoints: [ENTRY],
  outfile: path.join(RELEASE_DIR, "main.js"),
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2020",
  sourcemap: !isProd,
  minify: isProd,
  external: ["obsidian"],
  logLevel: "info",
  plugins: [
    {
      name: "copy-static-and-deploy",
      setup(build) {
        build.onEnd((result) => {
          copyStaticToRelease();

          if (result.errors.length === 0) {
            deployToVault();
          } else {
            console.log("[deploy] skipped because the build reported errors");
          }
        });
      },
    },
  ],
};

if (!watchMode) {
  await esbuild.build(common);
  console.log(
    `✅ Build finished — release/main.js created${
      isProd ? " (production)" : ""
    }.`
  );
  process.exit(0);
}

const ctx = await esbuild.context(common);
await ctx.watch();

console.log(
  `👀 Watch mode active${
    isProd ? " (production)" : ""
  } — building to release/${deployMode ? ", then deploying to the vault plugin folder." : "."}`
);

const staticWatchers = [
  watchStaticFile("manifest.json", () => {
    copyStaticToRelease();
    deployToVault();
    console.log("[static] manifest.json updated");
  }),
  watchStaticFile("styles.css", () => {
    copyStaticToRelease();
    deployToVault();
    console.log("[static] styles.css updated");
  }),
].filter(Boolean);

process.stdin.resume();

process.on("SIGINT", async () => {
  for (const watcher of staticWatchers) {
    try {
      watcher.close();
    } catch {}
  }
  await ctx.dispose();
  console.log("\n🛑 Watch mode stopped.");
  process.exit(0);
});
