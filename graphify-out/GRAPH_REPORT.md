# Graph Report - canvas-exporter  (2026-04-12)

## Corpus Check
- Corpus is ~13,470 words - fits in a single context window. You may not need a graph.

## Summary
- 209 nodes · 415 edges · 20 communities detected
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.79)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Export Orchestration|Export Orchestration]]
- [[_COMMUNITY_HTML Conversion & Rendering|HTML Conversion & Rendering]]
- [[_COMMUNITY_Converter Module|Converter Module]]
- [[_COMMUNITY_Color & HTML Utilities|Color & HTML Utilities]]
- [[_COMMUNITY_Plugin Entry Point (compiled)|Plugin Entry Point (compiled)]]
- [[_COMMUNITY_Plugin Source|Plugin Source]]
- [[_COMMUNITY_Obsidian API Types|Obsidian API Types]]
- [[_COMMUNITY_Markdown Section Handling|Markdown Section Handling]]
- [[_COMMUNITY_Link & Path Resolution|Link & Path Resolution]]
- [[_COMMUNITY_File IO & Output|File I/O & Output]]
- [[_COMMUNITY_Wiki Reference Parsing|Wiki Reference Parsing]]
- [[_COMMUNITY_Plugin Architecture|Plugin Architecture]]
- [[_COMMUNITY_Settings Interfaces|Settings Interfaces]]
- [[_COMMUNITY_Canvas Node Interface|Canvas Node Interface]]
- [[_COMMUNITY_Canvas Edge Interface|Canvas Edge Interface]]
- [[_COMMUNITY_Canvas Data Interface|Canvas Data Interface]]
- [[_COMMUNITY_Export Options Interface|Export Options Interface]]
- [[_COMMUNITY_Obsidian Vault|Obsidian Vault]]
- [[_COMMUNITY_Obsidian MetadataCache|Obsidian MetadataCache]]
- [[_COMMUNITY_Obsidian TFile|Obsidian TFile]]

## God Nodes (most connected - your core abstractions)
1. `markdownToHtml()` - 12 edges
2. `rewriteWikiLinks()` - 12 edges
3. `resolveObsidianTarget()` - 12 edges
4. `rewriteWikiLinks()` - 12 edges
5. `resolveObsidianTarget()` - 12 edges
6. `renderMarkdownFileToHtml()` - 11 edges
7. `rewriteMarkdownHtmlAssets()` - 9 edges
8. `CanvasExporterPlugin` - 9 edges
9. `markdownToHtml()` - 9 edges
10. `renderMarkdownFileToHtml()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Intentionally removed features (base64, minimap, drag-drop)` --conceptually_related_to--> `convertCanvasToHtml()`  [INFERRED]
  canvas-exporter/README.md → canvas-exporter/src/converter.ts
- `Export package structure (index.html + assets/)` --references--> `exportCanvasPackage()`  [INFERRED]
  canvas-exporter/README.md → canvas-exporter/src/exporter.ts
- `Planned regression tests` --conceptually_related_to--> `exportCanvasPackage()`  [INFERRED]
  canvas-exporter/README.md → canvas-exporter/src/exporter.ts
- `ExportSettings` --semantically_similar_to--> `PluginSettings`  [INFERRED] [semantically similar]
  canvas-exporter/src/exporter.ts → canvas-exporter/src/main.ts
- `CanvasColorMap` --semantically_similar_to--> `OBSIDIAN_COLORS fallback palette`  [INFERRED] [semantically similar]
  canvas-exporter/src/main.ts → canvas-exporter/src/converter.ts

## Hyperedges (group relationships)
- **Full Export Pipeline: Plugin → Exporter → Converter** — main_exportCurrentCanvas, exporter_exportCanvasPackage, converter_convertCanvasToHtml [EXTRACTED 1.00]
- **Cycle Detection via pageStack and inlineStack in MarkdownContext** — exporter_MarkdownContext, exporter_pageStack, exporter_inlineStack [EXTRACTED 1.00]
- **Canvas Color System: CSS vars → CanvasColorMap → OBSIDIAN_COLORS fallback** — main_readCanvasPaletteColors, main_CanvasColorMap, converter_OBSIDIAN_COLORS [INFERRED 0.85]

## Communities

### Community 0 - "Export Orchestration"
Cohesion: 0.12
Nodes (41): buildMarkdownPreview(), copyVaultFile(), embedSizeAttributes(), ensureFolderExists(), escapeHtmlAttr(), exportCanvasPackage(), exportInternalTarget(), exportMarkdownContentInline() (+33 more)

### Community 1 - "HTML Conversion & Rendering"
Cohesion: 0.09
Nodes (28): OBSIDIAN_COLORS fallback palette, buildCanvasColorVariables(), buildMarkdownDocumentHtml(), convertCanvasToHtml(), getTheme(), markdownToHtml(), renderNode(), MarkdownContext (+20 more)

### Community 2 - "Converter Module"
Cohesion: 0.21
Nodes (20): buildCanvasColorVariables(), buildMarkdownDocumentHtml(), clampColor(), colorToRgba(), convertCanvasToHtml(), escapeAttribute(), escapeHtml(), getBounds() (+12 more)

### Community 3 - "Color & HTML Utilities"
Cohesion: 0.16
Nodes (20): buildCanvasColorVariables(), buildMarkdownDocumentHtml(), clampColor(), colorToRgba(), convertCanvasToHtml(), escapeAttribute(), escapeHtml(), getBounds() (+12 more)

### Community 4 - "Plugin Entry Point (compiled)"
Cohesion: 0.16
Nodes (13): ensureFolderExists(), exportCanvasPackage(), exportCurrentCanvas(), getActiveCanvasFile(), loadSettings(), normalizeCanvasData(), normalizeCanvasNode(), normalizeFolder() (+5 more)

### Community 5 - "Plugin Source"
Cohesion: 0.22
Nodes (2): CanvasExporterPlugin, CanvasExporterSettingTab

### Community 6 - "Obsidian API Types"
Cohesion: 0.17
Nodes (11): App, MetadataCache, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile (+3 more)

### Community 7 - "Markdown Section Handling"
Cohesion: 0.24
Nodes (11): buildMarkdownPreview(), embedSizeAttributes(), escapeHtmlAttr(), exportInternalTarget(), exportMarkdownSectionInline(), extractMarkdownHeadingSection(), normalizeHeadingRef(), parsedTargetSection() (+3 more)

### Community 8 - "Link & Path Resolution"
Cohesion: 0.29
Nodes (10): exportMarkdownNote(), getHrefForMarkdownPage(), isExternalLink(), isImageExt(), normalizeExportHref(), pathRelative(), prepareNode(), resolveObsidianTarget() (+2 more)

### Community 9 - "File I/O & Output"
Cohesion: 0.29
Nodes (8): copyVaultFile(), exportMarkdownContentInline(), renderMarkdownFileToHtml(), safeSegment(), toExportRelativePath(), uniqueOutputName(), writeBinaryFile(), writeTextFile()

### Community 10 - "Wiki Reference Parsing"
Cohesion: 0.33
Nodes (6): normalizeWikiTarget(), parseEmbedSize(), parseWikiReference(), resolveLinkedFileForEmbed(), resolveLinkedVaultFile(), splitTargetSuffix()

### Community 11 - "Plugin Architecture"
Cohesion: 0.67
Nodes (3): CanvasExporterPlugin, CanvasExporterSettingTab, Obsidian Plugin base class

### Community 12 - "Settings Interfaces"
Cohesion: 1.0
Nodes (2): ExportSettings, PluginSettings

### Community 13 - "Canvas Node Interface"
Cohesion: 1.0
Nodes (1): CanvasNode interface

### Community 14 - "Canvas Edge Interface"
Cohesion: 1.0
Nodes (1): CanvasEdge interface

### Community 15 - "Canvas Data Interface"
Cohesion: 1.0
Nodes (1): CanvasData interface

### Community 16 - "Export Options Interface"
Cohesion: 1.0
Nodes (1): ExportOptions interface

### Community 17 - "Obsidian Vault"
Cohesion: 1.0
Nodes (1): Obsidian Vault class

### Community 18 - "Obsidian MetadataCache"
Cohesion: 1.0
Nodes (1): Obsidian MetadataCache class

### Community 19 - "Obsidian TFile"
Cohesion: 1.0
Nodes (1): Obsidian TFile class

## Knowledge Gaps
- **26 isolated node(s):** `TAbstractFile`, `TFolder`, `TFile`, `Vault`, `Workspace` (+21 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Settings Interfaces`** (2 nodes): `ExportSettings`, `PluginSettings`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Canvas Node Interface`** (1 nodes): `CanvasNode interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Canvas Edge Interface`** (1 nodes): `CanvasEdge interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Canvas Data Interface`** (1 nodes): `CanvasData interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Export Options Interface`** (1 nodes): `ExportOptions interface`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Obsidian Vault`** (1 nodes): `Obsidian Vault class`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Obsidian MetadataCache`** (1 nodes): `Obsidian MetadataCache class`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Obsidian TFile`** (1 nodes): `Obsidian TFile class`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `TAbstractFile`, `TFolder`, `TFile` to the rest of the system?**
  _26 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Export Orchestration` be split into smaller, more focused modules?**
  _Cohesion score 0.12 - nodes in this community are weakly interconnected._
- **Should `HTML Conversion & Rendering` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._