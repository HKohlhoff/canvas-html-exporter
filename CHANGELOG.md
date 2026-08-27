# Changelog

All notable user-facing changes to Canvas HTML Exporter are documented here.
The format follows the spirit of Keep a Changelog, with the newest release
first.

## [Unreleased]

### Added

- Add optional import of the current Canvas Folding state with a fully expanded
  fallback when Canvas Folding is unavailable.
- Add browser controls for individual branches, expand/collapse all, visible
  levels, imported-state restore, no-folding mode, and branch focus.
- Add separate hidden-node and hidden-group counts to the exported page.
- Add visibility-aware fit/reset and a stronger yellow search-result highlight.
- Add a one-time Markdown-rendered feature update view that disappears when
  closed and leaves no note in the Vault.
- Add `No folding` as a third setting and make it the default for exports.

### Changed

- Make branch focus available on nodes without children and let focused-node
  reset/fit ignore surrounding group bounds.
- Keep nodes outside branch focus visible at 20% opacity and use the same focus
  icon as Canvas Folding.
- Size the Canvas viewport from the actual toolbar and heading area so short
  browser windows keep the top of the fitted Canvas visible.
- Store settings and one-time UI state in a versioned plugin-data envelope with
  migration from legacy top-level settings.
- Recommend package exports for large or media-heavy Canvases while retaining
  single HTML as the convenient one-file sharing option.

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
