# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An **Obsidian plugin** (`canvas-exporter`) that exports `.canvas` files (Obsidian's JSON-based visual canvas format) into standalone, portable HTML packages. Code comments and documentation are primarily in **German**.

## Development Commands

All commands are run from the `canvas-exporter/` directory:

```bash
npm install         # Install dependencies
npm run build       # Single build → release/main.js
npm run dev         # Watch mode with auto-rebuild and vault deployment
npm run build:prod  # Production build (minified, no sourcemap)
```

The build script (`build.mjs`) automatically copies the output to the Obsidian vault at `/Users/Holger/SynologyDrive/Obsidian/HolgersVault/.obsidian/plugins/canvas-exporter/` and creates a `.hotreload` marker.

There are no automated tests currently — the README lists regression tests as a planned next step.

## Architecture

### Export Pipeline

```
User command → exportCanvasPackage() → convertCanvasToHtml()
                     ↓                         ↓
          Copies assets to:              Renders complete HTML
          assets/images/                with embedded CSS theme
          assets/files/                 and node layout
          Exports .md → .html subpages
```

Output lands in `Canvas-Exports/[canvas-name]/index.html` relative to the vault root.

### Key Source Files (`canvas-exporter/src/`)

| File | Role |
|------|------|
| `main.ts` | Plugin entry point: settings, ribbon command, reads Obsidian CSS color palette |
| `exporter.ts` | Orchestrates the full export — file copying, markdown-to-HTML, link rewriting, asset management |
| `converter.ts` | Converts `CanvasData` to complete HTML — node rendering, theme generation, markdown parsing |
| `obsidian.d.ts` | TypeScript type definitions for the Obsidian API |

### Design Patterns

- **Context object (`MarkdownContext`)**: carries state (app, paths, file maps, counters) through the export
- **Cycle detection**: `pageStack` and `inlineStack` prevent infinite recursion in linked/embedded notes
- **Defensive normalization**: canvas JSON is validated and normalized before processing
- **Link rewriting**: wiki-links and internal links are converted to relative paths at export time
- **Asset deduplication**: copied files get counter-prefixed names to avoid collisions

### Canvas Color System

Obsidian canvas nodes have 6 colors (1–6) that map to Obsidian theme CSS variables. `main.ts` reads the active theme's CSS variables at export time; `converter.ts` applies them with fallback values for the default Obsidian palette.

## Build System

- **Bundler**: esbuild (CommonJS output, ES2020 target — required by Obsidian plugin system)
- **TypeScript**: strict mode enabled
- Static files (`manifest.json`, `styles.css`) are copied to `release/` alongside the bundle

## Intentionally Out of Scope

The README explicitly notes these were removed for stability: embedded websites, minimap, search, drag & drop in exports, base64 image embedding.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
