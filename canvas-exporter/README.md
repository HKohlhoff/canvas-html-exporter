# Canvas to HTML

Canvas to HTML exports the active Obsidian Canvas as a portable HTML package that can be opened in any modern browser.

The export keeps the canvas layout and creates a portable folder with an `index.html`, copied assets, and optional HTML subpages for embedded Markdown notes.

## Features

- Export the active `.canvas` file as an interactive HTML package
- Preserve canvas layout, node styling, groups, and connection lines
- Export Markdown file nodes as standalone HTML subpages
- Rewrite internal Markdown links, wiki links, heading links, and block references
- Copy linked images and files into the export package
- Render LaTeX math with KaTeX
- Highlight fenced code blocks with Shiki
- Support link nodes with preview pages and offline fallbacks
- Optional canvas minimap
- Optional canvas search overlay with result navigation
- Light or dark default theme for exported pages

## Export Structure

Each export creates a dedicated folder inside the configured output directory:

```text
Canvas-Exports/
  My Canvas/
    index.html
    assets/
      images/
      files/
```

Depending on the canvas contents, the export may also include additional HTML pages for Markdown and link nodes.

## How To Use

1. Open a canvas in Obsidian.
2. Run the command `Export active canvas as HTML`.
3. Open the generated `index.html` from the configured output folder.

You can also use the ribbon icon to trigger the export.

## Plugin Settings

- `Dark default theme`: use a dark default theme for exported HTML
- `Show minimap`: include a minimap on the exported canvas page
- `Show search`: include a search overlay on the exported canvas page
- `Syntax-Highlighting`: choose the Shiki theme family for code blocks
- `Output folder`: choose a folder inside the vault or an absolute filesystem folder on desktop

## Supported Content

The current exporter covers the most important Obsidian canvas workflows:

- text nodes
- group nodes
- link nodes
- Markdown file nodes
- image and generic file nodes
- callouts, tables, lists, blockquotes, and code fences in Markdown
- section links and block references
- PDF and file embeds in exported Markdown pages

## Notes And Limitations

- External websites may refuse to load inside an embedded frame because of their own security headers.
- Exported HTML is designed to be portable, but remote website previews still need an internet connection.
- On mobile, the plugin stays available and exports into the vault. Absolute filesystem folders are desktop-only.

## Development

Install dependencies and run the checks:

```bash
npm install
npm test
npm run build
```

Development workflows:

```bash
npm run dev
npm run build:prod
```

To deploy a local development build directly into an Obsidian vault, set `OBSIDIAN_PLUGINS_DIR` and use one of the deploy scripts:

```bash
export OBSIDIAN_PLUGINS_DIR="/path/to/.obsidian/plugins"
npm run build:deploy
npm run dev:deploy
```

## Community Plugin Notes

This repository includes the files expected by the Obsidian community plugin workflow:

- `manifest.json`
- `versions.json`
- release artifacts in `release/`

For a public release, the Git tag should match the plugin version from `manifest.json`.
