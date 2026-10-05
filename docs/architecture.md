# Architecture

Canvas HTML Exporter has these main boundaries:

1. `src/main.ts`, settings and path pickers integrate with Obsidian.
2. `src/export/` normalizes Canvas data and orchestrates package creation.
3. `src/integrations/` discovers optional providers through public APIs.
4. `src/folding/` contains pure graph and export-state logic.
5. `src/render/` creates HTML/Markdown and the standalone browser runtime.
6. `src/ui/` contains short-lived Obsidian UI, while `src/plugin-data.ts`
   owns versioned persistence and migration.
7. `src/helpers/` provides small independently testable transformations.

Both export modes use the same semantic rendering path:

- package export writes `index.html`, assets and real subpages;
- single-HTML export embeds assets and represents subpages virtually.

Changes to rendering, links, assets or browser behavior must consider both
modes.

## Linked Canvas boundary

The export orchestrator resolves `.canvas` file nodes and internal Canvas
links by canonical Vault path. It owns a per-export registry so a shared target
is prepared once and directed cycles terminate without removing the links that
form them. Parsing, normalization and HTML rendering continue through the same
Canvas pipeline used by the root document.

Package exports write referenced Canvases as real sibling HTML pages. A single
HTML export registers them as virtual pages in the root document and embeds
each complete Canvas document in an isolated frame. Links from an embedded
Canvas navigate its parent document, which preserves one-click transitions,
browser history and the existing virtual-page runtime without introducing a
second renderer.

A Canvas file node in a linked Canvas that targets the root Canvas is treated
as redundant export navigation and omitted from that linked page. Single HTML
already exposes the root through its virtual-page **Canvas** control; package
subpages receive an equivalent `index.html` link. Subcanvas documents place
this return row after the page heading and before the viewport. For embedded
Canvas pages, the redundant outer virtual-page toolbar is hidden; non-Canvas
virtual pages retain it. Textual links to the root remain ordinary content and
are preserved.

Each Canvas retains its own Markdown/link subpage registry and browser state;
asset naming is shared across the complete recursive export. Only the active
root Canvas may import the optional live Canvas Folding state. Linked Canvases
use their saved graph and start with the exporter's normal expanded state.
Invalid linked Canvas data falls back to the established generic-file export
and does not abort otherwise valid output.

After recursive preparation completes, Canvas file nodes receive a compact,
non-recursive preview projection of the resolved target: node/group geometry,
supported shapes and colors, plus connection endpoints and colors. The
renderer turns this projection into inline SVG. This keeps previews identical
in package and single HTML, offline-capable, cycle-safe, and independent of
screenshots or browser automation.

## Canvas Folding boundary

Canvas Folding is an optional provider. The exporter may discover the plugin by
the stable ID `canvas-folding`, verify the supported API version and consume
only its documented plain-data response. Missing, disabled, incompatible or
failing Folding integrations must fall back to the established export.

The exporter owns the browser representation and controls. Canvas Folding owns
its Obsidian view state and graph semantics. Neither plugin accesses private
classes, DOM objects or implementation details of the other.

The first integration uses stable node positions. It does not introduce a
shared runtime core, persistent Canvas metadata or an Advanced Canvas
dependency.

## Advanced JSON Canvas compatibility boundary

Advanced Canvas appearance is read from the saved `.canvas` document rather
than from plugin runtime state. The exporter accepts only a documented,
explicit allowlist of built-in Advanced JSON Canvas fields and maps them into
its own neutral node, edge and group-state model.

This compatibility layer does not discover or require the Advanced Canvas
plugin, access its DOM or private classes, copy its runtime CSS, or interpret
arbitrary custom style attributes. Unknown fields and values are ignored, and
ordinary JSON Canvas exports continue through the established fallback path.

Saved Advanced group collapse is a geometric group state, separate from the
exporter's directed branch-folding state. Package and single-HTML exports use
the same normalized model and browser implementation.

## Plugin data and one-time UI

Persisted plugin data uses a versioned envelope that keeps user settings and
one-time UI state separate. Legacy top-level settings remain a supported
migration source. The feature-update description is embedded as Markdown in
the plugin bundle and rendered in a short-lived Obsidian modal; it does not
create a note or other content file in the Vault. The read marker is stored
only after the modal closes.

Writes of settings and update markers are serialized with independent snapshots.
Data with a newer unsupported schema is rejected before initialization so an
older plugin cannot overwrite it. The update ID is bound to every plugin
version, including maintenance releases; plugin-owned dialogs close on unload.

JSON embedded inside browser scripts escapes `<` so Canvas content cannot end
the script element. Link-node previews accept HTTP(S) destinations only;
executable navigation schemes are not emitted as Markdown or link-node links.

## Renderer modules

`src/render/converter.ts` remains the public facade; existing plugin, exporter
and test imports continue to work. Implementation responsibilities are separate:

- `types.ts` and `metadata.ts`: shared render data, exporter version/signature;
- `canvas-document.ts`: prepare the Canvas model and assemble the document;
- `canvas-styles.ts` and `theme.ts`: Canvas stylesheet and theme/color rules;
- `nodes.ts` and `geometry.ts`: nodes, group titles, minimap items and geometry;
- `markdown.ts`, `highlighting.ts` and `markdown-document.ts`: Markdown, code
  highlighting and standalone note documents;
- `html.ts`: HTML escaping and safe script-data serialization;
- `browser-runtime.ts`: browser initialization and event registration;
- `browser-edges.ts`, `browser-viewport.ts`, `browser-pages.ts`,
  `browser-search.ts`, `browser-folding.ts` and `browser-interaction.ts`:
  the corresponding browser functions, emitted into the same shared closure;
- `browser-runtime-types.ts`: the typed inputs for browser code generation.

Browser pieces remain generated inline JavaScript: the exported document needs
no module loader, runtime library or external script. Their assembly order
preserves the existing closure and behavior in both export modes. Internal
renderer modules do not import the public facade and have no dependency cycles.
The production version-bump and metadata checks use `metadata.ts` as the source
of the exporter version.

Search keeps Tab/Shift+Tab inside the open dialog and returns focus to the
original trigger when closed. The browser directory-picker fallback lives in
`src/helpers/folder-input.ts`; both selection and cancellation settle its Promise
and remove event handlers.
