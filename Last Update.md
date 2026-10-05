# Canvas HTML Exporter 1.5.0: Large Canvases as connected pages

This update makes it practical to divide a large Canvas into an overview and
several linked Canvases without losing the feeling of one connected document.
The exported result can now be explored page by page, searched as a whole, and
navigated without having to know how its files are arranged.

Package folders and single HTML files provide the same navigation and search
experience. Your existing export settings remain in place.

## Turn an overview into a collection of Canvases

Link another Canvas from a Canvas file card or a Canvas wiki link. The exporter
follows those links and includes the linked Canvases automatically, including
further Canvases linked from them.

- A linked Canvas card shows a small offline preview of its layout, groups,
  colors, nodes, and connections.
- Clicking the title or preview opens that Canvas directly. A separate **Open
  canvas** label is no longer needed.
- Each linked Canvas opens with the same full Canvas layout and controls as the
  main overview.
- A Canvas that is referenced more than once is included only once. Circular
  links remain usable and do not create endless copies.
- A return card pointing back to the main overview is omitted from the exported
  subcanvas. Use the **(back to: Canvas)** link in the status line instead.

This lets you keep a compact overview while moving detailed chapters, project
areas, or process stages into their own Canvases.

## Navigate the complete export

Use **Navigation** to open a fixed panel on the left. The current page remains
visible beside it.

The **Canvases** section shows the main overview and all linked Canvases as an
alphabetically sorted hierarchy. **Pages in this canvas** lists the Markdown,
PDF, and link pages belonging directly to the selected Canvas. The active
Canvas or file page is highlighted, so you can see where you are.

Click **Navigation** again to close the panel. The setting **Navigation**
chooses whether it starts open or closed. Changing it on the main Canvas sets
the default for other Canvas pages, while each page can remember a different
choice. File pages start with Navigation closed on their first visit, leaving
the document itself unobstructed.

## Clear return paths

File pages opened from a linked Canvas show two destinations:

- **Back** returns to the Canvas that owns the file card.
- **Canvas** returns directly to the main overview.

File pages opened from the main overview show only **Canvas**, because both
destinations would be the same. Linked Canvas pages also provide the compact
**(back to: Canvas)** link in their status line.

When you return to a Canvas in a package export, its previous zoom level and
visible position are restored. Opening that Canvas again deliberately from a
card or from Navigation starts with its normal fitted view. This matches the
single HTML experience: returning continues where you left off, while a new
visit starts with a clear overview.

## Search across linked Canvases

**Search...** now covers the current Canvas and every Canvas below it in the
linked hierarchy. The line below the Search heading tells you which Canvas is
the starting point and whether subordinate Canvases are included.

- Markdown cards contribute their complete note text, not only the text visible
  in the Canvas preview.
- Every result names the Canvas it belongs to.
- Results for Markdown, PDF, and link cards open the corresponding page
  directly.
- Results without a separate page open their Canvas, bring the matching card
  into view, and highlight it.
- The same Vault file appears only once, even if several Canvases reference it.
- After using **Back** or **Canvas** from a result page, Search reopens with the
  same query, result information, and usable links.

Search, Navigation, zoom, minimap, and folding continue to work inside every
linked Canvas.

## Portable and non-destructive

Package exports use separate HTML pages and assets. Single HTML exports keep
the same hierarchy as virtual pages inside one self-contained file. Both
formats remain portable and work without Obsidian. The exporter does not alter
your source Canvases or notes.

Export the main overview Canvas again to use these improvements. Existing HTML
exports do not update themselves.

## Update description

This description opens automatically once for version 1.5.0. It is marked as
read only after you close it and does not open again on every Obsidian start.

Use **Show last update** at the bottom of the Canvas HTML Exporter settings to
reopen it at any time, or **Show readme** for the full documentation. Closing it
leaves no note or other content file in your Vault. Open plugin dialogs also
close when the plugin is disabled.

If Canvas HTML Exporter makes your Canvas work easier, you can [buy me a coffee on
Ko-fi](https://ko-fi.com/hokdev). Thank you!
