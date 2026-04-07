import esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const isProd = process.argv.includes("--production");
const watchMode = process.argv.includes("--watch");

const RELEASE_DIR = "release";
const ENTRY = "src/main.ts";

// Anpassen, falls deine Plugin-ID im manifest.json anders lautet:
const PLUGIN_ID = "canvas-exporter";

const VAULT_PLUGIN_DIR = process.env.OBSIDIAN_PLUGIN_DIR || "";

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function safeCopy(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.copyFileSync(src, dst);
}

function removeIfMissingInSource(src, dst) {
  if (!fs.existsSync(src) && fs.existsSync(dst)) {
    fs.unlinkSync(dst);
  }
}

function ensureReleaseDir() {
  ensureDir(RELEASE_DIR);
}

function copyStaticToRelease() {
  ensureReleaseDir();
  safeCopy("manifest.json", path.join(RELEASE_DIR, "manifest.json"));

  if (fs.existsSync("styles.css")) {
    safeCopy("styles.css", path.join(RELEASE_DIR, "styles.css"));
  } else {
    removeIfMissingInSource(
      "styles.css",
      path.join(RELEASE_DIR, "styles.css")
    );
  }
}

function ensureHotReloadMarker() {
  if (!VAULT_PLUGIN_DIR) return;
  ensureDir(VAULT_PLUGIN_DIR);
  const marker = path.join(VAULT_PLUGIN_DIR, ".hotreload");
  if (!fs.existsSync(marker)) {
    fs.writeFileSync(marker, "", "utf8");
  }
}

function deployToVault() {
  if (!VAULT_PLUGIN_DIR) {
    console.log("[deploy] übersprungen, weil OBSIDIAN_PLUGIN_DIR nicht gesetzt ist");
    return;
  }

  ensureDir(VAULT_PLUGIN_DIR);

  safeCopy(
    path.join(RELEASE_DIR, "main.js"),
    path.join(VAULT_PLUGIN_DIR, "main.js")
  );
  safeCopy(
    path.join(RELEASE_DIR, "manifest.json"),
    path.join(VAULT_PLUGIN_DIR, "manifest.json")
  );

  const releaseCss = path.join(RELEASE_DIR, "styles.css");
  const vaultCss = path.join(VAULT_PLUGIN_DIR, "styles.css");

  if (fs.existsSync(releaseCss)) {
    safeCopy(releaseCss, vaultCss);
  } else if (fs.existsSync(vaultCss)) {
    fs.unlinkSync(vaultCss);
  }

  ensureHotReloadMarker();
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
            if (VAULT_PLUGIN_DIR) {
              deployToVault();
            } else {
              console.log("[deploy] kein Vault-Deploy konfiguriert");
            }
            console.log("[static] manifest/styles in release/ aktualisiert");
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
