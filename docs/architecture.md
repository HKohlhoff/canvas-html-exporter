# Architecture

Canvas HTML Exporter has four main boundaries:

1. `src/main.ts`, settings and path pickers integrate with Obsidian.
2. `src/export/` normalizes Canvas data and orchestrates package creation.
3. `src/render/` creates HTML/Markdown and the standalone browser runtime.
4. `src/helpers/` provides small independently testable transformations.

Both export modes use the same semantic rendering path:

- package export writes `index.html`, assets and real subpages;
- single-HTML export embeds assets and represents subpages virtually.

Changes to rendering, links, assets or browser behavior must consider both
modes.

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
