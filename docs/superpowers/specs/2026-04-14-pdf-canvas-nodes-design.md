# Design: PDF Canvas Node Rendering

**Date:** 2026-04-14  
**Status:** Approved

## Problem

Canvas nodes pointing to PDF files are currently rendered as a plain `<a>` link chip (the generic file fallback). The `fileKind: "pdf"` value is already set by the exporter but `converter.ts` has no branch for it, so PDFs get no special treatment.

## Goal

Render PDF canvas nodes as inline embedded viewers using `<iframe>`, filling the node's canvas dimensions. A small fallback link is always visible below the viewer for browsers without native PDF support.

## Data Flow

No changes to `exporter.ts`. It already:
- Sets `fileKind: "pdf"` for `.pdf` files
- Copies the file to `assets/files/` and stores the root-relative path in `exportPath`

All changes are in `canvas-exporter/src/converter.ts`.

## HTML Output

In `renderNodeContent`, a new branch for `fileKind === "pdf"` is added before the generic fallback:

```html
<div class="pdf-embed">
  <iframe src="assets/files/001_doc.pdf" title="doc" loading="lazy"></iframe>
  <a class="pdf-fallback-link" href="assets/files/001_doc.pdf" target="_blank" rel="noopener noreferrer">
    PDF öffnen ↗
  </a>
</div>
```

- `loading="lazy"` — defers loading until the node is near the viewport
- `title` — uses `displayName` for accessibility
- Fallback link is always rendered as a small footer bar (not hidden), useful even when the viewer works

The outer node `<div>` gets an additional `pdf` CSS class.

## CSS

Added to the stylesheet in `convertCanvasToHtml`:

```css
.node.pdf {
  padding: 0;
}
.pdf-embed {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.pdf-embed iframe {
  flex: 1;
  width: 100%;
  border: none;
  display: block;
}
.pdf-fallback-link {
  display: block;
  padding: 4px 10px;
  font-size: 0.8em;
  text-align: right;
  opacity: 0.6;
}
```

The `.node.pdf` override removes the default `12px 14px` padding so the iframe fills edge-to-edge. The fallback link sits as a slim footer row below the viewer.

## Affected Files

| File | Change |
|------|--------|
| `canvas-exporter/src/converter.ts` | Add `pdf` CSS class to node div, add CSS rules, add `fileKind === "pdf"` branch in `renderNodeContent` |

## Out of Scope

- Audio and video media types (separate feature)
- PDF text extraction or thumbnail generation
- Base64 embedding of PDFs
