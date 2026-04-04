import * as esbuild from "esbuild";

const isProd = process.argv.includes("--production");

await esbuild.build({
  entryPoints: ["src/main.ts"],
  outfile: "main.js",
  bundle: true,
  format: "cjs",
  platform: "node",
  target: "es2020",
  sourcemap: !isProd,
  minify: isProd,
  external: ["obsidian"],
});

console.log("✅ Build abgeschlossen — main.js erstellt.");