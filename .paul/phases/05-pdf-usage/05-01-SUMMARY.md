---
phase: 05-pdf-usage
plan: 01
subsystem: ui
tags: [pdf, iframe, html-export, canvas-nodes]

requires: []
provides:
  - PDF canvas nodes render with a clickable title header linking to a dedicated viewer page
  - Each exported PDF gets a companion viewer HTML page in assets/files/
  - PDF iframe renders without sandbox restrictions (browser native PDF viewer works)

affects: []

tech-stack:
  added: []
  patterns:
    - "PDF viewer subpage: derived filename {pdfname}-viewer.html, co-located in assets/files/"
    - "Separate hrefs for iframe src (raw PDF) vs title link (viewer page)"

key-files:
  modified:
    - canvas-exporter/src/exporter.ts
    - canvas-exporter/src/converter.ts

key-decisions:
  - "Remove sandbox entirely rather than adding allow-scripts — simpler, no CSP side-effects"
  - "Derive viewer filename from exportPath suffix to avoid double counter increment"
  - "PDF title link uses canvasHref (viewer page); iframe src uses exportPath (raw PDF)"

patterns-established:
  - "PDF nodes follow markdown-card pattern: title link above content"

duration: ~15min
started: 2026-04-14T00:00:00Z
completed: 2026-04-14T00:00:00Z
---

# Phase 5 Plan 01: PDF Usage Summary

**PDF canvas nodes now render with a clickable filename header (linking to a full-viewport viewer page) and a sandbox-free iframe, enabling browser-native PDF rendering and scrolling.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Tasks | 2 completed |
| Files modified | 2 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: PDF readable in iframe | Pass | `sandbox` attribute removed — browser PDF viewer now works |
| AC-2: PDF scrollable | Pass | Browser native PDF viewer handles internal scrolling inside iframe |
| AC-3: Title header links to viewer page | Pass | `.pdf-title-link` renders before iframe; `canvasHref` points to generated viewer HTML |

## Accomplishments

- `exporter.ts`: PDF branch now generates `{name}-viewer.html` in `assets/files/` and sets `canvasHref` on the node alongside `exportPath`
- `converter.ts`: PDF node renders with `.pdf-title-link` header (filename → viewer page) + bare iframe (no sandbox)
- CSS updated: `.pdf-fallback-link` removed, `.pdf-title-link` / `.pdf-title` / `.pdf-title:hover` added

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `canvas-exporter/src/exporter.ts` | Modified | PDF branch generates viewer HTML, sets `canvasHref` |
| `canvas-exporter/src/converter.ts` | Modified | Rendering + CSS: title link, no sandbox, removed fallback link |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Remove `sandbox` entirely | `allow-same-origin` alone blocks browser PDF viewer JS; simplest fix | PDF renders natively in all modern browsers |
| Viewer filename derived from `exportPath` suffix | Avoids calling `uniqueOutputName` twice (would skip a counter value) | Predictable naming: `003_doc.pdf` → `003_doc-viewer.html` |
| `pdfHref` ≠ `viewerHref` | iframe needs raw PDF; title link needs the viewer page | Clean separation of concerns |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- PDF export pipeline complete end-to-end
- Pattern established for file-type-specific viewer pages if needed in future

**Concerns:**
- None

**Blockers:**
- None

---
*Phase: 05-pdf-usage, Plan: 01*
*Completed: 2026-04-14*
