---
phase: 01-callouts
plan: 01
subsystem: ui
tags: [markdown, callouts, html, css, obsidian]

requires: []
provides:
  - Obsidian callout rendering in markdownToHtml()
  - Callout CSS in canvas node and markdown page styles
affects: []

tech-stack:
  added: []
  patterns:
    - "Callout detection: regex match on first blockquote line before rendering"
    - "Dual CSS injection: node-content prefix for canvas, top-level for markdown pages"

key-files:
  modified:
    - canvas-exporter/src/converter.ts

key-decisions:
  - "Inline detection logic: no new helper function — kept in blockquote handler"
  - "CSS per-type coloring: 6 color groups covering all standard Obsidian callout types"
  - "Fallback title: capitalize type name when no custom title given"

patterns-established:
  - "escapeAttribute(type) used for CSS class injection to prevent XSS in callout type"

duration: ~15min
started: 2026-04-13T00:00:00Z
completed: 2026-04-13T00:00:00Z
---

# Phase 1 Plan 01: Callouts Summary

**Obsidian callout blocks (`> [!TYPE] Title`) now render as styled, color-coded HTML divs in both canvas node content and standalone markdown page exports.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~15 min |
| Started | 2026-04-13 |
| Completed | 2026-04-13 |
| Tasks | 2 completed |
| Files modified | 1 |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Callout blocks render as styled divs | Pass | `<div class="callout callout-{type}">` with title + content divs |
| AC-2: Title defaults to type name when omitted | Pass | `type.charAt(0).toUpperCase() + type.slice(1)` fallback |
| AC-3: Plain blockquotes are unaffected | Pass | `else` branch preserved — `<blockquote>` output unchanged |
| AC-4: Callout types map to distinct colors | Pass | 6 color groups: blue, green, amber, red, purple, gray |

## Accomplishments

- Added callout detection regex (`/^\[!([\w-]+)\](?:\s+(.*))?$/i`) to `markdownToHtml()` blockquote handler
- Added 18 lines of callout CSS to canvas node inline styles (prefixed `.node-content`)
- Added 18 lines of callout CSS to markdown page inline styles (unprefixed)
- Build clean: 66.7kb, 0 TypeScript errors

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `canvas-exporter/src/converter.ts` | Modified | Callout parsing in `markdownToHtml()` + CSS in both style blocks |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Inline detection — no new helper | Keeps logic co-located with blockquote handler; one-place to understand the fork | Simpler; future callers of `markdownToHtml()` get callouts automatically |
| `escapeAttribute(type)` on CSS class | Prevents XSS if a malformed callout type contains HTML chars | Safe-by-default |
| No callout folding/collapse | Out of scope per plan boundaries | Can be added in a future phase |

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

**Ready:**
- Callout rendering complete and shipped
- Both CSS contexts covered — canvas nodes and markdown subpages both styled

**Concerns:**
- No visual verification performed in a real Obsidian export — recommend testing with an actual canvas file containing callouts before relying in production

**Blockers:**
- None

---
*Phase: 01-callouts, Plan: 01*
*Completed: 2026-04-13*
