# Canvas to HTML — Obsidian Plugin

Exportiert Obsidian Canvas-Dateien als vollständig eigenständige, interaktive HTML-Seiten.

---

## Features

- **100 % portabel** — keine externen Abhängigkeiten, eine einzige HTML-Datei
- **Alle Knotentypen** — Text, Dateien, Links, Bilder, Gruppen
- **Verbindungen erhalten** — SVG-Pfade mit Pfeilspitzen zwischen allen Knoten
- **Markdown-Support** — Überschriften, Listen, Code-Blöcke, Blockquotes, Tabellen, Aufgaben
- **Inline-Formatierung** — Bold, Kursiv, Strikethrough, ==Hervorhebung==, Tags, Links
- **Dark / Light Mode** — Toggle-Button, automatische Erkennung
- **Zoom & Pan** — Mausrad zum Zoomen, Klicken+Ziehen zum Verschieben
- **Suche** — Inhaltssuche mit Highlight und Navigation (Ctrl+F)
- **Minimap** — Kleinübersicht mit Klick-Navigation
- **Drag & Drop** — Knoten direkt in der HTML-Datei verschieben
- **Link-Vorschau** — Buttons zum Ein-/Ausblenden eingebetteter Webseiten

---

## Installation

### Automatisch (Empfohlen)

1. Öffne **Community Plugins** in den Obsidian-Einstellungen
2. Suche nach **"Canvas to HTML"**
3. Aktiviere das Plugin

### Manuell

1. Lade die neueste `main.js` und `manifest.json` aus dem Release herunter
2. Lege sie in `DeinVault/.obsidian/plugins/canvas-exporter/` ab
3. Aktiviere das Plugin in den Community Plugins

### Aus dem Quellcode bauen

```bash
git clone https://github.com/dein-user/canvas-exporter.git
cd canvas-exporter
npm install
npm run build    # für Entwicklungsversion
npm run build -- --production   # für Produktion