# Canvas HTML Exporter 1.6.0: more faithful Markdown pages

This update makes exported Markdown pages look and search more like they do in Obsidian. It adds native highlight support, follows the inline-title setting, preserves intentional heading colors, and removes unrelated search matches.

The improvements apply equally to package folders and single HTML files. Source Canvases and notes are never changed.

## Highlights and colors

- Standard `==highlights==` are exported.
- Obsidian 1.14 colored highlights beginning with 🔴, 🟠, 🟡, 🟢, 🔵, or 🟣 keep their color while the marker itself stays hidden.
- Headings inherit the normal text color when the active theme does not define a distinct heading color. Deliberate theme heading colors remain intact.

## Inline titles

Exported Markdown pages now follow Obsidian's **Show inline title** setting. When it is disabled, only the automatically generated file-name heading is removed; headings written inside the note remain visible.

## Focused search

Markdown search results now use only the file name and the note's own content. Wiki links, Markdown links, embeds, owning Canvas titles, Canvas text cards, groups, Canvas references, and web links no longer create unrelated matches.

Package and single-HTML exports, including Canvas Folding behavior, were checked together for this release candidate.

Export the main Canvas again to use these improvements. Existing HTML exports do not update themselves.

## Update description

This description opens automatically once for version 1.6.0. It is marked as read only after you close it and does not open again on every Obsidian start.

Use **Show last update** at the bottom of the Canvas HTML Exporter settings to reopen it at any time, or **Show readme** for the full documentation. Closing it leaves no note or other content file in your Vault. Open plugin dialogs also close when the plugin is disabled.

If Canvas HTML Exporter makes your Canvas work easier, you can [buy me a coffee on Ko-fi](https://ko-fi.com/hokdev). Thank you!
