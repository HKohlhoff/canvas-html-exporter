# Canvas to HTML

Stabile Arbeitsbasis für ein Obsidian-Plugin, das `.canvas`-Dateien als eigenständige HTML-Dateien exportiert.

## Aktueller Stand

Diese überarbeitete Version ist bewusst reduziert und soll vor allem zuverlässig funktionieren.

Unterstützt werden derzeit:

- Export der **aktiven Canvas-Datei** als HTML
- Export **aller Canvas-Dateien** im Vault
- einfache Darstellung von
  - Text-Knoten
  - Gruppen-Knoten
  - Link-Knoten
  - Datei-Knoten
- Kanten zwischen Knoten
- schlichtes Zoom im exportierten HTML
- ein einfaches Einstellungs-Panel

Noch **nicht** stabil umgesetzt und deshalb bewusst entfernt oder nicht mehr behauptet:

- echte Live-Vorschau in Obsidian
- eingebettete Webseiten
- Minimap
- Suche
- Drag & Drop im Export
- echte Bild-Einbettung als Base64
- vollständige Unterstützung aller denkbaren Canvas-Sonderfälle

## Warum diese Fassung?

Die vorherige Version hatte bereits gute Ansätze, war aber an mehreren Stellen noch prototypisch. Ziel dieser Fassung ist eine verlässliche Grundlage, auf der man sauber weiterentwickeln kann.

## Bedienung

Nach dem Aktivieren des Plugins stehen zwei Commands zur Verfügung:

- **Export: Aktuelles Canvas als HTML speichern**
- **Export: Alle Canvas-Dateien als HTML speichern**

Die erzeugten HTML-Dateien werden in den eingestellten Ausgabeordner im Vault geschrieben.

## Entwicklung

```bash
npm install
npm run build
```

Für die Entwicklung mit Watch-Modus:

```bash
npm run dev
```

## Nächste sinnvolle Schritte

1. echte Behandlung von Bild-Dateiknoten
2. bessere Markdown-Unterstützung
3. relative Ressourcenpfade robuster machen
4. optionale Vorschau im Browser
5. später zusätzliche Interaktivität gezielt wieder einbauen
