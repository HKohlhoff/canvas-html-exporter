# Roadmap: canvas-exporter

## Overview

canvas-exporter is an Obsidian plugin that converts canvas files into standalone HTML packages. Development focuses on fidelity — the exported HTML should look and behave exactly like the original canvas in Obsidian, with all content, layout, and embeds intact.

## Current Milestone

**v0.1 Initial Release** (v0.1.0)
Status: In progress
Phases: 5 of 5 complete

## Phases

| Phase | Name | Plans | Status | Completed |
|-------|------|-------|--------|-----------|
| 1 | Callouts | 1 | ✅ Complete | 2026-04-13 |
| 2 | Callout Fixes | 1 | ✅ Complete | 2026-04-13 |
| 3 | Collapsible Callouts | 1 | ✅ Complete | 2026-04-13 |
| 4 | Callout Icons | 1 | ✅ Complete | 2026-04-13 |
| 5 | PDF Usage | 1 | ✅ Complete | 2026-04-14 |

## Phase Details

### Phase 1: Callouts

**Goal:** Render Obsidian callout blocks (`> [!TYPE] Title`) as styled HTML callout boxes in both canvas node content and standalone markdown page exports.
**Depends on:** Nothing (first phase)
**Research:** Unlikely (internal markdown parser modification)

**Scope:**
- Callout detection in `markdownToHtml()`
- Callout CSS in both inline style blocks

**Plans:**
- [x] 01-01: Parse callouts + add CSS

### Phase 5: PDF Usage

Focus: PDF files embedded in canvas nodes are rendered in the exported HTML — scrollable inside an iframe and openable via a direct link.
Plans: 1 (05-01 complete)
Status: ✅ Complete (2026-04-14)

---
*Roadmap created: 2026-04-13*
*Last updated: 2026-04-14 after Phase 5*
