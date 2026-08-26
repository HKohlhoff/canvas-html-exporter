export const CURRENT_RELEASE_NOTES_ID = "canvas-folding-integration-v1-dialog";

export const CURRENT_RELEASE_NOTES_MARKDOWN = `# Canvas HTML Exporter: new folding features

This update adds interactive tree and folding tools to exported Canvas HTML pages while preserving the original Canvas layout.

## Highlights

- **Optional Canvas Folding integration:** choose **Current Canvas Folding state** in the exporter settings to use the effective hidden state supplied by Canvas Folding API v1 as the initial HTML view.
- **No required dependency:** exports remain fully usable when Canvas Folding is not installed, disabled, incompatible, or unavailable.
- **Branch controls:** expand or collapse individual directed branches directly on their nodes.
- **Global folding menu:** use **Expand all**, **Collapse all**, a visible level, **Restore folding**, or **No folding**.
- **Branch focus:** focus a node and its descendants while the surrounding context remains visible at 20% opacity. Use the same focus control again or **Exit focus** to return.
- **Stable layout:** folding changes visibility only. Visible nodes keep their Canvas positions.
- **Consistent connections:** an edge and its label disappear whenever an endpoint is hidden.
- **Clear status information:** the header reports hidden nodes and hidden groups separately.
- **Visibility-aware fit:** **Reset** fits the currently relevant nodes and respects short browser windows, the header, folding, levels, and branch focus.
- **Improved search feedback:** the selected search result receives a strong yellow pulse highlight.

## Using the new features

1. Open **Settings → Canvas HTML Exporter**.
2. Keep **Fully expanded** for the established export behavior, or select **Current Canvas Folding state** to import the optional Canvas Folding state.
3. Export a Canvas as a package folder or a single HTML file.
4. Use the node controls and the **Folding** menu in the generated page.

Both export formats use the same browser runtime. The exporter never writes folding state into the source Canvas.

This update description is shown once. After you close it, it leaves no note or other content file in your Vault.
`;
