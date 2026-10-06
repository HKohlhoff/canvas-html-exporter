# Deferred exporter work

## Respect Obsidian's inline-title setting

Status: implemented and covered for package and single-HTML exports.

When exporting a Markdown note, the exporter currently adds the file name as a
page title even when the note begins with its own level-one heading. Revisit
this behavior so that the generated file-name title follows Obsidian's
**Show inline title** setting at export time:

- when enabled, render the generated file-name title;
- when disabled, omit that generated title;
- always preserve headings that are part of the Markdown document;
- keep distinct file names and Markdown headings distinct when both are shown;
- apply the same behavior to package and single-HTML exports;
- add focused tests for enabled, disabled, equal-title, and different-title
  cases.

Implementation note: Obsidian exposes the current value at runtime through
`vault.getConfig("showInlineTitle")`, although that method is not part of the
published TypeScript surface. The access is isolated in a compatibility helper;
missing, non-boolean, or throwing implementations retain the previous behavior
and show the generated title.
