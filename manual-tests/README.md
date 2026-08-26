# Manual test matrix

This directory contains the versioned manual checks that complement automated
tests. Use the public `examples/demo-vault/` or the local
`Canvas-HTML-Exporter_TestVault/` as the source Vault.

Record the tested Obsidian version, operating system, browser and plugin
versions with the result.

## Baseline exporter

Test both package and single-HTML export:

- open the documentation Canvas and export through command and ribbon;
- inspect text, headings, lists, callouts, code, math and tables;
- follow web links, internal note links, heading links and block references;
- open embedded notes and return to the Canvas;
- inspect images, PDFs, audio, video and missing-asset fallbacks;
- exercise zoom, pan, reset/fit, search and minimap;
- confirm offline behavior and absence of source-Vault modifications;
- disable/re-enable the plugin and repeat one minimal export.

## Canvas Folding integration

These cases become mandatory as soon as Folding code is implemented.

### Provider states

- Canvas Folding is not installed.
- Canvas Folding is installed but disabled.
- API version is unsupported.
- API call rejects or returns invalid data.
- API v1 returns no hidden nodes or edges.
- API v1 returns an effective folded state for the active Canvas.

Every failure case must produce a normal usable export rather than aborting.

### Update note and plugin data

- Start once with legacy top-level plugin settings and no release-note marker.
- Confirm the Markdown-rendered feature description opens in Obsidian.
- Confirm the existing exporter settings are unchanged after migration.
- Close it and confirm no release-note file remains anywhere in the Vault.
- Reload or restart Obsidian and confirm the description is not opened again.

### Graph cases

- simple rooted tree;
- multiple roots and an isolated node;
- shared descendant with multiple parents;
- cross-link between branches;
- directed cycle;
- groups containing visible and hidden nodes;
- text, file, link and image nodes.

### Browser interaction

- collapse and expand one branch repeatedly;
- collapse all and expand all;
- show through several levels and restore all levels;
- switch to `No folding`, confirm both node controls and the focus action are
  hidden, then enable folding again;
- confirm `Restore folding` remains present in every folding mode;
- focus one branch and exit focus;
- confirm the focused branch remains at full opacity and its context at 20%;
- confirm hidden nodes, incident edges and labels disappear together;
- confirm hidden content nodes and hidden groups are counted separately;
- confirm visible node positions do not change;
- fit/reset uses the visible graph appropriately;
- repeat fit/reset in a short browser window and confirm the top of the Canvas
  stays below the toolbar, heading and information line;
- choose a search result and confirm its yellow pulse is clearly visible;
- search, links, subpages, minimap, zoom and pan still work;
- refresh/reopen starts in the configured initial state.

Repeat the complete matrix for package and single-HTML output. Where practical,
check at least one Chromium browser, Firefox and Safari/WebKit.
