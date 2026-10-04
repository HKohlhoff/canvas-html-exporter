export const CURRENT_RELEASE_NOTES_ID = "release-1.4.0";

export const CURRENT_RELEASE_NOTES_MARKDOWN = `# Canvas HTML Exporter 1.4.0: Consistent group folding

This update aligns group folding in exported pages with the latest Canvas
Folding release, version 1.2.8. Groups now behave consistently in Obsidian and
in the exported page.
Your existing export settings remain in place, and package folders and single
HTML files continue to use the same browser controls.

## Group controls where you expect them

- Every group now has a collapse control directly to the right of its name.
- Empty groups can be collapsed and expanded as well.
- A collapsed empty group shows \`+\`; groups with hidden contents continue to
  show the number of contained nodes and groups.
- **Expand all** now expands separately collapsed groups as well as directed
  branches.

## Clearer collapsed groups

When you collapse a group, only its name and control remain visible. Nodes
inside the group and their connections are hidden together and return when you
expand it. Other groups remain independent. Nodes and group names also stay
clearly visible above crossing connections.

Folding changes only the exported view and never modifies the source \`.canvas\`
file.

Export the original Canvas again to apply these improvements. Existing HTML
exports do not update themselves.

## Update description

This description opens automatically once for version 1.4.0. It is marked as
read only after you close it and does not open again on every Obsidian start.

Use **Show last update** at the bottom of the Canvas HTML Exporter settings to
reopen it at any time, or **Show readme** for the full documentation. Closing it
leaves no note or other content file in your Vault. Open plugin dialogs also
close when the plugin is disabled.

If Canvas HTML Exporter makes your Canvas work easier, you can [buy me a coffee on
Ko-fi](https://ko-fi.com/hokdev). Thank you!
`;
