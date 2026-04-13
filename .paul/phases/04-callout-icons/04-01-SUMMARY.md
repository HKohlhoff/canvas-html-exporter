---
phase: 04-callout-icons
plan: 01
completed: 2026-04-13T00:00:00Z
duration: 5min
---

# Phase 4 Plan 01: Callout Icons Summary

**Callout title bars now show type-specific Unicode icons; custom/unknown types fall back to ◆.**

## AC Result

| Criterion | Status |
|-----------|--------|
| AC-1: Standard types show appropriate icon | Pass — 24 types mapped (note ✎, warning ⚠, tip 🔥, etc.) |
| AC-2: Custom/unknown types show ◆ fallback | Pass — `?? "◆"` default |
| AC-3: Icon renders before title text | Pass — `<span class="callout-icon">` prepended in both div and details branches |

## Files Changed

| File | Change |
|------|--------|
| `canvas-exporter/src/converter.ts` | `calloutIcons` map + icon span in HTML output + `.callout-icon` CSS in both style blocks |

---
*Completed: 2026-04-13*
