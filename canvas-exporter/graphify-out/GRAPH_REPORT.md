# Graph Report - canvas-exporter  (2026-04-12)

## Corpus Check
- 5 files · ~14,044 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 165 nodes · 366 edges · 10 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]

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
- `renderMarkdownFileToHtml()` --calls--> `buildMarkdownDocumentHtml()`  [EXTRACTED]
  canvas-exporter/release/main.js → canvas-exporter/release/main.js  _Bridges community 0 → community 1_
- `renderMarkdownFileToHtml()` --calls--> `stripFrontmatter()`  [EXTRACTED]
  canvas-exporter/src/exporter.ts → canvas-exporter/src/exporter.ts  _Bridges community 7 → community 6_
- `prepareNode()` --calls--> `normalizeExportHref()`  [EXTRACTED]
  canvas-exporter/src/exporter.ts → canvas-exporter/src/exporter.ts  _Bridges community 8 → community 9_
- `renderMarkdownFileToHtml()` --calls--> `normalizeExportHref()`  [EXTRACTED]
  canvas-exporter/src/exporter.ts → canvas-exporter/src/exporter.ts  _Bridges community 8 → community 6_
- `exportCanvasPackage()` --calls--> `safeSegment()`  [EXTRACTED]
  canvas-exporter/src/exporter.ts → canvas-exporter/src/exporter.ts  _Bridges community 9 → community 6_

## Communities

### Community 0 - "Community 0"
Cohesion: 0.1
Nodes (35): buildCanvasColorVariables(), buildMarkdownDocumentHtml(), clampColor(), colorToRgba(), convertCanvasToHtml(), ensureFolderExists(), escapeAttribute(), escapeHtml() (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.11
Nodes (33): buildMarkdownPreview(), copyVaultFile(), embedSizeAttributes(), escapeHtmlAttr(), exportInternalTarget(), exportMarkdownContentInline(), exportMarkdownNote(), exportMarkdownSectionInline() (+25 more)

### Community 2 - "Community 2"
Cohesion: 0.21
Nodes (20): buildCanvasColorVariables(), buildMarkdownDocumentHtml(), clampColor(), colorToRgba(), convertCanvasToHtml(), escapeAttribute(), escapeHtml(), getBounds() (+12 more)

### Community 3 - "Community 3"
Cohesion: 0.22
Nodes (2): CanvasExporterPlugin, CanvasExporterSettingTab

### Community 4 - "Community 4"
Cohesion: 0.17
Nodes (11): App, MetadataCache, Notice, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile (+3 more)

### Community 5 - "Community 5"
Cohesion: 0.27
Nodes (10): extractMarkdownHeadingSection(), normalizeCanvasNode(), normalizeHeadingRef(), normalizeWikiTarget(), parseEmbedSize(), parseWikiReference(), resolveLinkedFileForEmbed(), resolveLinkedVaultFile() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.25
Nodes (9): copyVaultFile(), exportMarkdownContentInline(), exportMarkdownNote(), renderMarkdownFileToHtml(), safeSegment(), toExportRelativePath(), uniqueOutputName(), writeBinaryFile() (+1 more)

### Community 7 - "Community 7"
Cohesion: 0.36
Nodes (8): buildMarkdownPreview(), embedSizeAttributes(), escapeHtmlAttr(), exportMarkdownSectionInline(), parsedTargetSection(), rewriteMarkdownHtmlAssets(), rewriteWikiLinks(), stripFrontmatter()

### Community 8 - "Community 8"
Cohesion: 0.38
Nodes (7): exportInternalTarget(), getHrefForMarkdownPage(), isExternalLink(), normalizeExportHref(), pathRelative(), resolveObsidianTarget(), shouldRewriteInternalTarget()

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (7): ensureFolderExists(), exportCanvasPackage(), isImageExt(), normalizeCanvasData(), normalizeFolder(), prepareNode(), resolveVaultFile()

## Knowledge Gaps
- **11 isolated node(s):** `TAbstractFile`, `TFolder`, `TFile`, `Vault`, `Workspace` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `resolveObsidianTarget()` connect `Community 1` to `Community 0`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **Why does `resolveObsidianTarget()` connect `Community 8` to `Community 9`, `Community 5`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.002) - this node is a cross-community bridge._
- **What connects `TAbstractFile`, `TFolder`, `TFile` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._