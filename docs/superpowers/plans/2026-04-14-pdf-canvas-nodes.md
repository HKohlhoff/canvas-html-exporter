# PDF Canvas Node Rendering — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render PDF file nodes in the canvas export as inline `<iframe>` viewers instead of plain download links.

**Architecture:** All changes are in `canvas-exporter/src/converter.ts`. The exporter already sets `fileKind: "pdf"` and `exportPath` on PDF nodes — no changes to `exporter.ts`. Three additions to `converter.ts`: a `pdf` CSS class on the node div, CSS rules for the iframe layout, and a `fileKind === "pdf"` branch in `renderNodeContent`.

**Tech Stack:** TypeScript, esbuild, Obsidian plugin API (no new dependencies)

---

## File Map

| File | Change |
|------|--------|
| `canvas-exporter/src/converter.ts` | Add `pdf` class to node div in `renderNode`; add CSS rules after `.node.group`; add PDF branch in `renderNodeContent` |

---

### Task 1: Add `pdf` CSS class to node div

**Files:**
- Modify: `canvas-exporter/src/converter.ts:628`

- [ ] **Step 1: Edit `renderNode` to add `pdf` class for PDF nodes**

In `canvas-exporter/src/converter.ts`, find line 628:

```typescript
  const classes = ["node", escapeAttribute(type === "group" ? "group" : "")].filter(Boolean).join(" ");
```

Replace with:

```typescript
  const isPdf = node.fileKind === "pdf";
  const classes = ["node", type === "group" ? "group" : "", isPdf ? "pdf" : ""].filter(Boolean).join(" ");
```

- [ ] **Step 2: Build and verify no TypeScript errors**

```bash
cd /Users/Holger/SynologyDrive/Projekt_canvas2html/canvas-exporter && npm run build
```

Expected: build completes with no errors, `release/main.js` is updated.

- [ ] **Step 3: Commit**

```bash
cd /Users/Holger/SynologyDrive/Projekt_canvas2html && git add canvas-exporter/src/converter.ts && git commit -m "feat(pdf): add pdf CSS class to file nodes with fileKind pdf"
```

---

### Task 2: Add CSS rules for PDF iframe layout

**Files:**
- Modify: `canvas-exporter/src/converter.ts:149–153` (after `.node.group` block)

- [ ] **Step 1: Insert PDF CSS rules after the `.node.group` block**

In `canvas-exporter/src/converter.ts`, find the `.node.group` block ending at line 153:

```css
    .node.group {
      background: ${theme.groupBackground};
      border-style: dashed;
      z-index: 0;
    }
```

Insert the following block immediately after it:

```css
    .node.group {
      background: ${theme.groupBackground};
      border-style: dashed;
      z-index: 0;
    }
    .node.pdf {
      padding: 0;
    }
    .node.pdf .node-content {
      overflow: hidden;
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

- [ ] **Step 2: Build and verify no errors**

```bash
cd /Users/Holger/SynologyDrive/Projekt_canvas2html/canvas-exporter && npm run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/Holger/SynologyDrive/Projekt_canvas2html && git add canvas-exporter/src/converter.ts && git commit -m "feat(pdf): add CSS rules for PDF iframe node layout"
```

---

### Task 3: Add PDF rendering branch in `renderNodeContent`

**Files:**
- Modify: `canvas-exporter/src/converter.ts:697–706` (inside `type === "file"` block)

- [ ] **Step 1: Insert `fileKind === "pdf"` branch before the generic fallback**

In `canvas-exporter/src/converter.ts`, find lines 705–706 (the generic fallback inside `type === "file"`):

```typescript
    if (!href) return "<p>Leerer Datei-Knoten</p>";
    return `<p><a class="file-chip" href="${href}" target="_blank" rel="noopener noreferrer">${displayName}</a></p>`;
```

Insert the following block immediately before those two lines:

```typescript
    if (node.fileKind === "pdf") {
      const pdfHref = escapeAttribute(node.exportPath || node.file || "");
      if (!pdfHref) return "<p>Leerer PDF-Knoten</p>";
      const pdfName = escapeHtml(node.displayName || node.file || "PDF");
      return `<div class="pdf-embed"><iframe src="${pdfHref}" title="${pdfName}" loading="lazy"></iframe><a class="pdf-fallback-link" href="${pdfHref}" target="_blank" rel="noopener noreferrer">PDF öffnen ↗</a></div>`;
    }

    if (!href) return "<p>Leerer Datei-Knoten</p>";
    return `<p><a class="file-chip" href="${href}" target="_blank" rel="noopener noreferrer">${displayName}</a></p>`;
```

Note: the last two lines are the existing fallback — include them so the diff is clear, but do not duplicate them.

- [ ] **Step 2: Build and verify no errors**

```bash
cd /Users/Holger/SynologyDrive/Projekt_canvas2html/canvas-exporter && npm run build
```

Expected: build completes with no errors.

- [ ] **Step 3: Manual smoke test**

1. In Obsidian, open a canvas that contains at least one PDF file node.
2. Run **Export: Aktuelles Canvas als HTML speichern**.
3. Open the exported `Canvas-Exports/<name>/index.html` in a browser.
4. Verify:
   - The PDF node shows an embedded iframe viewer (not a link chip).
   - The "PDF öffnen ↗" link appears below the viewer and opens the PDF in a new tab.
   - Other node types (text, image, markdown, link) are unaffected.
5. If no canvas with a PDF is available, create a simple test canvas: add a file node pointing to any `.pdf` in the vault, then export.

- [ ] **Step 4: Commit**

```bash
cd /Users/Holger/SynologyDrive/Projekt_canvas2html && git add canvas-exporter/src/converter.ts && git commit -m "feat(pdf): render PDF canvas nodes as inline iframe viewers"
```
