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
- At the bottom of settings, choose **Show last update** and confirm that the
  same description opens again whenever requested.

### Graph cases

- simple rooted tree;
- multiple roots and an isolated node;
- shared descendant with multiple parents;
- cross-link between branches;
- directed cycle;
- groups containing visible and hidden nodes;
- a directed chain of connected groups, including an empty child group;
- text, file, link and image nodes.

### Browser interaction

- collapse and expand one branch repeatedly;
- collapse all and expand all;
- show through several levels and restore all levels;
- export with the default `No folding`, confirm the Canvas starts fully
  expanded with both node controls and the focus action hidden, while the
  Folding menu remains available, then use `Enable folding` and confirm the
  controls appear;
- confirm `Restore folding` remains present in every folding mode;
- hide and show folding controls, confirm the folded state does not change,
  and verify that focus controls remain visible;
- hide and show focus controls, confirm the folding controls remain visible
  and an active focus can still be ended through `Exit focus`;
- confirm the separator visually distinguishes folding actions from the focus
  section;
- collapse branches with one-, two- and, where practical, three-digit hidden
  node counts; confirm the number remains readable and the focus control moves
  left without overlap;
- collapse `A1` in `TestCanvas`; confirm `A2` and both of its branch
  connections to `B2` disappear, while the complete `B1` branch from `B1`
  through `B2` remains visible;
- expand `A1`, then collapse `B1`; confirm only the `B1` to `B2` connection is
  hidden because `B2` and its descendants remain reachable through `A1`;
- focus one branch and exit focus;
- collapse and expand a connected group branch; confirm all descendant groups
  follow the branch and every visible group has a working focus control;
- put the child of a separate node branch inside a connected child group.
  Collapsing the node branch must hide only its child and keep the group frame;
  collapsing the group parent must hide the child group and its geometrically
  contained node;
- while that group parent is collapsed, confirm the separate visible parent's
  branch control remains in place but disabled with **Branch hidden by folded
  group**. Expanding the group must restore it without a latent state change;
- focus a node without children, run reset, and confirm that the node alone is
  fitted without surrounding group bounds;
- without activating a tool, drag a rectangle with the left mouse button in
  both directions and confirm release fits that area; verify the cancel hint is
  visible while held, `Esc` cancels, and short or interactive clicks retain
  their normal behavior;
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

### Export size and initial responsiveness

- export the same large or media-heavy Canvas as a package and as single HTML;
- record `index.html` and single-HTML file sizes;
- reload both with the same browser and record when zoom, reset and node
  controls first respond;
- confirm the package becomes interactive earlier when the single HTML contains
  large embedded assets;
- confirm all package assets and subpages still work when the complete folder
  is moved together.

Repeat the complete matrix for package and single-HTML output. Where practical,
check at least one Chromium browser, Firefox and Safari/WebKit.

## Compact Windows smoke test

Before release, also perform one compact test on a current Windows system and
record the Windows, Obsidian, browser and plugin versions:

- install or update the plugin in a Windows test Vault and confirm that it
  loads with its settings intact;
- export one representative Canvas as both `Package folder` and `Single HTML
  file`, once to a Vault folder and once to a valid absolute Windows folder;
- open both results in Microsoft Edge or another current Chromium browser and
  confirm that text, connections, links and representative image/file assets
  render;
- confirm the default `No folding` start, the persistent Folding menu,
  `Enable folding`, both control-visibility toggles, one numbered branch
  collapse/expand, node focus and `Reset`;
- confirm zoom, pan and search, then reopen both exports and check that they
  start normally without requiring the source Vault.

This Windows check is a compact cross-platform smoke test; it supplements and
does not replace the complete manual matrix above.
