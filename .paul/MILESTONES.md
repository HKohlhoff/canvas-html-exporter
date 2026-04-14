# Milestones

Completed milestone log for this project.

| Milestone | Completed | Duration | Stats |
|-----------|-----------|----------|-------|
| v0.1 Initial Release | 2026-04-14 | ~2 days | 5 phases, 5 plans |

---

## ✅ v0.1 Initial Release

**Completed:** 2026-04-14
**Duration:** ~2 days (2026-04-13 → 2026-04-14)

### Stats

| Metric | Value |
|--------|-------|
| Phases | 5 |
| Plans | 5 |
| Files changed | 2 (converter.ts, exporter.ts) |

### Key Accomplishments

- **Callout rendering:** `> [!TYPE] Title` blocks render as styled, color-coded HTML divs in both canvas node content and standalone markdown page exports — 6 color groups, 24 type mappings
- **Callout fixes:** Collapsible syntax (`[!TYPE]+/-`) recognized; consecutive callouts no longer merge
- **Collapsible callouts:** `[!TYPE]+` renders as `<details open>`, `[!TYPE]-` as `<details>` — interactive with no JavaScript
- **Callout icons:** Type-specific Unicode icons in title bars (✎ note, ⚠ warning, 🔥 tip, etc.) with ◆ fallback for unknown types
- **PDF nodes:** Canvas PDF file nodes render with a scrollable browser-native iframe viewer and a clickable title header linking to a dedicated companion viewer HTML page

### Key Decisions

| Decision | Rationale |
|----------|-----------|
| Callout detection inline in blockquote handler | No new helper; co-located with the fork it controls |
| Dual CSS injection (canvas + markdown pages) | Each output context needs independent styles |
| `<details>` for collapsible callouts | Native browser element — no JavaScript, accessible |
| PDF iframe: no sandbox | `allow-same-origin` alone blocks browser PDF viewer (requires JS) |
| Viewer page filename derived from exportPath suffix | Avoids double counter increment in `uniqueOutputName` |

---
