# Changelog

All notable user-facing changes to Canvas HTML Exporter are documented here.
The format follows the spirit of Keep a Changelog, with the newest release
first.

## [Unreleased]

### Added

- Add a local, Markdown-rendered **Show readme** action to the About settings
  without creating a Vault file or loading README images from the network;
  retain the Ko-fi destination as a text link and omit other images without
  placeholder notices.
- Keep the embedded README compact, combine its Canvas comparison into one
  sentence and omit the oversized single-HTML example link from this view.
- Document the manually tested Windows 11 and macOS platforms.

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
