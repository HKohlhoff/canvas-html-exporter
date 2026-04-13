---
phase: 03-collapsible-callouts
plan: 01
completed: 2026-04-13T00:00:00Z
duration: 10min
---

# Phase 3 Plan 01: Collapsible Callouts Summary

**Callouts with `[!TYPE]+` render as `<details open>` (expanded) and `[!TYPE]-` as `<details>` (collapsed); non-collapsible callouts unchanged as `<div>`.**

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: `[!TYPE]+` renders as open collapsible | Pass |
| AC-2: `[!TYPE]-` renders as closed collapsible | Pass |
| AC-3: `[!TYPE]` without indicator unchanged | Pass |
| AC-4: Collapsible callout interactive in browser | Pass — native `<details>` toggle, no JS |

## Files Changed

| File | Change |
|------|--------|
| `canvas-exporter/src/converter.ts` | Regex captures `[+-]`; HTML forks to `<details>`/`<div>`; `<details>/<summary>` CSS in both style blocks |

---
*Completed: 2026-04-13*
