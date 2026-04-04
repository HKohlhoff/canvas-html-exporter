#!/usr/bin/env python3
"""
Obsidian Canvas to HTML Converter - Erweiterte Version
======================================================
Konvertiert Obsidian .canvas Dateien in eine voll interaktive HTML-Seite.

Features:
- Exakte Positionsübernahme aller Knoten
- Drag & Drop für alle Knoten
- Zoom & Pan (Mausrad + Drag auf Hintergrund)
- Farbige Knoten (individuelle Farben aus Obsidian)
- Gruppen mit verschachtelten Knoten
- SVG-Kanten mit Bézier-Kurven und Pfeilspitzen
- Markdown-zu-HTML Konvertierung (inkl. Tabellen, Checklisten, Fußnoten)
- Bilder: Base64-Einbettung oder relativer Pfad
- Bild-Export in separaten Ordner
- Multi-Canvas: mehrere .canvas Dateien in einer HTML
- Minimap-Übersicht
- Suchfunktion über alle Knoten
- Dark/Light Mode Toggle
- Responsive Design
- Export als PNG (Screenshot des Canvas)

Nutzung:
    python canvas_to_html.py <datei.canvas> [ausgabe.html] [--export-images] [--light]
    python canvas_to_html.py *.canvas --multi [ausgabe.html]
"""

import json
import os
import sys
import base64
import re
import glob
import hashlib
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, field
from enum import Enum

# ──────────────────────────────────────────────
# Datenklassen
# ──────────────────────────────────────────────

class NodeType(Enum):
    TEXT = "text"
    FILE = "file"
    LINK = "link"
    GROUP = "group"
    IMAGE = "image"
    DEFAULT = "default"

@dataclass
class CanvasNode:
    id: str
    x: float
    y: float
    width: float
    height: float
    node_type: NodeType = NodeType.DEFAULT
    text: str = ""
    label: str = ""
    color: str = ""
    file: str = ""
    url: str = ""
    group_nodes: List[str] = field(default_factory=list)
    subpath: str = ""

@dataclass
class CanvasEdge:
    id: str
    from_node: str
    to_node: str
    from_side: str = "right"
    to_side: str = "left"
    from_end: str = "none"
    to_end: str = "arrow"
    color: str = ""
    label: str = ""

@dataclass
class CanvasData:
    nodes: List[CanvasNode] = field(default_factory=list)
    edges: List[CanvasEdge] = field(default_factory=list)
    name: str = ""
    background_color: str = ""

# ──────────────────────────────────────────────
# Parser
# ──────────────────────────────────────────────

def parse_canvas_file(filepath: str) -> CanvasData:
    """Liest und parst eine Obsidian .canvas JSON-Datei."""
    with open(filepath, 'r', encoding='utf-8') as f:
        raw = json.load(f)

    canvas = CanvasData(name=os.path.splitext(os.path.basename(filepath))[0])

    for n in raw.get('nodes', []):
        node_type_str = n.get('type', 'text')
        try:
            node_type = NodeType(node_type_str)
        except ValueError:
            node_type = NodeType.DEFAULT

        canvas.nodes.append(CanvasNode(
            id=n.get('id', ''),
            x=float(n.get('x', 0)),
            y=float(n.get('y', 0)),
            width=float(n.get('width', 250)),
            height=float(n.get('height', 140)),
            node_type=node_type,
            text=n.get('text', ''),
            label=n.get('label', ''),
            color=n.get('color', ''),
            file=n.get('file', ''),
            url=n.get('url', ''),
            group_nodes=n.get('groupNodes', []),
            subpath=n.get('subpath', ''),
        ))

    for e in raw.get('edges', []):
        canvas.edges.append(CanvasEdge(
            id=e.get('id', ''),
            from_node=e.get('fromNode', ''),
            to_node=e.get('toNode', ''),
            from_side=e.get('fromSide', 'right'),
            to_side=e.get('toSide', 'left'),
            from_end=e.get('fromEnd', 'none'),
            to_end=e.get('toEnd', 'arrow'),
            color=e.get('color', ''),
            label=e.get('label', ''),
        ))

    return canvas

# ──────────────────────────────────────────────
# Markdown → HTML
# ──────────────────────────────────────────────

def markdown_to_html(md: str) -> str:
    """Umfassender Markdown-zu-HTML Konverter."""
    if not md:
        return ""

    lines = md.split('\n')
    html_lines = []
    in_code_block = False
    code_lang = ""
    code_buffer = []
    in_list = False
    list_stack = []  # Stack für verschachtelte Listen
    in_blockquote = False
    bq_buffer = []
    in_table = False
    table_rows = []

    def flush_blockquote():
        nonlocal bq_buffer, in_blockquote
        if bq_buffer:
            inner = markdown_to_html('\n'.join(bq_buffer))
            html_lines.append(f'<blockquote>{inner}</blockquote>')
            bq_buffer = []
        in_blockquote = False

    def flush_table():
        nonlocal table_rows, in_table
        if not table_rows:
            return
        html = '<table>'
        for i, row in enumerate(table_rows):
            cells = [c.strip() for c in row.split('|')]
            cells = [c for c in cells if c != '']
            # Zeile 2 ist die Trennzeile (---)
            if i == 1 and all(re.match(r'^[-:]+$', c) for c in cells):
                continue
            tag = 'th' if i == 0 else 'td'
            html += '<tr>' + ''.join(f'<{tag}>{inline_format(c)}</{tag}>' for c in cells) + '</tr>'
        html += '</table>'
        html_lines.append(html)
        table_rows = []
        in_table = False

    def flush_list():
        nonlocal in_list, list_stack
        while list_stack:
            tag = list_stack.pop()
            html_lines.append(f'</{tag}>')
        in_list = False

    def inline_format(text: str) -> str:
        """Inline-Markdown Formatierung."""
        # Bilder
        text = re.sub(r'!\[\[([^\]]+?)(?:\|(\d+)(?:x(\d+))?)?\]\]',
                       lambda m: f'<img src="{m.group(1)}" '
                                 + (f'width="{m.group(2)}" ' if m.group(2) else '')
                                 + (f'height="{m.group(3)}" ' if m.group(3) else '')
                                 + f'alt="{m.group(1)}">', text)
        text = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1">', text)

        # Links
        text = re.sub(r'\[\[([^\]|]+)\|([^\]]+)\]\]', r'<a class="internal-link" href="\1">\2</a>', text)
        text = re.sub(r'\[\[([^\]]+)\]\]', r'<a class="internal-link" href="\1">\1</a>', text)
        text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" target="_blank" rel="noopener">\1</a>', text)

        # Inline code
        text = re.sub(r'`([^`]+)`', r'<code>\1</code>', text)

        # Bold + Italic
        text = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', text)
        text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
        text = re.sub(r'(?<!\*)\*([^*]+)\*(?!\*)', r'<em>\1</em>', text)

        # Strikethrough
        text = re.sub(r'~~(.*?)~~', r'<del>\1</del>', text)

        # Highlight ==text==
        text = re.sub(r'==(.*?)==', r'<mark>\1</mark>', text)

        # Footnotes
        text = re.sub(r'\[\^(\w+)\]', r'<sup class="footnote" data-fn="\1">[\1]</sup>', text)

        # Tags #tag
        text = re.sub(r'(?<!\w)#(\w[\w/-]*)', r'<span class="tag">#\1</span>', text)

        return text

    for line in lines:
        # ─── Codeblöcke ───
        if line.strip().startswith('```'):
            if in_code_block:
                html_lines.append(f'<pre><code class="language-{code_lang}">'
                                  + '\n'.join(code_buffer)
                                  + '</code></pre>')
                code_buffer = []
                in_code_block = False
                code_lang = ""
            else:
                # Vor Code-Block alle offenen Listen/BQ schließen
                if in_list:
                    flush_list()
                if in_blockquote:
                    flush_blockquote()
                if in_table:
                    flush_table()
                in_code_block = True
                code_lang = line.strip()[3:].strip()
            continue

        if in_code_block:
            # HTML-Entities im Code escapen
            code_buffer.append(line.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))
            continue

        # ─── Blockquotes ───
        if line.strip().startswith('> '):
            if in_table:
                flush_table()
            if in_list:
                flush_list()
            in_blockquote = True
            bq_buffer.append(line.strip()[2:])
            continue
        elif in_blockquote:
            flush_blockquote()

        # ─── Tabellen ───
        if '|' in line and line.strip().startswith('|'):
            if in_list:
                flush_list()
            in_table = True
            table_rows.append(line.strip())
            continue
        elif in_table:
            flush_table()

        # ─── Horizontale Linie ───
        if re.match(r'^(\*{3,}|-{3,}|_{3,})\s*$', line.strip()):
            if in_list:
                flush_list()
            html_lines.append('<hr>')
            continue

        # ─── Überschriften ───
        m = re.match(r'^(#{1,6})\s+(.*)', line)
        if m:
            if in_list:
                flush_list()
            level = len(m.group(1))
            text = inline_format(m.group(2))
            anchor = re.sub(r'\W+', '-', m.group(2).lower()).strip('-')
            html_lines.append(f'<h{level} id="{anchor}">{text}</h{level}>')
            continue

        # ─── Checklisten ───
        m = re.match(r'^(\s*)- \[([ xX])\]\s+(.*)', line)
        if m:
            indent = len(m.group(1))
            checked = 'checked' if m.group(2).lower() == 'x' else ''
            text = inline_format(m.group(3))
            if not in_list:
                html_lines.append('<ul class="checklist">')
                list_stack.append('ul')
                in_list = True
            html_lines.append(
                f'<li class="task-item"><input type="checkbox" {checked} disabled> {text}</li>'
            )
            continue

        # ─── Ungeordnete Listen ───
        m = re.match(r'^(\s*)([-*+])\s+(.*)', line)
        if m:
            text = inline_format(m.group(3))
            if not in_list:
                html_lines.append('<ul>')
                list_stack.append('ul')
                in_list = True
            html_lines.append(f'<li>{text}</li>')
            continue

        # ─── Geordnete Listen ───
        m = re.match(r'^(\s*)(\d+)\.\s+(.*)', line)
        if m:
            text = inline_format(m.group(3))
            if not in_list:
                html_lines.append('<ol>')
                list_stack.append('ol')
                in_list = True
            html_lines.append(f'<li>{text}</li>')
            continue

        # Falls wir in einer Liste waren und jetzt nicht mehr
        if in_list and line.strip() == '':
            flush_list()
            html_lines.append('')
            continue
        elif in_list and line.strip():
            flush_list()

        # ─── Leerzeile ───
        if line.strip() == '':
            html_lines.append('')
            continue

        # ─── Normaler Absatz ───
        html_lines.append(f'<p>{inline_format(line)}</p>')

    # Offene Elemente schließen
    if in_code_block:
        html_lines.append(f'<pre><code class="language-{code_lang}">'
                          + '\n'.join(code_buffer) + '</code></pre>')
    if in_blockquote:
        flush_blockquote()
    if in_table:
        flush_table()
    if in_list:
        flush_list()

    return '\n'.join(html_lines)

# ──────────────────────────────────────────────
# Bilder verarbeiten
# ──────────────────────────────────────────────

def resolve_image(src: str, vault_path: str, export_dir: Optional[str] = None) -> str:
    """Löst ein Bild auf: Base64-Einbettung oder Export."""
    # URL → direkt verwenden
    if src.startswith('http://') or src.startswith('https://') or src.startswith('data:'):
        return src

    # Lokale Datei suchen
    candidates = [
        os.path.join(vault_path, src),
        os.path.join(vault_path, '.obsidian', src),
    ]
    # Rekursive Suche
    for root, dirs, files in os.walk(vault_path):
        basename = os.path.basename(src)
        if basename in files:
            candidates.append(os.path.join(root, basename))

    img_path = None
    for c in candidates:
        if os.path.isfile(c):
            img_path = c
            break

    if not img_path:
        return src  # Fallback: Originalpfad

    # Wenn export_dir → Bild kopieren
    if export_dir:
        os.makedirs(export_dir, exist_ok=True)
        dest = os.path.join(export_dir, os.path.basename(img_path))
        if not os.path.exists(dest):
            shutil.copy2(img_path, dest)
        return os.path.relpath(dest, os.path.dirname(export_dir))

    # Sonst → Base64
    ext = os.path.splitext(img_path)[1].lower().lstrip('.')
    mime_map = {
        'png': 'image/png', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
        'gif': 'image/gif', 'svg': 'image/svg+xml', 'webp': 'image/webp',
        'bmp': 'image/bmp', 'ico': 'image/x-icon',
    }
    mime = mime_map.get(ext, 'application/octet-stream')
    with open(img_path, 'rb') as f:
        b64 = base64.b64encode(f.read()).decode('utf-8')
    return f'data:{mime};base64,{b64}'

def process_images_in_html(html: str, vault_path: str, export_dir: Optional[str] = None) -> str:
    """Findet alle <img src="..."> und löst die Pfade auf."""
    def replace_src(m):
        src = m.group(1)
        resolved = resolve_image(src, vault_path, export_dir)
        return f'src="{resolved}"'
    return re.sub(r'src="([^"]+)"', replace_src, html)

# ──────────────────────────────────────────────
# Datei-Inhalt laden
# ──────────────────────────────────────────────

def load_file_content(filepath: str, vault_path: str, subpath: str = "") -> str:
    """Lädt den Inhalt einer referenzierten Datei."""
    candidates = [
        os.path.join(vault_path, filepath),
    ]
    for root, dirs, files in os.walk(vault_path):
        if os.path.basename(filepath) in files:
            candidates.append(os.path.join(root, os.path.basename(filepath)))

    for c in candidates:
        if os.path.isfile(c):
            ext = os.path.splitext(c)[1].lower()
            if ext in ('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'):
                return f'<img src="{c}" alt="{os.path.basename(c)}" style="max-width:100%;">'
            elif ext == '.pdf':
                return f'<div class="pdf-embed">PDF: {os.path.basename(c)}</div>'
            else:
                with open(c, 'r', encoding='utf-8', errors='replace') as f:
                    content = f.read()
                if subpath:
                    # Nur einen bestimmten Abschnitt extrahieren
                    pattern = re.compile(
                        r'^(#{1,6})\s+' + re.escape(subpath.lstrip('#').strip()) + r'\s*$(.*?)(?=^#{1,6}\s|\Z)',
                        re.MULTILINE | re.DOTALL
                    )
                    match = pattern.search(content)
                    if match:
                        content = match.group(0)
                return markdown_to_html(content)
    return f'<em>Datei nicht gefunden: {filepath}</em>'

# ──────────────────────────────────────────────
# Canvas-Abmessungen & Normalisierung
# ──────────────────────────────────────────────

def normalize_canvas(canvas: CanvasData, padding: float = 80) -> Tuple[float, float]:
    """Verschiebt alle Knoten so, dass min(x),min(y) = padding."""
    if not canvas.nodes:
        return (1200, 900)

    min_x = min(n.x for n in canvas.nodes)
    min_y = min(n.y for n in canvas.nodes)

    for n in canvas.nodes:
        n.x = n.x - min_x + padding
        n.y = n.y - min_y + padding

    max_x = max(n.x + n.width for n in canvas.nodes) + padding
    max_y = max(n.y + n.height for n in canvas.nodes) + padding

    return (max_x, max_y)

# ──────────────────────────────────────────────
# Obsidian-Farben auflösen
# ──────────────────────────────────────────────

OBSIDIAN_COLORS = {
    "1": "#fb464c",   # Rot
    "2": "#e9973f",   # Orange
    "3": "#e0de71",   # Gelb
    "4": "#44cf6e",   # Grün
    "5": "#53dfdd",   # Cyan
    "6": "#a882ff",   # Lila
}

def resolve_color(color: str) -> str:
    """Löst eine Obsidian-Farbnummer oder Hex-Wert auf."""
    if not color:
        return ""
    if color in OBSIDIAN_COLORS:
        return OBSIDIAN_COLORS[color]
    if color.startswith('#'):
        return color
    return ""

# ──────────────────────────────────────────────
# Kanten-Geometrie berechnen
# ──────────────────────────────────────────────

def get_anchor_point(node: CanvasNode, side: str) -> Tuple[float, float]:
    """Berechnet den Ankerpunkt an einer Knotenseite."""
    cx = node.x + node.width / 2
    cy = node.y + node.height / 2
    if side == "top":
        return (cx, node.y)
    elif side == "bottom":
        return (cx, node.y + node.height)
    elif side == "left":
        return (node.x, cy)
    elif side == "right":
        return (node.x + node.width, cy)
    return (cx, cy)

def build_edge_path(from_pt: Tuple, to_pt: Tuple, from_side: str, to_side: str) -> str:
    """Erstellt einen Bézier-Kurvenpfad zwischen zwei Punkten."""
    fx, fy = from_pt
    tx, ty = to_pt
    dist = ((tx - fx)**2 + (ty - fy)**2) ** 0.5
    curve_strength = min(dist * 0.4, 200)

    # Kontrollpunkte basierend auf den Seiten
    offsets = {
        "right": (curve_strength, 0),
        "left": (-curve_strength, 0),
        "bottom": (0, curve_strength),
        "top": (0, -curve_strength),
    }
    c1_off = offsets.get(from_side, (curve_strength, 0))
    c2_off = offsets.get(to_side, (-curve_strength, 0))

    c1x = fx + c1_off[0]
    c1y = fy + c1_off[1]
    c2x = tx + c2_off[0]
    c2y = ty + c2_off[1]

    return f"M {fx:.1f} {fy:.1f} C {c1x:.1f} {c1y:.1f}, {c2x:.1f} {c2y:.1f}, {tx:.1f} {ty:.1f}"

# ──────────────────────────────────────────────
# HTML-Generierung
# ──────────────────────────────────────────────

def generate_html(
    canvases: List[CanvasData],
    vault_path: str,
    export_images_dir: Optional[str] = None,
    dark_mode: bool = True,
) -> str:
    """Generiert die komplette HTML-Seite."""

    # ─── Alle Canvas-Seiten vorbereiten ───
    pages = []
    for canvas in canvases:
        cw, ch = normalize_canvas(canvas)
        node_map = {n.id: n for n in canvas.nodes}
        pages.append({
            'canvas': canvas,
            'width': cw,
            'height': ch,
            'node_map': node_map,
        })

    # ─── Knoten-HTML generieren ───
    all_pages_html = []
    for pi, page in enumerate(pages):
        canvas = page['canvas']
        node_map = page['node_map']

        nodes_html_list = []
        for node in canvas.nodes:
            color = resolve_color(node.color)
            border_style = f"border-left: 4px solid {color};" if color else ""
            bg_tint = f"background: linear-gradient(135deg, {color}22, transparent);" if color else ""

            # Inhalt bestimmen
            if node.node_type == NodeType.TEXT or node.node_type == NodeType.DEFAULT:
                content = markdown_to_html(node.text or node.label)
            elif node.node_type == NodeType.FILE:
                content = load_file_content(node.file, vault_path, node.subpath)
            elif node.node_type == NodeType.LINK:
                url = node.url
                content = (f'<div class="link-embed">'
                           f'<a href="{url}" target="_blank" rel="noopener">{url}</a>'
                           f'<iframe src="{url}" sandbox="allow-scripts allow-same-origin" '
                           f'loading="lazy"></iframe></div>')
            elif node.node_type == NodeType.GROUP:
                content = markdown_to_html(node.label or "")
            elif node.node_type == NodeType.IMAGE:
                content = f'<img src="{node.file}" alt="Bild" style="max-width:100%;height:auto;">'
            else:
                content = markdown_to_html(node.text or node.label or "")

            # Bilder auflösen
            content = process_images_in_html(content, vault_path, export_images_dir)

            # Label / Titel
            title_text = node.label or ""
            if node.node_type == NodeType.FILE:
                title_text = title_text or os.path.basename(node.file)
            title_html = f'<div class="node-title">{title_text}</div>' if title_text else ''

            type_class = f"node-type-{node.node_type.value}"
            group_class = "node-group" if node.node_type == NodeType.GROUP else ""

            nodes_html_list.append(f'''
<div class="node {type_class} {group_class}"
     id="node-{node.id}"
     data-node-id="{node.id}"
     style="left:{node.x:.1f}px; top:{node.y:.1f}px;
            width:{node.width:.1f}px; min-height:{node.height:.1f}px;
            {border_style} {bg_tint}">
    {title_html}
    <div class="node-content">{content}</div>
</div>''')

        # ─── Kanten-SVG ───
        edges_paths = []
        edge_labels = []
        for edge in canvas.edges:
            fn = node_map.get(edge.from_node)
            tn = node_map.get(edge.to_node)
            if not fn or not tn:
                continue

            from_pt = get_anchor_point(fn, edge.from_side)
            to_pt = get_anchor_point(tn, edge.to_side)
            path_d = build_edge_path(from_pt, to_pt, edge.from_side, edge.to_side)

            edge_color = resolve_color(edge.color) or 'var(--edge-color)'

            # Marker (Pfeilspitzen)
            marker_start = ""
            marker_end = ""
            marker_id_end = f"arrow-{edge.id}-end"
            marker_id_start = f"arrow-{edge.id}-start"

            defs = ""
            if edge.to_end == "arrow":
                marker_end = f'marker-end="url(#{marker_id_end})"'
                defs += (f'<marker id="{marker_id_end}" markerWidth="12" markerHeight="8" '
                         f'refX="11" refY="4" orient="auto"><polygon points="0 0, 12 4, 0 8" '
                         f'fill="{edge_color}" /></marker>')
            if edge.from_end == "arrow":
                marker_start = f'marker-start="url(#{marker_id_start})"'
                defs += (f'<marker id="{marker_id_start}" markerWidth="12" markerHeight="8" '
                         f'refX="1" refY="4" orient="auto"><polygon points="12 0, 0 4, 12 8" '
                         f'fill="{edge_color}" /></marker>')

            if defs:
                defs = f'<defs>{defs}</defs>'

            edges_paths.append(
                f'{defs}<path d="{path_d}" stroke="{edge_color}" stroke-width="2" '
                f'fill="none" stroke-linecap="round" {marker_start} {marker_end} />'
            )

            # Label
            if edge.label:
                mid_x = (from_pt[0] + to_pt[0]) / 2
                mid_y = (from_pt[1] + to_pt[1]) / 2
                edge_labels.append(
                    f'<div class="edge-label" style="left:{mid_x:.1f}px;top:{mid_y:.1f}px;">'
                    f'{edge.label}</div>'
                )

        edges_svg = (f'<svg class="edges-layer" width="{page["width"]}" height="{page["height"]}">'
                     + ''.join(edges_paths) + '</svg>')

        page_html = f'''
<div class="canvas-page" id="page-{pi}" data-page="{pi}"
     style="width:{page["width"]:.0f}px; height:{page["height"]:.0f}px;"
     {"" if pi == 0 else 'style="display:none;"'}>
    {edges_svg}
    {''.join(edge_labels)}
    {''.join(nodes_html_list)}
</div>'''
        all_pages_html.append(page_html)

    # ─── Tab-Navigation (Multi-Canvas) ───
    tabs_html = ""
    if len(canvases) > 1:
        tabs = []
        for i, c in enumerate(canvases):
            active = "active" if i == 0 else ""
            tabs.append(f'<button class="tab-btn {active}" data-page="{i}">{c.name}</button>')
        tabs_html = f'<div class="tab-bar">{"".join(tabs)}</div>'

    # ─── Gesamtes HTML ───
    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{"  |  ".join(c.name for c in canvases)} — Canvas</title>
<style>
/* ──── CSS Variables ──── */
:root {{
    --bg:            {"#1a1a2e" if dark_mode else "#f0f0f0"};
    --surface:       {"#16213e" if dark_mode else "#ffffff"};
    --surface-hover: {"#1a2744" if dark_mode else "#f8f8ff"};
    --border:        {"#2a3a5c" if dark_mode else "#d0d0d0"};
    --text:          {"#e0e0e0" if dark_mode else "#333333"};
    --text-muted:    {"#8899aa" if dark_mode else "#888888"};
    --title:         {"#ffffff" if dark_mode else "#111111"};
    --accent:        #4da6ff;
    --accent-hover:  #66b8ff;
    --edge-color:    {"#5588bb" if dark_mode else "#888888"};
    --group-bg:      {"rgba(100,140,200,0.08)" if dark_mode else "rgba(100,140,200,0.06)"};
    --group-border:  {"#3a5a8a" if dark_mode else "#aabbcc"};
    --shadow:        {"rgba(0,0,0,0.5)" if dark_mode else "rgba(0,0,0,0.15)"};
    --code-bg:       {"rgba(255,255,255,0.06)" if dark_mode else "rgba(0,0,0,0.05)"};
    --mark-bg:       {"rgba(255,255,0,0.25)" if dark_mode else "rgba(255,255,0,0.4)"};
    --minimap-bg:    {"rgba(0,0,0,0.6)" if dark_mode else "rgba(255,255,255,0.85)"};
}}

/* ──── Reset & Base ──── */
*, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
html {{ scroll-behavior: smooth; }}
body {{
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    height: 100vh;
    user-select: none;
}}

/* ──── Viewport (Pan & Zoom) ──── */
#viewport {{
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    position: relative;
    cursor: grab;
}}
#viewport.grabbing {{ cursor: grabbing; }}
#world {{
    position: absolute;
    transform-origin: 0 0;
    will-change: transform;
}}

/* ──── Canvas Page ──── */
.canvas-page {{
    position: relative;
    background: repeating-linear-gradient(
        0deg, transparent, transparent 49px, {"rgba(255,255,255,0.03)" if dark_mode else "rgba(0,0,0,0.03)"} 50px
    ),
    repeating-linear-gradient(
        90deg, transparent, transparent 49px, {"rgba(255,255,255,0.03)" if dark_mode else "rgba(0,0,0,0.03)"} 50px
    );
}}

/* ──── Nodes ──── */
.node {{
    position: absolute;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px 16px;
    box-shadow: 0 2px 12px var(--shadow);
    word-wrap: break-word;
    overflow-wrap: break-word;
    overflow: auto;
    font-size: 14px;
    line-height: 1.6;
    z-index: 10;
    cursor: move;
    transition: box-shadow 0.2s, transform 0.15s;
}}
.node:hover {{
    box-shadow: 0 6px 24px var(--shadow);
    z-index: 100;
}}
.node.dragging {{
    opacity: 0.85;
    z-index: 999;
    box-shadow: 0 12px 40px var(--shadow);
}}

/* ──── Node Types ──── */
.node-group {{
    background: var(--group-bg);
    border: 2px dashed var(--group-border);
    z-index: 1;
    cursor: default;
}}
.node-type-link iframe {{
    width: 100%;
    height: 200px;
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-top: 8px;
}}

/* ──── Node Title ──── */
.node-title {{
    font-weight: 700;
    font-size: 15px;
    color: var(--title);
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
}}

/* ──── Node Content ──── */
.node-content {{ color: var(--text); }}
.node-content h1 {{ font-size: 1.4em; margin: 12px 0 6px; color: var(--title); }}
.node-content h2 {{ font-size: 1.2em; margin: 10px 0 5px; color: var(--title); }}
.node-content h3 {{ font-size: 1.05em; margin: 8px 0 4px; color: var(--title); }}
.node-content p {{ margin: 6px 0; }}
.node-content img {{ max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }}
.node-content a {{ color: var(--accent); text-decoration: none; }}
.node-content a:hover {{ text-decoration: underline; color: var(--accent-hover); }}
.node-content code {{
    background: var(--code-bg);
    padding: 2px 5px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    font-size: 0.88em;
}}
.node-content pre {{
    background: {"#0d1117" if dark_mode else "#f6f8fa"};
    padding: 12px;
    border-radius: 6px;
    overflow-x: auto;
    margin: 10px 0;
    border: 1px solid var(--border);
}}
.node-content pre code {{ background: none; padding: 0; font-size: 0.85em; }}
.node-content blockquote {{
    border-left: 3px solid var(--accent);
    padding: 4px 12px;
    margin: 8px 0;
    color: var(--text-muted);
    font-style: italic;
}}
.node-content ul, .node-content ol {{ margin: 4px 0 4px 20px; }}
.node-content li {{ margin: 2px 0; }}
.node-content table {{ border-collapse: collapse; width: 100%; margin: 8px 0; }}
.node-content th, .node-content td {{
    border: 1px solid var(--border);
    padding: 6px 10px;
    text-align: left;
    font-size: 0.9em;
}}
.node-content th {{ background: var(--code-bg); font-weight: 600; }}
.node-content hr {{ border: none; border-top: 1px solid var(--border); margin: 12px 0; }}
.node-content mark {{ background: var(--mark-bg); padding: 1px 3px; border-radius: 2px; }}
.node-content .tag {{
    background: var(--accent);
    color: white;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 0.8em;
    font-weight: 500;
}}
.node-content .checklist {{ list-style: none; margin-left: 0; }}
.node-content .task-item {{ display: flex; align-items: center; gap: 6px; }}
.node-content .task-item input {{ margin: 0; }}
.node-content .footnote {{ color: var(--accent); cursor: pointer; }}

/* ──── Edges ──── */
.edges-layer {{
    position: absolute;
    top: 0; left: 0;
    pointer-events: none;
    z-index: 5;
}}
.edge-label {{
    position: absolute;
    transform: translate(-50%, -50%);
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    z-index: 6;
    pointer-events: none;
    white-space: nowrap;
}}

/* ──── Controls ──── */
.controls {{
    position: fixed;
    top: 12px;
    right: 12px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    z-index: 2000;
}}
.controls button {{
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    width: 38px; height: 38px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
}}
.controls button:hover {{ background: var(--surface-hover); }}

/* ──── Search ──── */
.search-bar {{
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 2000;
    display: flex;
    gap: 0;
}}
.search-bar input {{
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 14px;
    border-radius: 8px 0 0 8px;
    font-size: 14px;
    width: 280px;
    outline: none;
}}
.search-bar input:focus {{ border-color: var(--accent); }}
.search-bar button {{
    background: var(--accent);
    border: none;
    color: white;
    padding: 8px 14px;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    font-size: 14px;
}}
.node.search-highlight {{
    outline: 3px solid var(--accent);
    outline-offset: 2px;
    animation: pulse 1s ease-in-out 2;
}}
@keyframes pulse {{
    0%, 100% {{ outline-color: var(--accent); }}
    50% {{ outline-color: transparent; }}
}}

/* ──── Minimap ──── */
.minimap {{
    position: fixed;
    bottom: 12px;
    right: 12px;
    width: 200px;
    height: 150px;
    background: var(--minimap-bg);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    z-index: 2000;
    cursor: pointer;
}}
.minimap canvas {{ width: 100%; height: 100%; }}

/* ──── Tab Bar (Multi-Canvas) ──── */
.tab-bar {{
    position: fixed;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 4px;
    z-index: 2000;
    background: var(--surface);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid var(--border);
}}
.tab-btn {{
    background: transparent;
    border: none;
    color: var(--text-muted);
    padding: 6px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    transition: all 0.15s;
}}
.tab-btn.active {{ background: var(--accent); color: white; }}

/* ──── Info Badge ──── */
.info-badge {{
    position: fixed;
    bottom: 12px;
    left: 12px;
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-muted);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    z-index: 2000;
}}

/* ──── Theme Toggle ──── */
.theme-toggle {{
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 2000;
}}
.theme-toggle button {{
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
}}
</style>
</head>
<body>

<!-- Theme Toggle -->
<div class="theme-toggle">
    <button id="themeBtn" title="Dark/Light Mode umschalten">{"🌙" if dark_mode else "☀️"}</button>
</div>

<!-- Search -->
<div class="search-bar">
    <input type="text" id="searchInput" placeholder="Knoten suchen..." />
    <button id="searchBtn">Suchen</button>
</div>

<!-- Controls -->
<div class="controls">
    <button id="zoomInBtn" title="Hereinzoomen">+</button>
    <button id="zoomOutBtn" title="Herauszoomen">−</button>
    <button id="resetBtn" title="Ansicht zurücksetzen">⌂</button>
    <button id="fitBtn" title="Alles einpassen">⊞</button>
    <button id="screenshotBtn" title="Screenshot (PNG)">📷</button>
</div>

<!-- Info -->
<div class="info-badge" id="infoBadge"></div>

<!-- Minimap -->
<div class="minimap" id="minimap"><canvas id="minimapCanvas"></canvas></div>

<!-- Tabs -->
{tabs_html}

<!-- Viewport -->
<div id="viewport">
    <div id="world">
        {''.join(all_pages_html)}
    </div>
</div>

<script>
(function() {{
    "use strict";

    // ──── State ────
    let scale = 1;
    let panX = 0, panY = 0;
    let isPanning = false;
    let panStartX, panStartY;
    let isDragging = false;
    let dragNode = null;
    let dragOffsetX, dragOffsetY;
    let currentPage = 0;
    let isDark = {'true' if dark_mode else 'false'};

    const viewport = document.getElementById('viewport');
    const world    = document.getElementById('world');
    const pages    = document.querySelectorAll('.canvas-page');

    // ──── Transform ────
    function applyTransform() {{
        world.style.transform = `translate(${{panX}}px, ${{panY}}px) scale(${{scale}})`;
        updateMinimap();
    }}

    // ──── Zoom ────
    function zoom(delta, cx, cy) {{
        const oldScale = scale;
        scale = Math.min(5, Math.max(0.05, scale + delta));
        const ratio = scale / oldScale;
        panX = cx - (cx - panX) * ratio;
        panY = cy - (cy - panY) * ratio;
        applyTransform();
    }}

    viewport.addEventListener('wheel', e => {{
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        zoom(delta * scale, e.clientX, e.clientY);
    }}, {{ passive: false }});

    document.getElementById('zoomInBtn').onclick  = () => zoom(0.15 * scale, window.innerWidth/2, window.innerHeight/2);
    document.getElementById('zoomOutBtn').onclick = () => zoom(-0.15 * scale, window.innerWidth/2, window.innerHeight/2);
    document.getElementById('resetBtn').onclick   = () => {{ scale=1; panX=0; panY=0; applyTransform(); }};
    document.getElementById('fitBtn').onclick     = () => fitAll();

    function fitAll() {{
        const page = pages[currentPage];
        if (!page) return;
        const pw = parseFloat(page.style.width);
        const ph = parseFloat(page.style.height);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        scale = Math.min(vw / pw, vh / ph) * 0.9;
        panX = (vw - pw * scale) / 2;
        panY = (vh - ph * scale) / 2;
        applyTransform();
    }}

    // ──── Pan ────
    viewport.addEventListener('pointerdown', e => {{
        if (e.target.closest('.node') && !e.target.closest('.node-group')) return;
        isPanning = true;
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
        viewport.classList.add('grabbing');
        viewport.setPointerCapture(e.pointerId);
    }});
    viewport.addEventListener('pointermove', e => {{
        if (isPanning) {{
            panX = e.clientX - panStartX;
            panY = e.clientY - panStartY;
            applyTransform();
        }}
    }});
    viewport.addEventListener('pointerup', () => {{
        isPanning = false;
        viewport.classList.remove('grabbing');
    }});

    // ──── Drag Nodes ────
    document.querySelectorAll('.node:not(.node-group)').forEach(node => {{
        node.addEventListener('pointerdown', e => {{
            e.stopPropagation();
            isDragging = true;
            dragNode = node;
            dragNode.classList.add('dragging');
            const rect = node.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
            node.setPointerCapture(e.pointerId);
        }});
        node.addEventListener('pointermove', e => {{
            if (!isDragging || dragNode !== node) return;
            const worldRect = world.getBoundingClientRect();
            const newX = (e.clientX - worldRect.left - dragOffsetX * scale) / scale;
            const newY = (e.clientY - worldRect.top  - dragOffsetY * scale) / scale;
            node.style.left = newX + 'px';
            node.style.top  = newY + 'px';
            // Kanten neu zeichnen (vereinfacht: SVG wird nicht live aktualisiert)
        }});
        node.addEventListener('pointerup', () => {{
            if (dragNode) dragNode.classList.remove('dragging');
            isDragging = false;
            dragNode = null;
        }});
    }});

    // ──── Search ────
    const searchInput = document.getElementById('searchInput');
    const searchBtn   = document.getElementById('searchBtn');

    function doSearch() {{
        const query = searchInput.value.toLowerCase().trim();
        document.querySelectorAll('.node.search-highlight').forEach(n => n.classList.remove('search-highlight'));
        if (!query) return;
        let found = null;
        document.querySelectorAll('.canvas-page')[currentPage]
            .querySelectorAll('.node').forEach(node => {{
                const text = node.textContent.toLowerCase();
                if (text.includes(query)) {{
                    node.classList.add('search-highlight');
                    if (!found) found = node;
                }}
            }});
        if (found) {{
            // Pan to found node
            const x = parseFloat(found.style.left);
            const y = parseFloat(found.style.top);
            panX = window.innerWidth/2 - x * scale;
            panY = window.innerHeight/2 - y * scale;
            applyTransform();
        }}
    }}

    searchBtn.onclick = doSearch;
    searchInput.addEventListener('keydown', e => {{ if (e.key === 'Enter') doSearch(); }});

    // ──── Tab Switching ────
    document.querySelectorAll('.tab-btn').forEach(btn => {{
        btn.onclick = () => {{
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPage = parseInt(btn.dataset.page);
            pages.forEach((p, i) => p.style.display = i === currentPage ? '' : 'none');
            updateInfo();
            fitAll();
        }};
    }});

    // ──── Theme Toggle ────
    document.getElementById('themeBtn').onclick = () => {{
        isDark = !isDark;
        const r = document.documentElement.style;
        if (isDark) {{
            r.setProperty('--bg', '#1a1a2e');
            r.setProperty('--surface', '#16213e');
            r.setProperty('--surface-hover', '#1a2744');
            r.setProperty('--border', '#2a3a5c');
            r.setProperty('--text', '#e0e0e0');
            r.setProperty('--text-muted', '#8899aa');
            r.setProperty('--title', '#ffffff');
            r.setProperty('--edge-color', '#5588bb');
            r.setProperty('--shadow', 'rgba(0,0,0,0.5)');
            r.setProperty('--code-bg', 'rgba(255,255,255,0.06)');
            r.setProperty('--minimap-bg', 'rgba(0,0,0,0.6)');
            document.getElementById('themeBtn').textContent = '🌙';
        }} else {{
            r.setProperty('--bg', '#f0f0f0');
            r.setProperty('--surface', '#ffffff');
            r.setProperty('--surface-hover', '#f8f8ff');
            r.setProperty('--border', '#d0d0d0');
            r.setProperty('--text', '#333333');
            r.setProperty('--text-muted', '#888888');
            r.setProperty('--title', '#111111');
            r.setProperty('--edge-color', '#888888');
            r.setProperty('--shadow', 'rgba(0,0,0,0.15)');
            r.setProperty('--code-bg', 'rgba(0,0,0,0.05)');
            r.setProperty('--minimap-bg', 'rgba(255,255,255,0.85)');
            document.getElementById('themeBtn').textContent = '☀️';
        }}
    }};

    // ──── Minimap ────
    const minimapCanvas = document.getElementById('minimapCanvas');
    const mmCtx = minimapCanvas.getContext('2d');
    minimapCanvas.width = 200;
    minimapCanvas.height = 150;

    function updateMinimap() {{
        const page = pages[currentPage];
        if (!page) return;
        const pw = parseFloat(page.style.width)  || 1200;
        const ph = parseFloat(page.style.height) || 900;
        const mmW = 200, mmH = 150;
        const mmScale = Math.min(mmW / pw, mmH / ph);

        mmCtx.clearRect(0, 0, mmW, mmH);

        // Nodes
        mmCtx.fillStyle = isDark ? '#334466' : '#bbccdd';
        page.querySelectorAll('.node').forEach(node => {{
            const x = parseFloat(node.style.left) * mmScale;
            const y = parseFloat(node.style.top) * mmScale;
            const w = parseFloat(node.style.width) * mmScale;
            const h = Math.max(parseFloat(node.style.minHeight) || 20, 20) * mmScale;
            mmCtx.fillRect(x, y, Math.max(w, 2), Math.max(h, 2));
        }});

        // Viewport rect
        const vx = (-panX / scale) * mmScale;
        const vy = (-panY / scale) * mmScale;
        const vw = (window.innerWidth / scale) * mmScale;
        const vh = (window.innerHeight / scale) * mmScale;
        mmCtx.strokeStyle = 'var(--accent)';
        mmCtx.strokeStyle = '#4da6ff';
        mmCtx.lineWidth = 2;
        mmCtx.strokeRect(vx, vy, vw, vh);
    }}

    // Click on minimap to navigate
    document.getElementById('minimap').addEventListener('click', e => {{
        const rect = minimapCanvas.getBoundingClientRect();
        const page = pages[currentPage];
        const pw = parseFloat(page.style.width) || 1200;
        const ph = parseFloat(page.style.height) || 900;
        const mmScale = Math.min(200/pw, 150/ph);
        const clickX = (e.clientX - rect.left) / mmScale;
        const clickY = (e.clientY - rect.top) / mmScale;
        panX = window.innerWidth/2 - clickX * scale;
        panY = window.innerHeight/2 - clickY * scale;
        applyTransform();
    }});

    // ──── Screenshot ────
    document.getElementById('screenshotBtn').onclick = async () => {{
        // Einfacher HTML-to-Canvas Screenshot mittels Blob
        try {{
            const page = pages[currentPage];
            const clone = page.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            document.body.appendChild(clone);

            const svgData = `
                <svg xmlns="http://www.w3.org/2000/svg" width="${{page.offsetWidth}}" height="${{page.offsetHeight}}">
                    <foreignObject width="100%" height="100%">
                        <div xmlns="http://www.w3.org/1999/xhtml">
                            ${{page.outerHTML}}
                        </div>
                    </foreignObject>
                </svg>`;

            const blob = new Blob([svgData], {{type: 'image/svg+xml'}});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'canvas-screenshot.svg';
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(clone);
            alert('SVG-Screenshot heruntergeladen!');
        }} catch(err) {{
            alert('Screenshot fehlgeschlagen: ' + err.message + '\\nTipp: Für PNG verwende einen Browser-Screenshot (Strg+Shift+S in Firefox).');
        }}
    }};

    // ──── Info Badge ────
    function updateInfo() {{
        const page = pages[currentPage];
        const nc = page ? page.querySelectorAll('.node').length : 0;
        const ec = page ? page.querySelectorAll('.edges-layer path').length : 0;
        document.getElementById('infoBadge').textContent =
            `${{nc}} Knoten · ${{ec}} Verbindungen · Zoom: ${{(scale*100).toFixed(0)}}%`;
    }}

    // Update info on zoom
    const origApply = applyTransform;

    // ──── Keyboard Shortcuts ────
    document.addEventListener('keydown', e => {{
        if (e.target.tagName === 'INPUT') return;
        if (e.key === '+' || e.key === '=') zoom(0.1*scale, window.innerWidth/2, window.innerHeight/2);
        if (e.key === '-') zoom(-0.1*scale, window.innerWidth/2, window.innerHeight/2);
        if (e.key === '0') {{ scale=1; panX=0; panY=0; applyTransform(); }}
        if (e.key === 'f' || e.key === 'F') fitAll();
        if (e.ctrlKey && e.key === 'f') {{ e.preventDefault(); searchInput.focus(); }}
    }});

    // ──── Init ────
    pages.forEach((p, i) => {{ if (i !== 0) p.style.display = 'none'; }});
    fitAll();
    updateInfo();

    // Override applyTransform to update info
    const _origApply = window.applyTransform;
    const origApplyFn = applyTransform;
    // Patch: update info after every transform
    setInterval(updateInfo, 500);

}})();
</script>
</body>
</html>'''

# ──────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────

def main():
    import argparse

    parser = argparse.ArgumentParser(
        description="Obsidian Canvas → HTML Konverter (Erweiterte Version)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Beispiele:
  python canvas_to_html.py mein_canvas.canvas
  python canvas_to_html.py mein_canvas.canvas ausgabe.html --light
  python canvas_to_html.py mein_canvas.canvas --export-images
  python canvas_to_html.py *.canvas --multi --output combined.html
        """
    )

    parser.add_argument('files', nargs='+', help='.canvas Datei(en)')
    parser.add_argument('-o', '--output', help='Ausgabe HTML-Datei')
    parser.add_argument('--multi', action='store_true',
                        help='Mehrere Canvas-Dateien in einer HTML-Seite kombinieren')
    parser.add_argument('--export-images', action='store_true',
                        help='Bilder in separaten Ordner exportieren statt Base64')
    parser.add_argument('--light', action='store_true',
                        help='Light Mode als Standard verwenden')
    parser.add_argument('--vault', help='Pfad zum Obsidian Vault (für Dateireferenzen)',
                        default=None)

    args = parser.parse_args()

    # Canvas-Dateien finden
    canvas_files = []
    for pattern in args.files:
        matched = glob.glob(pattern)
        if matched:
            canvas_files.extend(matched)
        elif os.path.isfile(pattern):
            canvas_files.append(pattern)
        else:
            print(f"⚠  Datei nicht gefunden: {pattern}")

    if not canvas_files:
        print("❌ Keine .canvas Dateien gefunden.")
        sys.exit(1)

    canvas_files = [f for f in canvas_files if f.endswith('.canvas')]
    if not canvas_files:
        print("❌ Keine .canvas Dateien in der Auswahl.")
        sys.exit(1)

    print(f"📂 {len(canvas_files)} Canvas-Datei(en) gefunden:")
    for cf in canvas_files:
        print(f"   • {cf}")

    # Vault-Pfad bestimmen
    vault_path = args.vault
    if not vault_path:
        # Versuche den Vault automatisch zu finden
        test_path = os.path.dirname(os.path.abspath(canvas_files[0]))
        while test_path != os.path.dirname(test_path):
            if os.path.isdir(os.path.join(test_path, '.obsidian')):
                vault_path = test_path
                break
            test_path = os.path.dirname(test_path)
        if not vault_path:
            vault_path = os.path.dirname(os.path.abspath(canvas_files[0]))

    print(f"🗂  Vault-Pfad: {vault_path}")

    # Export-Verzeichnis
    export_dir = None
    if args.export_images:
        output_base = args.output or canvas_files[0].replace('.canvas', '.html')
        export_dir = os.path.splitext(output_base)[0] + '_images'
        os.makedirs(export_dir, exist_ok=True)
        print(f"🖼  Bilder werden exportiert nach: {export_dir}")

    # Canvas-Dateien parsen
    canvases = []
    for cf in canvas_files:
        try:
            canvas = parse_canvas_file(cf)
            canvases.append(canvas)
            print(f"   ✅ {canvas.name}: {len(canvas.nodes)} Knoten, {len(canvas.edges)} Kanten")
        except Exception as e:
            print(f"   ❌ Fehler bei {cf}: {e}")

    if not canvases:
        print("❌ Keine Canvas-Dateien konnten geladen werden.")
        sys.exit(1)

    # Wenn nicht --multi, nur die erste Datei verwenden
    if not args.multi:
        canvases = canvases[:1]

    # HTML generieren
    print("\n🔧 Generiere HTML...")
    dark_mode = not args.light
    html = generate_html(canvases, vault_path, export_dir, dark_mode)

    # Ausgabedatei
    output_file = args.output
    if not output_file:
        if args.multi:
            output_file = 'combined_canvas.html'
        else:
            output_file = os.path.splitext(canvas_files[0])[0] + '.html'

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(html)

    file_size = os.path.getsize(output_file) / 1024
    print(f"\n✅ HTML-Datei erstellt: {output_file} ({file_size:.1f} KB)")
    print(f"   Öffne die Datei in einem Browser, um das Canvas zu sehen.")
    print(f"\n⌨  Tastenkürzel in der HTML-Ansicht:")
    print(f"   +/-       Zoom")
    print(f"   0         Zoom zurücksetzen")
    print(f"   F         Alles einpassen")
    print(f"   Strg+F    Suche fokussieren")
    print(f"   Mausrad   Zoom")
    print(f"   Drag       Pan (auf Hintergrund)")
    print(f"   Drag Node  Knoten verschieben")

if __name__ == '__main__':
    main()