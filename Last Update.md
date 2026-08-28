# Canvas HTML Exporter 1.2.0: interactive folding

This update adds interactive tree and folding tools to exported Canvas HTML pages while preserving the original Canvas layout.

## Highlights

- **Optional Canvas Folding integration:** choose **Current Canvas Folding state** to start the exported page with the same folded branches that are currently shown in Obsidian.
- **No folding by default:** pages start fully expanded with node controls switched off. The Folding menu remains available, and **Enable folding** activates the controls at any time.
- **No required dependency:** exports remain fully usable when Canvas Folding is not installed, disabled, incompatible, or unavailable.
- **Branch controls:** expand or collapse individual directed branches directly on their nodes.
- **Clear branch size:** a collapsed branch shows its number of hidden descendant nodes. Multi-digit controls grow without covering the focus control. If shared descendants stay visible and only connections are hidden, the plus sign remains and its tooltip reports the hidden connections.
- **Global folding menu:** use **Expand all**, **Collapse all**, a visible level, **Restore folding**, or **No folding**.
- **Independent controls:** use **Hide/Show folding controls** and **Hide/Show focus controls** to adjust the node controls without changing the current view state.
- **Node and branch focus:** focus any node on its own or together with its descendants while the surrounding context remains visible at 20% opacity. Use the same focus control again or **Exit focus** to return.
- **Stable layout:** folding changes visibility only. Visible nodes keep their Canvas positions.
- **Consistent connections:** an edge and its label disappear whenever an endpoint is hidden.
- **Clear status information:** the header reports hidden nodes and hidden groups separately.
- **Visibility-aware fit:** **Reset** fits the currently relevant nodes and respects short browser windows, the header, folding, levels, and branch focus.
- **Improved search feedback:** the selected search result receives a strong yellow pulse highlight.
- **Faster option for large Canvases:** prefer **Package folder** for large or media-heavy Canvases. Its small **index.html** usually becomes interactive sooner than a single HTML file with embedded assets.

## Using the new features

1. Open **Settings → Canvas HTML Exporter**.
2. Keep **No folding** to start fully expanded with node controls switched off, select **Fully expanded** to start with the controls enabled, or select **Current Canvas Folding state** to import the optional Canvas Folding state. The Folding menu is included in every mode.
3. Export a Canvas as a package folder or a single HTML file.
4. Use the **Folding** menu in the generated page. In **No folding** mode, choose **Enable folding** when you want to show the node controls.

Both export formats use the same browser runtime. The exporter never writes folding state into the source Canvas.

This update description appears automatically once. You can reopen it at any time with **Show last update** at the bottom of the Canvas HTML Exporter settings. Closing it leaves no note or other content file in your Vault.
