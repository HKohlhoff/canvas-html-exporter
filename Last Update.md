# Canvas HTML Exporter 1.5.0: A major step for connected Canvas projects

This update introduces three substantial new capabilities: an optional
Navigation panel, Canvas nodes that open as complete Canvas pages, and a
refined deep search.

Together, they turn an export from a single Canvas view into a structured,
navigable publication made from many connected Canvases and their pages. Large
projects no longer have to be squeezed into one crowded Canvas: they can be
divided into clear sections while still behaving like one coherent export.

All three improvements work in package folders and single HTML files. Your
existing export settings remain in place, and your source Canvases and notes
are never changed.

## 1. Optional Navigation panel

For the first time, readers can see and navigate the complete structure of a
Canvas export from every page. They no longer have to return to the main
overview simply to reach another section or document.

**Navigation** opens a fixed panel on the left while the current Canvas or file
page remains visible on the right. Click **Navigation** again to close it.

The panel contains two clearly separated areas:

- **Canvases** shows the main overview and all subordinate Canvases in an
  alphabetically sorted hierarchy.
- **Pages in this canvas** shows the Markdown, PDF, and link pages that belong
  directly to the current Canvas.

The currently displayed Canvas or file page is highlighted, making your
position in a larger export immediately visible.

The plugin setting **Navigation** defines whether the panel is initially open
or closed. This choice is passed from the main overview to subordinate Canvas
pages that do not yet have their own choice. Visitors can then open or close
Navigation independently on every Canvas and file page. That individual choice
is remembered when the page is opened again. File pages start with Navigation
closed on their first visit so the document has the full available width.

This provides orientation in large exports without permanently taking space
away from the Canvas or document being viewed.

## 2. Canvas nodes open as Canvas pages

A Canvas node is no longer just a reference to another file. It can now become
a complete, interactive page. This is the key
to splitting a large overview into manageable chapters, project areas, process
stages, or any other structure that suits the content.

A Canvas file node or a Canvas wiki link now opens the referenced Canvas as a
complete page inside the export. These subordinate Canvases are often called
subcanvases.

- The Canvas card shows a small offline preview of the referenced layout,
  including its groups, nodes, colors, and connections.
- The title and preview form one clickable area.
- The subcanvas uses the full browser area and offers the same zoom, minimap,
  search, and folding controls as the main overview.
- Further Canvas links are followed as well, so a subcanvas can contain another
  level of Canvas pages.
- A Canvas referenced more than once is included only once. Circular links
  remain usable without producing endless copies.

A subcanvas provides **(back to: Canvas)** in its status line to return to the
main overview. A Markdown, PDF, or link page opened from a subcanvas provides
two clear return paths: **Back** returns to its owning subcanvas, while
**Canvas** returns directly to the main overview. A file page belonging to the
main overview needs only **Canvas**.

Returning to a Canvas restores its previous view where applicable, including
the zoom level and visible position. Opening the same subcanvas again from its
card or from Navigation is treated as a new visit and starts with the normal
fitted overview.

The result feels like one connected work rather than a collection of separate
Canvas exports.

## 3. Refined deep search

Search no longer stops at the currently visible Canvas. A single search from
the main overview can now reveal relevant content anywhere in the complete
subordinate structure and lead directly to the page or card where it appears.

**Search...** now finds matching content throughout the current Canvas and all
of its subordinate Canvas pages. It searches Canvas nodes, pages belonging to
those Canvases, and the complete text of Markdown notes—not only the short
preview visible on a Canvas card.

The line below the Search heading states where the search begins and whether
subordinate Canvases are included. Every result also names its owning Canvas,
so you know where the match was found before opening it.

- A result for a Markdown, PDF, or link card opens the matching page directly.
- A result without a separate page opens its Canvas, moves the matching card
  into view, and highlights it.
- If the same exported page is referenced more than once, Search shows one
  clear result, while independent Canvas nodes remain separate results.
- After opening a result, **Back** and **Canvas** return with the same query and
  reopen Search on the destination Canvas. The result can then be opened again
  without losing its title or origin.

This makes the overview a useful starting point for searching the complete
export, while a search started inside a subcanvas stays within that part of the
hierarchy.

Together, Navigation, Canvas pages, and deep search provide a substantial gain
for publishing books, knowledge collections, project documentation, and other
large Canvas-based work. The export remains easy to share, but is now much
easier to explore and understand.

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
