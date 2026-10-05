# Changelog

All notable user-facing changes to Canvas HTML Exporter are documented here.
The format follows the spirit of Keep a Changelog, with the newest release
first.

## [Unreleased]

### Added

- Export Canvas file nodes and Canvas wiki links recursively. Package exports
  create navigable Canvas HTML pages, while single-HTML exports embed matching
  virtual pages; shared targets and cycles are handled once by canonical Vault
  path. Linked pages use the upper-right **Canvas** control for the return to
  the overview, so a redundant source return card is not rendered. Canvas
  cards show an offline diagram preview instead of a separate **Open canvas**
  action label. Package subpages present the return as the same plain text link
  used by single HTML rather than as an extra outlined button; both render
  **(back to: Canvas)** directly after the node/group/connection status with a
  20 px gap, with only **Canvas** linked.
- Add a fixed **Navigation** panel to exported Canvas pages. It keeps the current
  page visible beside the navigation, shows a cycle-safe
  Canvas hierarchy, highlights the current Canvas, and lists the Markdown,
  PDF-viewer, and link-node HTML pages directly contained in that Canvas in
  both package and single-HTML exports.
- Add a **Navigation** setting for the initial open/closed state. Changes made
  on the main Canvas become the default for pages without an individual choice;
  each Canvas or embedded page remembers and restores its own later state.
- Make **Navigation** a toolbar toggle like **Minimap** and remove the redundant
  panel-internal **Close** button.
- Preserve per-page Navigation choices across package Back/Forward history and
  synchronize embedded single-HTML canvases only after their runtime is ready.
- Present embedded single-HTML canvases as full-page Canvas views without a
  surrounding page card, and route parent Canvas links through the outer page
  so local files do not open a file chooser.
- Highlight the currently open embedded Markdown, PDF, or link page in
  **Navigation** instead of leaving its owning Canvas highlighted.
- Add the **Navigation** toggle and panel to package Markdown, PDF, and link
  pages. File pages start with Navigation closed on their first visit in both
  formats, independent of the global default, while remembering later local
  choices and highlighting the active file page. The package toggle uses the
  same plain-link appearance as **Back** and **Canvas**.
- Restore each package Canvas's zoom level and visible position after visiting
  another Canvas or file page. Save the view before following a package link
  and carry it through local package URLs as well as the browser-window state,
  so local-file privacy boundaries cannot discard it. Do not replace the
  restored view with an automatic resize fit. Restore it only for **Back**,
  **Canvas**, and browser-history returns; explicitly reopening a subcanvas
  starts with the normal fitted view, matching single HTML.
- Keep the search overlay inside the remaining Canvas area while the fixed
  **Navigation** panel is open, so the panel no longer covers the search field.
- Add **Back** beside **Canvas** on HTML pages owned by a subcanvas, returning
  to that subcanvas while **Canvas** continues to open the main overview.
- Sort sibling Canvases and the current Canvas's page entries alphabetically in
  **Navigation**, using natural number order.
- Extend **Search...** to the complete subordinate Canvas hierarchy in package
  and single-HTML exports. Results identify and open their owning subcanvas,
  or directly open the matching Markdown, PDF, or link page when the card has
  one. Cards without a separate page are brought into view and highlighted;
  Markdown pages are indexed from their full text rather than only the preview.
- Preserve and reopen Search after using **Back** or **Canvas** from a search
  result page in both export formats. Fit a newly revealed embedded subcanvas
  only after it is visible, avoiding the compressed return view in single HTML.

### Development

- Make the tag release workflow safe to rerun when a GitHub release already
  exists, refreshing only the reviewed plugin assets without replacing its
  release notes.

## [1.4.1] – 2026-10-04

### Fixed

- Keep connections visually behind colored content nodes while preserving the
  transparent overview provided by Canvas groups.

## [1.4.0] – 2026-10-04

### Changed

- Align exported group folding with Canvas Folding 1.2.8: place the group
  control directly after its name, allow empty groups to collapse, reduce a
  collapsed group's bounds to its compact label for natural edge attachment,
  and let **Expand all** expand groups as well as branches.
- Keep every Canvas node above the edge layer while retaining groups below
  their contained content nodes.

## [1.3.2] – 2026-09-08

### Fixed

- Keep keyboard focus inside search while it is open and restore focus when
  it closes; cancelling the folder picker now ends the selection cleanly.

- Show the update description once for each plugin version, including
  maintenance updates; keep the read marker tied to closing the dialog.
- Prevent overlapping exports from mixing files in the same output folder.
- Close plugin-owned dialogs on disable and serialize settings writes without
  overwriting data from a newer, unsupported schema.
- Keep literal script-closing text inert in exported HTML and prevent
  executable navigation schemes in Markdown links and link-node previews.
- Preserve absolute binary-asset destinations, Vault-root output, Windows drive
  roots and UNC paths.
- Resolve internal note links and asset embeds in text nodes as well as file
  nodes.
- Keep cyclic note links navigable in single HTML, terminate recursive section
  embeds, and give same-name PDF viewers distinct portable filenames.
- Keep folding available for Canvases containing only groups.

### Development

- Split the renderer into document, Markdown, node, theme, stylesheet and
  browser modules while preserving its public import paths and standalone output.

- Preserve existing release artifacts after a failed build, require an explicit
  deployment destination, and reject release tags that differ from the manifest.
- Update the vulnerable development dependency `fast-uri` to 3.1.7 and add
  focused export, lifecycle, path and build regressions.

## [1.3.1] – 2026-08-30

### Fixed

- Hide a collapsed parent's focus control until its branch is expanded again,
  matching Canvas Folding and leaving the complete node-control area to the
  folding count.

### Changed

- Keep the 1.3.0 Advanced Canvas feature description as **Show last update**
  for this maintenance release instead of reopening it after the update.

## [1.3.0] – 2026-08-29

### Added

- Add a local, Markdown-rendered **Show readme** action to the About settings
  without creating a Vault file or loading README images from the network;
  retain the Ko-fi destination as a text link and omit other images without
  placeholder notices.
- Keep the embedded README compact, combine its Canvas comparison into one
  sentence and omit the oversized single-HTML example link from this view.
- Document the manually tested Windows 11 and macOS platforms.
- Preserve supported Advanced Canvas node shapes, borders, text alignment,
  edge paths, edge heads, palette colors, and custom colors without requiring
  Advanced Canvas at export or viewing time.
- Add independent browser collapse controls for saved Advanced Canvas groups,
  including nested groups, title-only collapsed presentation, incident edges,
  search, minimap, fit/reset, and restore behavior.
- Add the self-contained `Advanced Canvas Attributes.canvas` to the public
  demo vault as a complete visual and interaction example.

### Changed

- Remove the redundant tracked maintainer TestVault copy. The public
  `examples/demo-vault/` remains the versioned manual-test source, while local
  cross-plugin testing uses the shared external PluginTests Vault.
- Sample the active Canvas default edge color during export so theme CSS,
  Style Settings values, and enabled CSS snippets are reflected when no color
  is explicitly stored.
- Count hidden directed groups and their geometrically contained nodes and
  groups consistently in browser folding controls.

## [1.2.0] – 2026-08-28

### Added

- Add optional import of the current Canvas Folding state with a fully expanded
  fallback when Canvas Folding is unavailable.
- Add browser controls for individual branches, expand/collapse all, visible
  levels, imported-state restore, no-folding mode, and branch focus.
- Add separate hidden-node and hidden-group counts to the exported page.
- Add visibility-aware fit/reset and a stronger yellow search-result highlight.
- Add an always-available area-zoom gesture for fitting a rectangle selected
  with the left mouse button, including an `Esc` cancel hint while dragging.
- Add a one-time Markdown-rendered feature update view that disappears when
  closed and leaves no note in the Vault.
- Add **Show last update** at the bottom of the settings and keep the same
  user-facing text in `Last Update.md` in the repository.
- Add `No folding` as a third setting and make it the default for exports.
- Add separate menu toggles for branch-control and focus-control visibility.
- Show the number of hidden descendant nodes in expandable branch controls and
  let multi-digit controls grow without covering the focus control.

### Changed

- Make branch focus available on nodes without children, keep geometrically
  contained items active when focusing a group, and let focused-node reset/fit
  ignore surrounding group bounds.
- Keep nodes outside branch focus visible at 20% opacity and use the same focus
  icon as Canvas Folding.
- Size the Canvas viewport from the actual toolbar and heading area so short
  browser windows keep the top of the fitted Canvas visible.
- Store settings and one-time UI state in a versioned plugin-data envelope with
  migration from legacy top-level settings.
- Recommend package exports for large or media-heavy Canvases while retaining
  single HTML as the convenient one-file sharing option.
- Explain that exported HTML remains hidden in Obsidian's file tree unless the
  current Vault enables **Obsidian Settings → Files and links → Detect all file
  extensions**, which is an Obsidian Vault setting rather than a plugin setting.
- Require a compact Windows smoke test for both export formats before release.
- Keep shared descendants visible while another open parent branch still
  reaches them, hiding only the connections belonging to the collapsed branch.
- Treat groups connected through directed edges like regular folding nodes and
  provide focus controls on visible groups.
- Align group visibility with Canvas Folding: connected group frames follow
  their own directed branch, folded groups hide geometrically contained nodes,
  and unrelated contained branches do not hide the group frame.
- Keep a visible branch control in place but disabled while every descendant is
  hidden by a folded group, preserving its state until the group is expanded.

### Fixed

- Keep the exporter version embedded in generated HTML synchronized with the
  plugin release version.
- Keep node-control backgrounds opaque on hover so underlying headings do not
  reduce the controls' contrast.

### Development

- Prepare the project structure, role-based review workflow, manual test matrix
  and release checklist for the optional Canvas Folding integration.
- Update the supported development toolchain, Obsidian lint coverage, CI
  runtimes and automated release-metadata checks.
- Add Obsidian's standard funding metadata and refresh published-installation
  wording.
- Keep the completed integration isolated on
  `feature/canvas-folding-integration` until review and release approval.

## [1.1.2] – 2026-08-01

### Changed

- Use the canonical production build in CI and GitHub releases.

## [1.1.1] – 2026-08-01

### Changed

- Resolve Community Plugin review warnings for the 1.1 release line.

## [1.1.0] – 2026-08-01

### Changed

- Update the plugin baseline for Obsidian 1.13.

## [1.0.6] – 2026-05-16

### Added

- Add release artifact attestations.

## [1.0.5] – 2026-05-16

### Changed

- Reduce the release bundle size.

## [1.0.4] – 2026-05-16

### Changed

- Rename the plugin to Canvas HTML Exporter.

## [1.0.3] – 2026-05-16

### Changed

- Prepare the 1.0.3 maintenance release.

## [1.0.2] – 2026-05-14

### Changed

- Prepare a scorecard-compliant release.

## [1.0.1] – 2026-05-07

### Changed

- Prepare the Community Plugin submission release.

## [1.0.0] – 2026-05-07

### Added

- Initial public release.
