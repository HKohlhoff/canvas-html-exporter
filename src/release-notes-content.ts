export const CURRENT_RELEASE_NOTES_ID = "release-1.2.0";

export const CURRENT_RELEASE_NOTES_MARKDOWN = `# Canvas HTML Exporter 1.2.0: interactive Canvas exports

This major update turns an exported Canvas from a portable view into a more useful interactive page. Large or complex Canvases can now be explored branch by branch, focused on the part that matters, and enlarged exactly where needed. The original Canvas layout and source file remain unchanged.

## New interactive tools

- **Folding in every export:** expand or collapse directed branches directly in the generated HTML page. The Folding menu is always available, even when Canvas Folding is not installed.
- **Useful controls for complex structures:** collapsed branches show how many content nodes are hidden. Connected groups follow their own branches and hide geometrically contained nodes when folded, while a separate node branch inside a group does not hide the group frame. A branch control stays visible but disabled while all of its descendants are unavailable behind a folded group. Shared descendants remain visible while another open parent still reaches them.
- **Flexible overview controls:** use **Expand all**, **Collapse all**, a visible level, **Restore folding**, or **No folding**. Folding and focus controls can be shown or hidden independently without changing the current view.
- **Node and branch focus:** isolate one node, one group, or a complete branch at full opacity while the surrounding Canvas remains visible as subdued context. Select the same focus control again or use **Exit focus** to return.
- **Area zoom:** drag a rectangle with the left mouse button over a non-interactive part of the Canvas and release it to fill the available view with that area. Press **Esc** to cancel the current drag.
- **Unobtrusive default:** **No folding** starts the page fully expanded with node controls hidden. Choose **Enable folding** in the HTML page whenever you want to use them.
- **Optional state transfer with Canvas Folding:** if the Canvas Folding plugin is installed and enabled, choose **Current Canvas Folding state** to open the exported page with the same folded branches currently shown in Obsidian. This transfer works only while Canvas Folding is active; without it, the exporter safely creates a normal, fully usable export.

## Improvements to existing exports

- **Better handling of large Canvases:** **Package folder** is the recommended format for large or media-heavy Canvases. Its smaller **index.html** usually becomes interactive sooner than a single HTML file with embedded assets.
- **Smarter reset and fit:** **Reset** fills the available browser area with the currently visible or focused part of the Canvas and also respects short browser windows.
- **Clearer search feedback:** the selected search result receives a strong yellow pulse highlight, making it much easier to locate.
- **More useful status information:** the header reports hidden nodes and hidden groups separately.
- **Predictable visual behavior:** visible items keep their original positions. Hidden endpoints also hide their connections and labels, while shared branches remain consistent when they have multiple parents.
- **Same behavior in both formats:** package and single-HTML exports use the same interactive browser functionality and remain portable.

## Getting started

1. Open **Settings → Canvas HTML Exporter**.
2. Keep **No folding** to start fully expanded with node controls switched off, select **Fully expanded** to start with the controls enabled, or select **Current Canvas Folding state** to import the optional Canvas Folding state. The Folding menu is included in every mode.
3. Export a Canvas as a package folder or a single HTML file.
4. Use the **Folding** menu in the generated page. In **No folding** mode, choose **Enable folding** when you want to show the node controls. Drag with the left mouse button when you want to enlarge a freely selected part of the Canvas.

The exporter never writes folding state into the source Canvas.

This update description appears automatically once. You can reopen it at any time with **Show last update** at the bottom of the Canvas HTML Exporter settings. Closing it leaves no note or other content file in your Vault.

If Canvas HTML Exporter makes your Canvas work easier and you would like to support its continued development, you can [buy me a coffee on Ko-fi](https://ko-fi.com/hokdev). Thank you!
`;
