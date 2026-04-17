# Canvas to HTML

Canvas to HTML exports the active Obsidian Canvas into browser-ready HTML that can be opened in any modern browser.

The plugin supports two export formats:

- `Package folder`: creates a portable folder with `index.html`, copied assets, and optional HTML subpages
- `Single HTML file`: creates one self-contained HTML document with inline assets and virtual subpages

## Features

- Export the active `.canvas` file as an interactive HTML package or as a single self-contained HTML file
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

## Export Formats

### Package folder

Each package export creates a dedicated folder inside the configured output directory:

```text
Canvas-Exports/
  My Canvas/
    index.html
    assets/
      images/
      files/
```

Depending on the canvas contents, the export may also include additional HTML pages for Markdown and link nodes.

### Single HTML file

Single HTML exports create one file in the configured output location:

```text
Canvas-Exports/
  My Canvas.html
```

The canvas page, embedded assets, and internal subpages live inside that one document.

## How To Use

1. Open a canvas in Obsidian.
2. Run the command `Export active canvas as HTML`.
3. Open the generated export:
   - `index.html` for `Package folder`
   - `My Canvas.html` for `Single HTML file`

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
- `Single HTML file` is convenient for sharing, but very large canvases or many embedded files can make the output file quite large.
- Browser behavior around very large inline assets, PDF rendering, and history can vary more in `Single HTML file` mode than in the classic package export.

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
