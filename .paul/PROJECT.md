# canvas-exporter

## What This Is

An Obsidian plugin that converts `.canvas` files into standalone, portable HTML packages. The exported HTML preserves the full visual layout, content, and embedded assets of the original Obsidian canvas — ready to be served via a webserver or shared without Obsidian.

## Core Value

Obsidian users can export a canvas file to a standalone, interactive HTML package that looks and behaves exactly like the original canvas — including all content, layout, and embeds.

## Current State

| Attribute | Value |
|-----------|-------|
| Type | Application |
| Version | 0.1.0 |
| Status | Active development |
| Last Updated | 2026-04-13 |

## Requirements

### Core Features

- Export active canvas to a standalone HTML package

### Validated (Shipped)

- [x] Basic canvas-to-HTML conversion (nodes, layout, colors)
- [x] Asset copying (images, files)
- [x] Markdown node rendering with subpage support
- [x] Link rewriting (wiki-links → relative paths)
- [x] Asset deduplication
- [x] Obsidian callout rendering (`> [!TYPE] Title` → styled HTML) — Phase 1

### Active (In Progress)

None yet.

### Planned (Next)

- To be defined during /paul:plan

### Out of Scope

- Embedded websites — removed for stability
- Minimap — removed for stability
- Search in exports — removed for stability
- Drag & drop in exports — removed for stability
- Base64 image embedding — removed for stability

## Constraints

### Technical Constraints

- Must target CommonJS / ES2020 (Obsidian plugin system requirement)
- Bundler: esbuild only
- No external runtime dependencies — plugin must work inside Obsidian
- TypeScript strict mode enabled

### Business Constraints

- No hard timeline
- Solo developer project

### Compliance Constraints

- None

## Key Decisions

| Decision | Rationale | Date | Status |
|----------|-----------|------|--------|
| CommonJS + ES2020 output | Required by Obsidian plugin system | - | Active |
| esbuild bundler | Fast builds, Obsidian plugin convention | - | Active |
| No base64 embedding | Stability — removed deliberately | - | Active |
| Callout detection inline in blockquote handler | No new helper; co-located logic | 2026-04-13 | Active |
| Callout CSS in both style blocks | Canvas nodes + markdown pages each need separate CSS injection | 2026-04-13 | Active |

## Success Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Visual fidelity | Exported HTML matches canvas layout 1:1 | In progress | Active |
| Embed completeness | All embeds (images, files, notes) present in export | In progress | Active |

## Tech Stack / Tools

| Layer | Technology | Notes |
|-------|------------|-------|
| Language | TypeScript (strict) | ES2020 target |
| Bundler | esbuild | CommonJS output |
| Platform | Obsidian Plugin API | obsidian.d.ts type definitions |
| Output | Standalone HTML + assets | No server required |

## Links

| Resource | URL |
|----------|-----|
| Repository | Local — Projekt_canvas2html/ |
| Vault target | HolgersVault/.obsidian/plugins/canvas-exporter/ |

---
*PROJECT.md — Updated when requirements or context change*
*Last updated: 2026-04-13*
