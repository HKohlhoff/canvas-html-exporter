import type { getTheme } from "./theme";
import { indentCssBlock, scopeCalloutCss } from "./theme";

type CanvasStyleParameters = {
  canvasColorVars: string;
  theme: ReturnType<typeof getTheme>;
  bounds: { width: number; height: number; offsetX: number; offsetY: number; };
  headingCss: string;
  contentInlineStyleCss: string;
  calloutCss: string;
  singlePageHeadingCss: string;
  singlePageInlineStyleCss: string;
  previewInlineStyleCss: string;
  previewHeadingCss: string;
};

export function buildCanvasStyles({ canvasColorVars, theme, bounds, headingCss, contentInlineStyleCss, calloutCss, singlePageHeadingCss, singlePageInlineStyleCss, previewInlineStyleCss, previewHeadingCss }: CanvasStyleParameters): string {
  return `
    :root { ${canvasColorVars} }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${theme.bodyBackground};
      color: ${theme.text};
      overflow: auto;
    }
    #canvas-shell {
      display: flex;
      flex-direction: column;
      height: 100vh;
      height: 100dvh;
      min-height: 0;
    }
    #canvas-shell[hidden] {
      display: none;
    }
    .page-header {
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 20px 24px 8px;
      flex: 0 0 auto;
    }
    .page-header h1 {
      margin: 0 0 8px;
      font-size: 1.4rem;
    }
    .page-header p {
      margin: 0;
      color: ${theme.mutedText};
      font-size: 0.95rem;
    }
    .page-header-meta {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
    }
    .page-header-meta p {
      flex: 1 1 auto;
      min-width: 0;
    }
    .viewport {
      overflow: auto;
      padding: 16px 24px 28px;
      flex: 1 1 auto;
      min-height: 0;
    }
    .viewport.is-zoom-area-selecting {
      cursor: crosshair;
      user-select: none;
    }
    .zoom-area-selection {
      position: fixed;
      z-index: 1000;
      box-sizing: border-box;
      border: 2px solid ${theme.link};
      border-radius: 4px;
      background: rgba(25, 103, 210, 0.14);
      box-shadow: 0 0 0 1px ${theme.nodeBackground};
      pointer-events: none;
    }
    .zoom-area-selection[hidden] {
      display: none;
    }
    .zoom-area-hint {
      position: fixed;
      z-index: 1001;
      transform: translateX(-50%);
      padding: 6px 10px;
      border: 1px solid ${theme.nodeBorder};
      border-radius: 6px;
      background: ${theme.nodeBackground};
      color: ${theme.text};
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
      font-size: 0.85rem;
      pointer-events: none;
    }
    .zoom-area-hint[hidden] {
      display: none;
    }
    #canvas {
      position: relative;
      width: ${bounds.width}px;
      height: ${bounds.height}px;
      margin: 0 auto;
      transform-origin: top left;
    }
    #edge-layer {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
      z-index: 0;
    }
    .node {
      position: absolute;
      border-radius: 12px;
      padding: 12px 14px;
      color: ${theme.text};
      background: ${theme.nodeBackground};
      border: 2px solid ${theme.nodeBorder};
      box-shadow: 0 3px 14px rgba(0,0,0,0.12);
      z-index: 2;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .node[data-node-border="dashed"] {
      border-style: dashed;
      box-shadow: none;
    }
    .node[data-node-border="dotted"] {
      border-style: dotted;
      box-shadow: none;
    }
    .node[data-node-border="invisible"] {
      border-color: transparent;
      background: transparent;
      box-shadow: none;
    }
    .node[data-node-text-align="center"] {
      text-align: center;
    }
    .node[data-node-text-align="right"] {
      text-align: right;
    }
    .node[data-node-shape="pill"] {
      border-radius: 999px;
      padding-inline: 28px;
    }
    .node[data-node-shape="circle"] {
      border-radius: 50%;
      padding: 18px 24px;
      justify-content: center;
    }
    .node[data-node-shape="parallelogram"] {
      transform: skewX(-16deg);
      border-radius: 6px;
      padding-inline: 28px;
    }
    .node[data-node-shape="parallelogram"] > * {
      transform: skewX(16deg);
    }
    .node[data-node-shape="diamond"],
    .node[data-node-shape="document"] {
      border-color: transparent;
      background: transparent;
      box-shadow: none;
      overflow: visible;
    }
    .node[data-node-shape="diamond"] {
      padding: 20px 38px;
      justify-content: center;
    }
    .node[data-node-shape="diamond"]::before,
    .node[data-node-shape="diamond"]::after,
    .node[data-node-shape="document"]::before,
    .node[data-node-shape="document"]::after {
      content: "";
      position: absolute;
      pointer-events: none;
    }
    .node[data-node-shape="diamond"]::before,
    .node[data-node-shape="diamond"]::after {
      clip-path: polygon(50% 0, 100% 50%, 50% 100%, 0 50%);
    }
    .node[data-node-shape="diamond"]::before,
    .node[data-node-shape="document"]::before {
      inset: 0;
      z-index: 0;
      background: var(--node-border-color);
    }
    .node[data-node-shape="diamond"]::after,
    .node[data-node-shape="document"]::after {
      inset: 3px;
      z-index: 0;
      background: var(--node-background-color);
    }
    .node[data-node-shape] > .node-title,
    .node[data-node-shape] > .node-content {
      position: relative;
      z-index: 2;
    }
    .node[data-node-shape="predefined-process"] {
      padding-inline: 28px;
    }
    .node[data-node-shape="predefined-process"]::before,
    .node[data-node-shape="predefined-process"]::after {
      content: "";
      position: absolute;
      top: 0;
      bottom: 0;
      border-left: 2px solid var(--node-border-color);
      pointer-events: none;
    }
    .node[data-node-shape="predefined-process"]::before {
      left: 12px;
    }
    .node[data-node-shape="predefined-process"]::after {
      right: 12px;
    }
    .node[data-node-shape="document"] {
      padding-bottom: 6px;
    }
    .node[data-node-shape="document"]::before,
    .node[data-node-shape="document"]::after {
      clip-path: polygon(0 0, 100% 0, 100% 82%, 76% 94%, 50% 84%, 24% 94%, 0 82%);
    }
    .node[data-node-shape]:not([data-node-shape="database"]) {
      padding-block: 6px;
      justify-content: center;
    }
    .node[data-node-shape]:not([data-node-shape="database"]) > .node-content {
      flex: 0 1 auto;
      line-height: 1.25;
    }
    .node[data-node-shape]:not([data-node-shape="database"]) > .node-content > :first-child {
      margin-top: 0;
    }
    .node[data-node-shape]:not([data-node-shape="database"]) > .node-content > :last-child {
      margin-bottom: 0;
    }
    .node[data-node-shape="database"] {
      overflow: visible;
      border-top: 0;
      border-bottom: 0;
      border-radius: 0;
      box-shadow: none;
    }
    .node[data-node-shape="database"] .node-content {
      overflow: visible;
      transform: translateY(20px);
    }
    .node[data-node-shape="database"]::before,
    .node[data-node-shape="database"]::after {
      content: "";
      position: absolute;
      left: -2px;
      right: -2px;
      height: 50px;
      border: 2px solid var(--node-border-color);
      border-radius: 50%;
      background: var(--node-background-color);
      z-index: 0;
      pointer-events: none;
    }
    .node[data-node-shape="database"]::before {
      top: -25px;
    }
    .node[data-node-shape="database"]::after {
      bottom: -25px;
    }
    .node[data-node-border="invisible"]::before,
    .node[data-node-border="invisible"]::after {
      display: none;
    }
    .node.is-folding-hidden {
      display: none;
    }
    .node.is-focus-muted {
      opacity: 0.2;
    }
    .node-controls {
      position: absolute;
      top: 6px;
      right: 6px;
      z-index: 5;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .branch-control,
    .branch-focus-control {
      position: static;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 24px;
      height: 24px;
      padding: 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 999px;
      background: ${theme.nodeBackground};
      color: ${theme.text};
      font: inherit;
      font-size: 17px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      box-shadow: 0 1px 5px rgba(0,0,0,0.16);
    }
    .branch-focus-control {
      width: 24px;
      font-size: 14px;
    }
    .branch-control.has-hidden-count {
      width: auto;
      padding: 0 6px;
      font-size: 14px;
    }
    .branch-control:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
    .branch-control:disabled:hover {
      border-color: ${theme.canvasBorder};
      background: ${theme.nodeBackground};
    }
    .branch-focus-icon {
      display: block;
      width: 16px;
      height: 16px;
    }
    .branch-control:hover,
    .branch-control:focus-visible,
    .branch-focus-control:hover,
    .branch-focus-control:focus-visible,
    .branch-focus-control.is-active {
      border-color: ${theme.link};
      background: ${theme.bodyBackground};
      outline: none;
    }
    .branch-control[hidden],
    .branch-focus-control[hidden] {
      display: none;
    }
    .node.group {
      background: ${theme.groupBackground};
      z-index: 1;
      overflow: visible;
    }
    .node.group.is-advanced-group-collapsed {
      background: transparent !important;
      border-color: transparent !important;
      box-shadow: none;
      min-height: 1px;
      min-width: 1px;
      padding: 0;
      pointer-events: none;
    }
    .node.group.is-advanced-group-collapsed > .node-controls {
      display: none;
    }
    .node.group .node-content {
      display: none;
    }
    .group-title {
      position: absolute;
      z-index: 4;
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--node-border-color);
      font-weight: 600;
      line-height: 1.2;
      white-space: nowrap;
      pointer-events: none;
      transform: translateY(-1.55em);
    }
    .group-title.is-folding-hidden {
      display: none;
    }
    .group-title.is-focus-muted {
      opacity: 0.2;
    }
    .group-title-text {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .advanced-group-control {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border: 1px solid var(--node-border-color);
      border-radius: 999px;
      background: ${theme.nodeBackground};
      color: ${theme.text};
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      line-height: 1;
      cursor: pointer;
      pointer-events: auto;
      box-shadow: 0 1px 4px rgba(0,0,0,0.14);
    }
    .advanced-group-control:hover,
    .advanced-group-control:focus-visible {
      border-color: ${theme.link};
      background: ${theme.bodyBackground};
      outline: none;
    }
    .advanced-group-control.has-hidden-count {
      min-width: 24px;
    }
    .node.audio,
    .node.video,
    .node.pdf,
    .node.link {
      padding: 0;
    }
    .node.audio .node-content,
    .node.video .node-content {
      display: flex;
      overflow: hidden;
    }
    .node.pdf .node-title,
    .node.link .node-title {
      padding: 6px 14px;
    }
    .node.pdf .node-content,
    .node.link .node-content {
      overflow: hidden;
    }
    .node.link .node-content {
      display: flex;
      flex-direction: column;
      padding: 10px 12px 12px;
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
    .media-embed {
      display: flex;
      flex-direction: column;
      gap: 6px;
      height: 100%;
      min-height: 0;
      width: 100%;
      padding: 6px 10px;
    }
    .media-title-link {
      display: block;
      flex: 0 0 auto;
      min-width: 0;
      color: inherit;
      font-size: 0.9em;
      font-weight: 600;
      line-height: 1.2;
      overflow: hidden;
      text-decoration: none;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .media-title-link:hover {
      text-decoration: underline;
    }
    .media-embed audio,
    .media-embed video {
      display: block;
      width: 100%;
      max-width: 100%;
    }
    .media-embed audio {
      align-self: center;
      flex: 0 0 auto;
    }
    .media-embed video {
      flex: 1 1 auto;
      min-height: 0;
      object-fit: contain;
      background: #000;
      border-radius: 8px;
    }
    .pdf-title-link {
      display: block;
      text-decoration: none;
      color: inherit;
    }
    .pdf-title {
      padding: 6px 14px;
      font-size: 0.85em;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom: 1px solid rgba(128,128,128,0.2);
    }
    .pdf-title:hover {
      text-decoration: underline;
    }
    .node-title {
      font-weight: 700;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 1px solid ${theme.rule};
    }
    .node-content {
      line-height: 1.55;
      word-break: break-word;
      flex: 1 1 auto;
      min-height: 0;
      overflow: auto;
      -ms-overflow-style: none;
      scrollbar-width: none;
      overscroll-behavior: contain;
    }
    .node-content::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
    .node-content h1, .node-content h2, .node-content h3, .node-content h4, .node-content h5, .node-content h6 {
      margin: 0.5em 0 0.35em;
      line-height: 1.25;
    }
    .node-content details.heading-section {
      margin: 0.5em 0;
    }
    .node-content details.heading-section > summary.heading-summary {
      position: relative;
      cursor: pointer;
      user-select: none;
      list-style: none;
    }
    .node-content details.heading-section > summary.heading-summary::-webkit-details-marker { display: none; }
    .node-content details.heading-section > summary.heading-summary h1,
    .node-content details.heading-section > summary.heading-summary h2,
    .node-content details.heading-section > summary.heading-summary h3,
    .node-content details.heading-section > summary.heading-summary h4,
    .node-content details.heading-section > summary.heading-summary h5,
    .node-content details.heading-section > summary.heading-summary h6 {
      display: inline-block;
      margin: 0 0.35em 0 0;
      vertical-align: middle;
    }
    .node-content details.heading-section > summary.heading-summary::before { content: "⌄"; position: absolute; left: -1em; top: 50%; transform: translateY(-50%); line-height: 1; color: ${theme.mutedText}; font-weight: 600; opacity: 0; transition: opacity 0.12s ease; }
    .node-content details.heading-section:not([open]) > summary.heading-summary::before { content: "›"; }
    .node-content details.heading-section > summary.heading-summary:hover::before,
    .node-content details.heading-section > summary.heading-summary:focus-visible::before { opacity: 1; }
    ${indentCssBlock(headingCss, 4)}
    ${indentCssBlock(contentInlineStyleCss, 4)}
    .node-content p { margin: 0.45em 0; }
    .node-content ul, .node-content ol { margin: 0.45em 0; padding-left: 2em; }
    .node-content li { margin: 0.2em 0; }
    .node-content a { color: ${theme.link}; text-decoration: none; }
    .node-content a:hover { text-decoration: underline; }
    .node-content code {
      background: ${theme.inlineCodeBackground};
      border-radius: 4px;
      padding: 0.1em 0.35em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
    }
    .node-content pre,
    .node-content .shiki {
      margin: 0.7em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    .node-content pre code,
    .node-content .shiki code {
      padding: 0;
      background: transparent;
    }
    .node-content blockquote {
      margin: 0.7em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
    .node-content .callout { border-radius: 6px; margin: 0.7em 0; overflow: hidden; border: 1px solid #888; }
    .node-content .callout-title { padding: 5px 10px; font-weight: 600; font-size: 0.88em; letter-spacing: 0.01em; }
    .node-content .callout-content { padding: 4px 10px 6px; }
    .node-content .callout-icon { margin-right: 5px; font-style: normal; display: inline-flex; align-items: center; vertical-align: -0.12em; }
    .node-content .callout-icon svg { width: 1em; height: 1em; fill: currentColor; display: block; }
    ${indentCssBlock(scopeCalloutCss(calloutCss, ".node-content "), 4)}
    .node-content details.callout { display: block; }
    .node-content details.callout > summary.callout-title { cursor: pointer; list-style: none; user-select: none; }
    .node-content details.callout > summary.callout-title::-webkit-details-marker { display: none; }
    .node-content details.callout > summary.callout-title::after { content: " ›"; font-size: 0.85em; }
    .node-content details.callout[open] > summary.callout-title::after { content: " ⌄"; }
    .node-content hr {
      border: none;
      border-top: 1px solid ${theme.rule};
      margin: 0.8em 0;
    }
    .node-content img {
      display: block;
      max-width: 100%;
      border-radius: 8px;
      margin: 0.6em 0;
    }
    .node-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 0.7em 0;
    }
    .node-content th,
    .node-content td {
      border: 1px solid ${theme.canvasBorder};
      padding: 6px 8px;
      text-align: left;
    }
    .file-chip, .link-chip {
      display: inline-block;
      padding: 6px 10px;
      border-radius: 999px;
      background: ${theme.chipBackground};
      border: 1px solid ${theme.canvasBorder};
      color: ${theme.text};
      text-decoration: none;
      margin-top: 6px;
    }
    .link-preview {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 0;
      flex: 1 1 auto;
      height: 100%;
    }
    .link-preview-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      flex-wrap: wrap;
    }
    .link-preview-title {
      font-weight: 700;
      color: inherit;
      text-decoration: none;
      word-break: break-all;
      flex: 1 1 220px;
    }
    .link-preview-title:hover {
      text-decoration: underline;
    }
    .link-offline-note {
      color: ${theme.mutedText};
      font-size: 0.86em;
      line-height: 1.4;
    }
    .link-offline-note[hidden] {
      display: none;
    }
    .link-blocked-action {
      margin-top: 0.35em;
    }
    .link-preview-frame {
      flex: 1 1 auto;
      min-height: 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.canvasBackground};
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .link-preview-frame::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
    .link-preview-frame iframe {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100%;
      border: none;
      background: ${theme.canvasBackground};
    }
    .toolbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      flex: 0 0 auto;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: flex-end;
      padding: 10px 24px 0;
      background: linear-gradient(to bottom, ${theme.bodyBackground}, transparent);
    }
    .toolbar button,
    .toolbar select,
    .toolbar-menu > summary {
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
      font: inherit;
      font-size: 0.875rem;
    }
    .toolbar button:hover,
    .toolbar select:hover,
    .toolbar-menu > summary:hover { background: ${theme.chipBackground}; }
    .toolbar-menu {
      position: relative;
    }
    .toolbar-menu > summary {
      list-style: none;
      user-select: none;
    }
    .toolbar-menu > summary::-webkit-details-marker {
      display: none;
    }
    .toolbar-menu > summary::after {
      content: "▾";
      margin-left: 7px;
    }
    .toolbar-menu[open] > summary::after {
      content: "▴";
    }
    .toolbar-menu-content {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 6px;
      min-width: 180px;
      padding: 8px;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      background: ${theme.nodeBackground};
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    }
    .toolbar-menu-content button,
    .toolbar-menu-content select {
      width: 100%;
      text-align: left;
      white-space: nowrap;
    }
    .folding-action-control[hidden] {
      display: none;
    }
    .folding-menu-separator {
      width: 100%;
      margin: 2px 0;
      border: 0;
      border-top: 1px solid ${theme.canvasBorder};
    }
    .toolbar button.is-active {
      border-color: ${theme.link};
      background: ${theme.chipBackground};
      box-shadow: 0 0 0 3px rgba(25, 103, 210, 0.14);
    }
    .toolbar button:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .single-page-view {
      max-width: 960px;
      margin: 32px auto;
      background: ${theme.canvasBackground};
      border: 1px solid ${theme.canvasBorder};
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      overflow: hidden;
    }
    .single-page-view[hidden] {
      display: none;
    }
    .single-page-toolbar {
      position: sticky;
      top: 0;
      z-index: 12;
      display: flex;
      justify-content: flex-end;
      margin: 0;
      padding: 32px 32px 0;
      background: transparent;
    }
    .single-page-toolbar[hidden] {
      display: none;
    }
    .canvas-return-link,
    .single-page-canvas-link {
      color: ${theme.link};
      text-decoration: none;
      font-size: 0.95em;
      font-weight: 600;
      white-space: nowrap;
    }
    .canvas-return-link:hover,
    .single-page-canvas-link:hover {
      text-decoration: underline;
    }
    .single-page-body {
      padding: 0 32px 32px;
      background: transparent;
    }
    .single-page-body .single-canvas-page {
      height: calc(100vh - 112px);
      min-height: 560px;
      margin: 0 -32px -32px;
    }
    .single-page-body .single-canvas-frame {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
      background: ${theme.canvasBackground};
    }
    .canvas-card-link {
      display: flex;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 8px;
      padding: 10px;
      color: ${theme.text};
      text-align: center;
      text-decoration: none;
    }
    .canvas-card-link:hover {
      color: ${theme.link};
      text-decoration: none;
    }
    .canvas-card-title {
      flex: 0 0 auto;
      font-weight: 650;
      overflow-wrap: anywhere;
    }
    .canvas-card-preview {
      display: block;
      width: 100%;
      min-height: 0;
      flex: 1 1 auto;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 8px;
      background: ${theme.canvasBackground};
    }
    .canvas-card-preview-edges line {
      vector-effect: non-scaling-stroke;
      stroke-width: 1.25;
      opacity: 0.75;
    }
    .canvas-card-preview-nodes .minimap-node {
      vector-effect: non-scaling-stroke;
      stroke-width: 1.25;
    }
    .single-page-body .md-page {
      max-width: none;
      margin: 0;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
    }
    .single-page-body h1,
    .single-page-body h2,
    .single-page-body h3,
    .single-page-body h4,
    .single-page-body h5,
    .single-page-body h6 {
      line-height: 1.25;
      margin-top: 1.1em;
    }
    .single-page-body h1 { margin-top: 0; }
    .single-page-body details.heading-section { margin: 0.8em 0; }
    .single-page-body details.heading-section > summary.heading-summary {
      position: relative;
      cursor: pointer;
      user-select: none;
      list-style: none;
    }
    .single-page-body details.heading-section > summary.heading-summary::-webkit-details-marker { display: none; }
    .single-page-body details.heading-section > summary.heading-summary h1,
    .single-page-body details.heading-section > summary.heading-summary h2,
    .single-page-body details.heading-section > summary.heading-summary h3,
    .single-page-body details.heading-section > summary.heading-summary h4,
    .single-page-body details.heading-section > summary.heading-summary h5,
    .single-page-body details.heading-section > summary.heading-summary h6 {
      display: inline-block;
      margin: 0 0.35em 0 0;
      vertical-align: middle;
    }
    .single-page-body details.heading-section > summary.heading-summary::before { content: "⌄"; position: absolute; left: -1em; top: 50%; transform: translateY(-50%); line-height: 1; color: ${theme.mutedText}; font-weight: 600; opacity: 0; transition: opacity 0.12s ease; }
    .single-page-body details.heading-section:not([open]) > summary.heading-summary::before { content: "›"; }
    .single-page-body details.heading-section > summary.heading-summary:hover::before,
    .single-page-body details.heading-section > summary.heading-summary:focus-visible::before { opacity: 1; }
    ${indentCssBlock(singlePageHeadingCss, 4)}
    ${indentCssBlock(singlePageInlineStyleCss, 4)}
    .single-page-body a { color: ${theme.link}; text-decoration: none; }
    .single-page-body a:hover { text-decoration: underline; }
    .single-page-body ul, .single-page-body ol { margin: 0.65em 0; padding-left: 2em; }
    .single-page-body code {
      background: ${theme.inlineCodeBackground};
      border-radius: 4px;
      padding: 0.1em 0.35em;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 0.92em;
    }
    .single-page-body pre,
    .single-page-body .shiki {
      margin: 0.9em 0;
      padding: 10px 12px;
      border-radius: 8px;
      background: ${theme.codeBlockBackground};
      overflow-x: auto;
    }
    .single-page-body pre code,
    .single-page-body .shiki code { padding: 0; background: transparent; }
    .single-page-body blockquote {
      margin: 0.9em 0;
      padding-left: 12px;
      border-left: 3px solid ${theme.link};
      color: ${theme.mutedText};
    }
    .single-page-body .callout { border-radius: 6px; margin: 0.9em 0; overflow: hidden; border: 1px solid #888; }
    .single-page-body .callout-title { padding: 5px 10px; font-weight: 600; font-size: 0.88em; letter-spacing: 0.01em; }
    .single-page-body .callout-content { padding: 4px 10px 6px; }
    .single-page-body .callout-icon { margin-right: 5px; font-style: normal; display: inline-flex; align-items: center; vertical-align: -0.12em; }
    .single-page-body .callout-icon svg { width: 1em; height: 1em; fill: currentColor; display: block; }
    ${indentCssBlock(scopeCalloutCss(calloutCss, ".single-page-body "), 4)}
    .single-page-body details.callout { display: block; }
    .single-page-body details.callout > summary.callout-title { cursor: pointer; list-style: none; user-select: none; }
    .single-page-body details.callout > summary.callout-title::-webkit-details-marker { display: none; }
    .single-page-body details.callout > summary.callout-title::after { content: " ›"; font-size: 0.85em; }
    .single-page-body details.callout[open] > summary.callout-title::after { content: " ⌄"; }
    .single-page-body hr { border: none; border-top: 1px solid ${theme.rule}; margin: 1em 0; }
    .single-page-body img { display: block; max-width: 100%; border-radius: 8px; margin: 0.8em 0; }
    .single-page-body table { border-collapse: collapse; width: auto; max-width: 100%; margin: 0.8em 0; }
    .single-page-body th, .single-page-body td { border: 1px solid ${theme.canvasBorder}; padding: 8px 10px; text-align: left; }
    .single-page-body .md-embed-block { margin: 0.8em 0; }
    .single-page-body .pdf-embed-block {
      margin: 0.8em 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.nodeBackground};
    }
    .single-page-body .pdf-embed-block iframe {
      display: block;
      width: 100%;
      min-height: 420px;
      border: none;
      background: ${theme.canvasBackground};
    }
    .single-page-body .file-embed-block,
    .single-page-body .media-embed-block { margin: 0.8em 0; }
    .single-page-body .media-embed-block audio,
    .single-page-body .media-embed-block video { display: block; width: 100%; max-width: 100%; }
    .single-page-body .file-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      padding: 0.4em 0.7em;
      border-radius: 999px;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      font-weight: 600;
      text-decoration: none;
    }
    .single-page-body .file-chip:hover { text-decoration: underline; }
    .single-page-body mark.search-highlight {
      background: rgba(255, 214, 10, 0.45);
      color: inherit;
      padding: 0 0.08em;
      border-radius: 3px;
    }
    .single-page-body .target-highlight {
      background: rgba(255, 214, 10, 0.45);
      border-radius: 3px;
      box-shadow: 0 0 0 3px rgba(255, 214, 10, 0.2);
    }
    .single-page-body details.target-highlight {
      padding: 0.08em 0.2em;
    }
    .single-page-body .unresolved-link {
      color: #d64545;
      font-style: italic;
    }
    .single-link-page {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .single-link-page .link-page-note {
      color: ${theme.mutedText};
      line-height: 1.5;
    }
    .single-link-page .link-page-title {
      color: ${theme.link};
      text-decoration: none;
      font-weight: 700;
      word-break: break-all;
    }
    .single-link-page .link-page-title:hover { text-decoration: underline; }
    .single-link-page iframe {
      width: 100%;
      min-height: 72vh;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 12px;
      background: ${theme.canvasBackground};
    }
    .node.search-hit {
      z-index: 7;
      outline: 4px solid #ffd43b;
      outline-offset: 5px;
      box-shadow:
        0 0 0 10px rgba(255, 212, 59, 0.32),
        0 0 32px 12px rgba(255, 193, 7, 0.58),
        0 10px 30px rgba(0, 0, 0, 0.24);
      animation: search-hit-pulse 550ms ease-in-out 4 alternate;
    }
    @keyframes search-hit-pulse {
      from {
        outline-color: #ffd43b;
        box-shadow:
          0 0 0 7px rgba(255, 212, 59, 0.26),
          0 0 22px 8px rgba(255, 193, 7, 0.46),
          0 8px 24px rgba(0, 0, 0, 0.2);
      }
      to {
        outline-color: #fff3bf;
        box-shadow:
          0 0 0 12px rgba(255, 212, 59, 0.4),
          0 0 38px 16px rgba(255, 193, 7, 0.72),
          0 12px 34px rgba(0, 0, 0, 0.28);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .node.search-hit {
        animation: none;
      }
    }
    .search-overlay {
      position: fixed;
      inset: 0;
      z-index: 30;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding: 84px 16px 24px;
      background: rgba(0, 0, 0, 0.28);
      backdrop-filter: blur(4px);
    }
    .search-overlay[hidden] {
      display: none;
    }
    .search-panel {
      width: min(720px, 100%);
      max-height: min(75vh, 820px);
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 16px;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.canvasBackground};
      box-shadow: 0 18px 40px rgba(0,0,0,0.18);
    }
    .search-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .search-panel-header strong {
      font-size: 1rem;
    }
    .search-close-button {
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      border-radius: 8px;
      padding: 6px 10px;
      cursor: pointer;
    }
    .search-close-button:hover {
      background: ${theme.chipBackground};
    }
    .search-input {
      width: 100%;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      border-radius: 10px;
      padding: 10px 12px;
      font: inherit;
    }
    .search-summary {
      color: ${theme.mutedText};
      font-size: 0.92rem;
    }
    .search-results {
      list-style: none;
      margin: 0;
      padding: 0;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .search-result-item {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .search-result {
      width: 100%;
      text-align: left;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.nodeBackground};
      color: ${theme.text};
      border-radius: 12px;
      padding: 10px 12px;
      cursor: pointer;
    }
    .search-result:hover {
      background: ${theme.chipBackground};
    }
    .search-result.is-active {
      border-color: ${theme.link};
      box-shadow: 0 0 0 3px rgba(25, 103, 210, 0.16);
      background: ${theme.chipBackground};
    }
    .search-result-title {
      display: inline-block;
      font-weight: 700;
      color: ${theme.text};
      text-decoration: none;
    }
    .search-result-title-link:hover {
      text-decoration: underline;
    }
    .search-result-meta,
    .search-result-snippet {
      display: block;
      color: ${theme.mutedText};
      font-size: 0.88rem;
      line-height: 1.4;
    }
    .search-result mark {
      background: rgba(255, 214, 10, 0.45);
      color: inherit;
      padding: 0 0.05em;
      border-radius: 3px;
    }
    .minimap {
      position: fixed;
      right: 24px;
      top: 64px;
      bottom: auto;
      z-index: 20;
      width: min(240px, calc(100vw - 32px));
      padding: 10px;
      border-radius: 14px;
      border: 1px solid ${theme.canvasBorder};
      background: ${theme.canvasBackground};
      box-shadow: 0 12px 30px rgba(0,0,0,0.16);
      backdrop-filter: blur(10px);
    }
    .minimap[hidden] {
      display: none;
    }
    .minimap-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 8px;
      color: ${theme.mutedText};
      font-size: 0.82rem;
      cursor: grab;
      user-select: none;
      touch-action: none;
    }
    .minimap.is-dragging .minimap-header {
      cursor: grabbing;
    }
    .minimap-header-copy {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .minimap-header strong {
      color: ${theme.text};
      font-size: 0.88rem;
    }
    #minimap-svg {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: ${bounds.width} / ${bounds.height};
      border-radius: 10px;
      border: 1px solid ${theme.canvasBorder};
      overflow: hidden;
      cursor: pointer;
      background: ${theme.bodyBackground};
    }
    .minimap-background {
      fill: ${theme.bodyBackground};
    }
    .minimap-node {
      vector-effect: non-scaling-stroke;
      stroke-width: 1.5;
    }
    .minimap-node.group {
      opacity: 0.75;
    }
    .minimap-node.is-folding-hidden {
      display: none;
    }
    .minimap-node.is-focus-muted {
      opacity: 0.2;
    }
    .minimap-viewport {
      fill: rgba(25, 103, 210, 0.12);
      stroke: ${theme.link};
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
      pointer-events: none;
    }
    @media (max-width: 720px) {
      .minimap {
        right: 12px;
        bottom: 12px;
        width: min(180px, calc(100vw - 24px));
      }
    }
    .edge-label {
      font-size: 12px;
      fill: ${theme.text};
      pointer-events: none;
    }
    .edge-label-background {
      fill: ${theme.canvasBackground};
      stroke: ${theme.canvasBorder};
      stroke-width: 1;
      pointer-events: none;
    }
    .md-card {
      display: flex;
      flex-direction: column;
      color: inherit;
      margin: -12px -14px;
      padding: 12px 14px;
      height: calc(100% + 24px);
      overflow: hidden;
      overflow-y: auto;
    }
    .md-card-title-link {
      color: inherit;
      text-decoration: none;
      cursor: pointer;
    }
    .md-card-title-link:hover {
      text-decoration: underline;
    }
    .md-card-title { font-weight: 700; margin-bottom: 8px; }
    .md-card-preview {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.2em 0 0;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
    }
    ${indentCssBlock(previewInlineStyleCss, 4)}
    .md-card-preview-text {
      color: ${theme.mutedText};
      font-size: 0.92em;
      margin: 0.35em 0 0;
      overflow-y: auto;
    }
    .md-card-preview h1,
    .md-card-preview h2,
    .md-card-preview h3,
    .md-card-preview h4,
    .md-card-preview h5,
    .md-card-preview h6 {
      margin-top: 0.2em;
      margin-bottom: 0.35em;
      line-height: 1.2;
    }
    .md-card-preview details.heading-section {
      margin: 0.35em 0;
    }
    .md-card-preview details.heading-section > summary.heading-summary {
      position: relative;
      cursor: pointer;
      user-select: none;
      list-style: none;
    }
    .md-card-preview details.heading-section > summary.heading-summary::-webkit-details-marker { display: none; }
    .md-card-preview details.heading-section > summary.heading-summary h1,
    .md-card-preview details.heading-section > summary.heading-summary h2,
    .md-card-preview details.heading-section > summary.heading-summary h3,
    .md-card-preview details.heading-section > summary.heading-summary h4,
    .md-card-preview details.heading-section > summary.heading-summary h5,
    .md-card-preview details.heading-section > summary.heading-summary h6 {
      display: inline-block;
      margin: 0 0.35em 0 0;
      vertical-align: middle;
    }
    .md-card-preview details.heading-section > summary.heading-summary::before { content: "⌄"; position: absolute; left: -1em; top: 50%; transform: translateY(-50%); line-height: 1; color: ${theme.mutedText}; font-weight: 600; opacity: 0; transition: opacity 0.12s ease; }
    .md-card-preview details.heading-section:not([open]) > summary.heading-summary::before { content: "›"; }
    .md-card-preview details.heading-section > summary.heading-summary:hover::before,
    .md-card-preview details.heading-section > summary.heading-summary:focus-visible::before { opacity: 1; }
    ${indentCssBlock(previewHeadingCss, 4)}
    .md-card-preview h1 { font-size: 1.35em; }
    .md-card-preview h2 { font-size: 1.22em; }
    .md-card-preview h3 { font-size: 1.12em; }
    .md-card-preview h4 { font-size: 1.04em; }
    .md-card-preview h5 { font-size: 0.98em; }
    .md-card-preview h6 { font-size: 0.94em; }
    .md-card-preview ul,
    .md-card-preview ol {
      margin: 0.45em 0;
      padding-left: 2em;
    }
    .md-card-preview pre {
      overflow: auto;
    }
    .md-card-preview table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9em;
      margin: 0.5em 0;
    }
    .md-card-preview th,
    .md-card-preview td {
      border: 1px solid ${theme.canvasBorder};
      padding: 4px 6px;
      text-align: left;
    }
    .md-embed-block {
      margin: 0.8em 0;
    }
    .pdf-embed-block {
      margin: 0.8em 0;
      border: 1px solid ${theme.canvasBorder};
      border-radius: 10px;
      overflow: hidden;
      background: ${theme.nodeBackground};
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .pdf-embed-block::-webkit-scrollbar {
      width: 0;
      height: 0;
    }
    .pdf-embed-block iframe {
      display: block;
      width: 100%;
      min-height: 420px;
      border: none;
      background: ${theme.canvasBackground};
    }
    .media-embed-block {
      margin: 0.8em 0;
    }
    .media-embed-block audio,
    .media-embed-block video {
      display: block;
      width: 100%;
      max-width: 100%;
    }
    .md-page {
      max-width: 960px;
      margin: 32px auto;
      padding: 32px;
      background: ${theme.canvasBackground};
      border: 1px solid ${theme.canvasBorder};
      border-radius: 14px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    .md-page-nav {
      margin-bottom: 1.2em;
    }
    .md-page-back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.35em;
      font-size: 0.95em;
      font-weight: 600;
      color: ${theme.link};
      text-decoration: none;
    }
    .md-page-back-link:hover {
      text-decoration: underline;
    }
    .unresolved-link {
      color: #d64545;
      font-style: italic;
    }
`;
}
