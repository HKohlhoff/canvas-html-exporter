import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const isProd = process.argv.includes("--production");
const watchMode = process.argv.includes("--watch");

const RELEASE_DIR = "release";
const ENTRY = "src/main.ts";

// Anpassen, falls deine Plugin-ID im manifest.json anders lautet:
const PLUGIN_ID = "canvas-exporter";

const OBSIDIAN_PLUGINS_DIR =
  process.env.OBSIDIAN_PLUGINS_DIR ||
  "/Users/Holger/SynologyDrive/Obsidian/HolgersVault/.obsidian/plugins";

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

function copyStaticToRelease() {
  ensureReleaseDir();

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

function syncSourceMapsToRelease() {
  const releaseMap = path.join(RELEASE_DIR, "main.js.map");
  if (!isProd) {
    return fs.existsSync(releaseMap) ? "present" : "missing";
  }
  return removeIfExists(releaseMap) ? "removed" : "absent";
}

function ensureHotReloadMarker() {
  if (!VAULT_PLUGIN_DIR) return;
  ensureDir(VAULT_PLUGIN_DIR);
  const marker = path.join(VAULT_PLUGIN_DIR, ".hotreload");
  if (!fs.existsSync(marker)) {
    fs.writeFileSync(marker, "", "utf8");
    console.log(`[deploy] hotreload marker erstellt: ${marker}`);
  } else {
    console.log(`[deploy] hotreload marker vorhanden: ${marker}`);
  }
}

function deployToVault() {
  if (!OBSIDIAN_PLUGINS_DIR) {
    console.log(
      "[deploy] übersprungen: OBSIDIAN_PLUGINS_DIR ist nicht gesetzt"
    );
    return;
  }

  ensureDir(OBSIDIAN_PLUGINS_DIR);
  ensureDir(VAULT_PLUGIN_DIR);

  console.log(`[deploy] plugin id: ${PLUGIN_ID}`);
  console.log(`[deploy] plugins-pfad: ${OBSIDIAN_PLUGINS_DIR}`);
  console.log(`[deploy] zielordner: ${VAULT_PLUGIN_DIR}`);

  const copiedMain = safeCopy(
    path.join(RELEASE_DIR, "main.js"),
    path.join(VAULT_PLUGIN_DIR, "main.js")
  );
  const copiedManifest = safeCopy(
    path.join(RELEASE_DIR, "manifest.json"),
    path.join(VAULT_PLUGIN_DIR, "manifest.json")
  );

  const releaseMap = path.join(RELEASE_DIR, "main.js.map");
  const vaultMap = path.join(VAULT_PLUGIN_DIR, "main.js.map");
  let mapStatus = "missing";
  if (!isProd && fs.existsSync(releaseMap)) {
    safeCopy(releaseMap, vaultMap);
    mapStatus = "copied";
  } else if (removeIfExists(vaultMap)) {
    mapStatus = "removed";
  }

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
    `[deploy] dateien: main.js=${
      copiedMain ? "copied" : "missing"
    }, main.js.map=${mapStatus}, manifest.json=${
      copiedManifest ? "copied" : "missing"
    }, styles.css=${cssStatus}`
  );
  console.log("[deploy] release -> vault plugin folder kopiert");
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
syncSourceMapsToRelease();

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
          const mapStatus = syncSourceMapsToRelease();
          console.log(`[static] sourcemap=${mapStatus}`);

          if (result.errors.length === 0) {
            deployToVault();
          } else {
            console.log("[deploy] übersprungen wegen Build-Fehlern");
          }
        });
      },
    },
  ],
};

if (!watchMode) {
  await esbuild.build(common);
  console.log(
    `✅ Build abgeschlossen — release/main.js erstellt${
      isProd ? " (production)" : ""
    }.`
  );
  process.exit(0);
}

const ctx = await esbuild.context(common);
await ctx.watch();

console.log(
  `👀 Watch-Modus aktiv${
    isProd ? " (production)" : ""
  } — Build nach release/, danach Deploy in den Vault.`
);

const staticWatchers = [
  watchStaticFile("manifest.json", () => {
    copyStaticToRelease();
    deployToVault();
    console.log("[static] manifest.json aktualisiert");
  }),
  watchStaticFile("styles.css", () => {
    copyStaticToRelease();
    deployToVault();
    console.log("[static] styles.css aktualisiert");
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
  console.log("\n🛑 Watch-Modus beendet.");
  process.exit(0);
});
