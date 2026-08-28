# Release checklist

Use this checklist before publishing Canvas HTML Exporter.

## Branch and repository

- The intended feature branch was reviewed and deliberately merged into
  `master`.
- `git status` is understood and contains no unintended files.
- No `node_modules/`, `.test-build/`, `.DS_Store`, local Vault state, generated
  exports, `_local/` files or `AGENTS.md` are tracked.
- `CHANGELOG.md`, README and public documentation match actual behavior.
- README clearly discloses local source access and optional writes to an
  explicitly selected folder outside the Vault.
- Demo-Vault instructions list all required installation files, including
  `styles.css`.

## Metadata

- `manifest.json`, `package.json` and `versions.json` use the intended version
  and minimum Obsidian version.
- The embedded update-note ID matches the plugin version so this release opens
  its note once, and `Last Update.md` contains the identical Markdown.
- Every user-facing feature release follows the shared update-note standard:
  open a transient Markdown view once after update, mark it as read only after
  it closes, create no Vault file, and keep **Show last update** at the bottom
  of settings. Apply the same standard when starting a new plugin.
- Plugin ID, name, description, author, repository and GPL metadata agree.
- `build.mjs` deploys to the correct plugin ID.
- Version changes were made only during explicit release preparation.

## Automated quality

Run from a clean install where practical:

```bash
npm ci
npm test
npm run build:prod
```

- All focused tests pass.
- TypeScript test compilation passes.
- ESLint passes without warnings.
- `release/main.js`, `release/manifest.json` and `release/styles.css` are created.
- Release manifest and styles match their root sources.

## Manual Obsidian test

- Enable, disable and re-enable the plugin in a real Vault.
- Run export from the ribbon and command palette.
- Check settings loading, saving and backward-compatible defaults.
- Confirm a missing legacy Folding setting normalizes to `No folding`, while
  explicitly stored `Fully expanded` and `Current Canvas Folding state` values
  remain unchanged.
- Upgrade once from legacy plugin data: confirm the Markdown-rendered feature
  description opens once, existing settings survive, closing it leaves no
  Vault file, and a restart does not reopen it.
- Use **Show last update** at the bottom of settings and confirm that the same
  version 1.2.0 description can be reopened at any time.
- Export to a Vault folder and an allowed absolute desktop folder.
- Verify useful notices and failures for missing files and invalid targets.
- Confirm that Canvas and source notes are not modified.
- Complete the compact Windows smoke test from `manual-tests/README.md` on a
  current Windows/Obsidian installation and record the tested versions.

## Export regression matrix

- Package export opens through `index.html` with all required assets.
- Single HTML opens offline without external assets.
- Text, Markdown, links, images, PDFs, audio, video and code render correctly.
- Groups, nodes, edges, labels and colors remain correct.
- Zoom, pan, fit/reset, search, minimap and subpage navigation work.
- Internal links, anchors, embeds and missing-target fallbacks work.
- Test the documentation Canvas from `examples/demo-vault/`.
- Regenerate the checked-in interactive HTML example from the current
  documentation Canvas when its content or browser runtime changed.

## Canvas Folding integration

When the release includes Folding support, complete `manual-tests/README.md`
and verify at least:

- normal export without Canvas Folding installed;
- default `No folding` export starts fully expanded with node controls hidden,
  while the Folding menu remains available and `Enable folding` activates the
  controls;
- disabled, incompatible and failing Folding API fallback;
- current fold state imported through supported API v1;
- package and single-HTML output behave identically;
- collapse/expand, all branches, levels and branch focus;
- cycles, multiple parents, cross-links, multiple roots, isolated nodes and
  groups;
- hidden nodes also hide incident edges and edge labels;
- visible nodes retain their positions;
- existing browser controls remain usable.
- the compact Windows smoke test passes for package and single-HTML output.

## Release assets and publication

- Release files come from the reviewed production build.
- `Last Update.md` matches the transient in-plugin update description.
- Only `main.js`, `manifest.json` and `styles.css` are uploaded unless the
  release process explicitly requires more.
- Tag, push, GitHub release and Community Plugin update occur only after an
  explicit release approval.
