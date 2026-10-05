# Release checklist

Use this checklist before publishing Canvas HTML Exporter.

## Branch and repository

- The reviewed release branch is merged into `master` and back into `develop`
  using explicit merge commits (`--no-ff`); its annotated version tag is on
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
- The exporter version embedded in generated HTML matches the plugin version;
  `npm run test:metadata` verifies this synchronization.
- The embedded update-note ID matches the plugin version so a feature release
  opens its note once, and `Last Update.md` contains the identical Markdown.
  Maintenance releases also need their own version-bound ID and description;
  do not reuse the previous version's read marker.
- Every user-facing feature release follows the shared update-note standard:
  open a transient Markdown view once after update, mark it as read only after
  it closes, create no Vault file, and keep **Show last update** at the bottom
  of settings. Apply the same standard when starting a new plugin.
- Plugin ID, name, description, author, repository and GPL metadata agree.
- `npm run test:metadata` rejects Community Directory CSS warnings caused by
  `!important` declarations in `styles.css`.
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
- The release workflow verifies that its tag equals the manifest version.
- The tag workflow creates a missing GitHub release and safely refreshes the
  three reviewed assets when the release already exists; reruns must not fail
  merely because the release was created earlier.
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
  current version's description can be reopened at any time.
- Use **Show readme** beside it and confirm that the embedded repository README
  renders locally, closes cleanly, creates no Vault file and performs no
  automatic image request. Confirm that no image-placeholder notice remains and
  that the Ko-fi text link is visible and opens only after a click.
- Confirm that this view has no repeated blank lines, combines the Canvas
  comparison into one sentence without ellipses, and omits the oversized
  single-HTML example link.
- Export to a Vault folder and an allowed absolute desktop folder.
- With **Obsidian Settings → Files and links → Detect all file extensions**
  disabled for the test Vault, confirm that completed HTML exists on disk but
  may remain hidden in Obsidian's file tree. Enable the Vault setting and
  confirm that the existing HTML becomes visible without another export.
- Verify useful notices and failures for missing files and invalid targets.
- Confirm that Canvas and source notes are not modified.
- Complete the compact Windows smoke test from `manual-tests/README.md` on a
  current Windows/Obsidian installation and record the tested versions.

## Export regression matrix

- Package export opens through `index.html` with all required assets.
- Single HTML opens offline without external assets.
- Text, Markdown, links, images, PDFs, audio, video and code render correctly.
- Groups, nodes, edges, labels and colors remain correct.
- Zoom, mouse-selected area zoom, pan, fit/reset, search, minimap and subpage
  navigation work. Area zoom is available without activating a tool; its hint
  appears while the left mouse button is held, `Esc` cancels the current drag,
  and short or interactive clicks retain their normal behavior.
- Internal links, anchors, embeds and missing-target fallbacks work.
- Linked Canvas file nodes and wiki links open recursively in one click;
  the redundant source return card stays hidden, the upper-right **Canvas**
  **(back to: Canvas)** label follows the node/group/connection status with a
  20 px gap, only **Canvas** is linked and returns to the overview, and browser
  history, shared targets, cycles, and invalid
  target fallback work in package and single HTML.
- Canvas cards show the linked diagram preview in both formats without an
  **Open canvas** label or external preview asset.
- **Navigation** opens as a fixed left panel on every Canvas page, keeps the page
  visible beside it, restores full width on close, shows each shared/cyclic Canvas only
  once, highlights the current Canvas, and opens its directly contained
  Markdown, PDF-viewer, and link-node pages in the correct package or embedded
  single-HTML scope. Close, `Esc`, and keyboard focus work.
- The configured initial Navigation state is respected. Toggling it on the
  main Canvas persists across following pages, while a subcanvas toggle remains
  local and the next page returns to the main Canvas state.
- HTML pages owned by a subcanvas show **Back** to that subcanvas and **Canvas**
  to the root overview in both formats; root-owned pages omit redundant
  **Back** navigation.
- Test the documentation Canvas from `examples/demo-vault/`.
- Test `Advanced Canvas Attributes.canvas` from the same demo vault as package
  and single HTML. Compare all supported shapes, borders, alignments, colors,
  edge paths and edge heads, then exercise nested group controls, counts,
  search, minimap, fit/reset and restore.
- Repeat the Advanced Canvas example with the Standard, Minimal and AnuPpuccin
  themes. Confirm that uncolored edges reflect the active Canvas appearance,
  including Style Settings values and enabled CSS snippets.
- Disable Advanced Canvas and confirm that supported attributes already saved
  in the `.canvas` file still export normally.
- Regenerate the checked-in interactive HTML example from the current
  documentation Canvas when its content or browser runtime changed.
- Confirm that the regenerated example contains no absolute source-Vault path
  and reports the intended exporter version in its generator metadata.

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
- connected group branches plus focus controls on groups; focusing a group
  keeps all of its geometrically contained items active;
- a connected group containing a separate node branch: each branch controls
  only its own visibility, a hidden group takes its geometric contents with it,
  and an unavailable branch control remains visible but disabled until restore;
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

## Required runtime evidence before release

Automated tests do not replace this gate. Record Obsidian, OS, browser and
plugin versions and the result of the manual matrix before approving a release.
For local maintainer tests, use only the shared `Obsidian-PluginTests` Vault.

- Upgrade with the previous version's read marker already saved, once during
  Obsidian startup and once while the workspace is already open. The new note
  must open automatically, be marked read on close, stay closed on restart,
  and remain available through **Show last update**.
- Disable while an update or README dialog is open; both must close without
  writing a read marker from the unloaded instance.
- Export both modes to a Vault folder, the Vault root (`.`), and an absolute
  system folder. Check copied binary assets, cyclic note links, recursive
  section embeds, same-name PDFs, and group-only folding controls.
- Repeat drive-root and UNC output checks on Windows. The manifest remains
  desktop-only; mobile operation is not a release claim for this plugin.
