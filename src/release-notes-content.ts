export const CURRENT_RELEASE_NOTES_ID = "release-1.3.0";

export const CURRENT_RELEASE_NOTES_MARKDOWN = `# Canvas HTML Exporter 1.3.0: Advanced Canvas compatibility

This update brings the appearance and group behavior saved by Advanced Canvas
into portable HTML exports. Package folders and single HTML files use the same
implementation, and Advanced Canvas is not required when exporting or viewing
the result.

## More of your Canvas appearance in HTML

- **Built-in shapes:** round rectangle, pill, diamond, parallelogram, circle,
  predefined process, document, and database nodes retain their saved shape.
- **Borders and alignment:** supported dashed, dotted, invisible, and normal
  borders and saved text alignment are reproduced.
- **Edges:** dotted, short-dashed, and long-dashed paths plus filled, outline,
  open, halved, and blunt edge heads are preserved.
- **Canvas colors:** saved palette and custom colors are retained. Items
  without an explicit color follow the active Canvas appearance sampled during
  export, including relevant theme, Style Settings, and CSS snippet values.
- **Collapsible groups:** exported Advanced Canvas groups have their own
  controls. A collapsed group keeps its title and connected edges visible
  while hiding its frame and contained content. Nested groups, counts, search,
  minimap, fit/reset, restore, and Canvas Folding continue to work together.

## Getting started

Open \`Advanced Canvas Attributes.canvas\` in the included demo vault and export
it as a package or single HTML file. It provides a self-contained overview of
the supported shapes, borders, alignments, colors, edge paths, edge heads, and
nested group behavior.

Advanced Canvas does not need to be installed for saved supported attributes
to be exported. Floating edges, portals, presentation mode, custom CSS styles,
and the \`direct\`, \`square\`, and \`a-star\` pathfinding modes are outside this
compatibility layer.

This update description appears automatically once. You can reopen it at any
time with **Show last update** at the bottom of the Canvas HTML Exporter
settings. Closing it leaves no note or other content file in your Vault.

If Canvas HTML Exporter makes your Canvas work easier and you would like to
support its continued development, you can [buy me a coffee on
Ko-fi](https://ko-fi.com/hokdev). Thank you!
`;
