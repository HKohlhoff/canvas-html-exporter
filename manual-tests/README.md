# Manual test matrix

This directory contains the versioned manual checks that complement automated
tests. Use the public `examples/demo-vault/` as the versioned source Vault.

Record the tested Obsidian version, operating system, browser and plugin
versions with the result.

## Baseline exporter

Test both package and single-HTML export:

- open the documentation Canvas and export through command and ribbon;
- inspect text, headings, lists, callouts, code, math and tables;
- confirm that crossing connections remain hidden behind every colored content
  node while transparent group backgrounds still show the surrounding graph;
- follow web links, internal note links, heading links and block references;
- open embedded notes and return to the Canvas;
- inspect images, PDFs, audio, video and missing-asset fallbacks;
- exercise zoom, pan, reset/fit, search and minimap;
- confirm offline behavior and absence of source-Vault modifications;
- disable/re-enable the plugin and repeat one minimal export.

## Linked subcanvases

Use an overview Canvas that links to at least two subcanvases. Include a return
Canvas card in every subcanvas, a shared target referenced more than once, and
one cycle back to an already visited Canvas. Repeat all checks as package and
single HTML:

- open every subcanvas card with one click and compare its node, group and edge
  layout with Obsidian;
- compare each card preview with the target Canvas: groups, node positions,
  colors, connections, and overall aspect ratio should remain recognizable;
  the obsolete **Open canvas** text must not appear;
- confirm the source return card is not rendered in the HTML, then use the
  **Canvas** link once and confirm that the overview opens immediately; in both
  formats it must appear as **(back to: Canvas)**, with only **Canvas** linked,
  not as an outlined button, directly after the node/group/connection status
  with a 20 px gap;
- follow a Canvas wiki link from a text or Markdown node as well as a Canvas
  file-node card;
- use browser Back and Forward across overview and subcanvas transitions;
- test both initial values of the plugin setting **Navigation**, then open
  **Navigation** on the overview and every subcanvas; confirm it remains a
  fixed left panel, the current page stays visible beside it and regains the
  full width after closing; confirm the Canvas
  hierarchy is finite, the current Canvas is highlighted, shared targets are
  listed once, and the current Canvas's Markdown, PDF-viewer, and link-node
  cards appear under **Pages in this canvas** and open correctly;
- change the panel state on the main Canvas and confirm pages without an
  individual choice inherit it; choose a different state on a subcanvas and an
  embedded page, leave each page, and confirm its state returns when reopened;
- use **Navigation** itself to open and close the panel like **Minimap**;
  confirm there is no separate Close button and keyboard Tab navigation can
  move naturally between the panel and the page;
- from a subcanvas open a Markdown page, PDF viewer, and link page; confirm
  **Back** returns to that subcanvas and **Canvas** returns to the root
  overview. Repeat in single HTML and confirm a root-owned page has no
  redundant **Back** link;
- confirm zoom, pan, fit/reset, search, minimap and folding inside each linked
  Canvas;
- confirm a shared target is present once and every reference opens it;
- confirm a directed Canvas cycle remains navigable and does not duplicate
  pages or stall the export;
- move the complete package and verify all Canvas pages and assets still work
  offline; verify the single HTML has no external local dependency;
- include one missing or invalid Canvas target and confirm the remaining export
  completes with the normal file fallback;
- confirm no source Canvas is modified.

## Advanced Canvas compatibility

Open `examples/demo-vault/Advanced Canvas Attributes.canvas` and repeat the
complete check as a package and as single HTML:

- compare every built-in shape, border style and text alignment with the
  source Canvas and confirm that all text remains fully visible;
- compare the dotted, short-dashed and long-dashed edge paths and every filled,
  outline, open, halved and blunt edge head;
- inspect items using the default Canvas color, palette colors 1 through 6 and
  a custom color;
- repeat with the Standard, Minimal and AnuPpuccin themes and confirm that the
  exported default edge color follows the active Canvas appearance, including
  active Style Settings values and CSS snippets;
- collapse and expand the root, child, nested and empty groups. The `−`/`+`
  control must sit directly to the right of the group name. Only the compact
  title row and connected edges should remain while a group is collapsed, and
  the edges must attach to the reduced title-row bounds;
- confirm that group counts include hidden nodes and groups, and that group
  state cooperates with branch folding, search, minimap, fit/reset and restore;
- export an already collapsed group and confirm its saved contents are present
  and can be restored in the generated page;
- confirm package and single-HTML output are functionally and visually
  equivalent and the source Canvas remains unchanged;
- repeat one export with Advanced Canvas disabled or absent. Supported saved
  attributes must still render from the `.canvas` data.

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
- Upgrade with the previous version's marker already saved. Check both a cold
  Obsidian start and enabling the updated plugin in an already open workspace.
  In both cases the new version's note must open automatically.
- Close the automatic note, restart, and verify it stays closed. Reopen it with
  **Show last update**, including while the automatic note is still open:
  only one update dialog should exist.
- Disable with the update note and README open: both dialogs must close. A
  note closed by unloading must not mark the update as read.
- Confirm the Markdown-rendered feature description opens in Obsidian.
- Confirm the existing exporter settings are unchanged after migration.
- Close it and confirm no release-note file remains anywhere in the Vault.
- Reload or restart Obsidian and confirm the description is not opened again.
- At the bottom of settings, choose **Show last update** and confirm that the
  same description opens again whenever requested.
- Choose **Show readme** beside it and confirm that the complete documentation
  opens as rendered Markdown, closes cleanly, creates no Vault file and does not
  load embedded README images or show image-placeholder notices. The Ko-fi
  support link remains visible and opens only after an explicit click; relative
  documentation links likewise open the repository only after a click.
- Confirm that the embedded README has no repeated blank lines, presents the
  Obsidian/HTML Canvas comparison as one sentence without ellipses, and omits
  the link to the oversized single-HTML example.

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
  node counts; confirm the number remains readable, the collapsed parent's
  focus control disappears, and expanding the branch restores it;
- collapse `A1` in `TestCanvas`; confirm `A2` and both of its branch
  connections to `B2` disappear, while the complete `B1` branch from `B1`
  through `B2` remains visible;
- expand `A1`, then collapse `B1`; confirm only the `B1` to `B2` connection is
  hidden because `B2` and its descendants remain reachable through `A1`;
- focus one branch and exit focus;
- focus a group and confirm that all geometrically contained items remain at
  full opacity while unrelated items are dimmed;
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
- confirm visible nodes and group labels always paint above crossing edges;
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

## Quality-review regressions

Repeat in package and single-HTML mode:

- Export to `.` (Vault root), a Vault subfolder and an absolute system folder.
  Verify an image's actual bytes at the expected destination, not just its link.
- On Windows also choose a drive root and a UNC share; verify the complete
  package is written there.
- Link note A to B and B to A; navigate both ways. Add a self-embedding heading
  (`![[A#Section]]` inside that section): export must finish with a readable
  unresolved-embed fallback at the recursion boundary.
- Add two PDFs named `Report #1.pdf` from different folders. Each viewer must
  open the correct PDF.
- Export a Canvas containing only groups; folding must remain accessible.
- Include literal `</script>` in a text node and edge label: it must remain
  content and all browser controls must still work.

Record these results with the runtime versions before release.

## Search focus and folder-picker cancellation

For both export formats, open search once by its toolbar button and once with
`/` from another focused control. Tab and Shift+Tab must cycle through visible,
enabled search controls (including new result links/buttons) without reaching
the Canvas behind the dialog. Escape, Close and clicking the backdrop must
return focus to the original control without changing the viewport scroll.
Close search immediately after opening it and confirm delayed autofocus does
not move focus back into the hidden dialog. With search disabled, ordinary
Tab navigation must remain unchanged.

Where Electron's folder dialogs are unavailable, cancel the fallback directory
picker and then open it again. Cancellation must leave settings unchanged and
the second selection must work. This fallback is additionally tested with
synthetic input events; a real runtime check remains part of release validation.
