# Canvas to HTML

Stabile Arbeitsbasis für ein Obsidian-Plugin, das `.canvas`-Dateien als eigenständige HTML-Dateien exportiert.

## Aktueller Stand

Diese überarbeitete Version ist bewusst reduziert und soll vor allem zuverlässig funktionieren.

Unterstützt werden derzeit:

- Export der **aktiven Canvas-Datei** als HTML
- einfache Darstellung von
  - Text-Knoten
  - Gruppen-Knoten
  - Link-Knoten
  - Datei-Knoten
- Kanten zwischen Knoten
- schlichtes Zoom im exportierten HTML
- ein einfaches Einstellungs-Panel
- Export von Markdown-Dateiknoten als HTML-Unterseiten
- Rewrite interner Links und Wiki-Links in exportierten Markdown-Seiten
- Kopie von Bildern und Dateien nach `assets/images` bzw. `assets/files`
- Markdown-Vorschau in Datei-Knoten
- defensivere Validierung und Normalisierung von Canvas-JSON, Nodes und Edges vor dem Export

Noch **nicht** stabil umgesetzt und deshalb bewusst entfernt oder nicht mehr behauptet:

- eingebettete Webseiten
- Minimap
- Suche
- Drag & Drop im Export
- echte Bild-Einbettung als Base64
- vollständige Unterstützung aller denkbaren Canvas-Sonderfälle

## Warum diese Fassung?

Die vorherige Version hatte bereits gute Ansätze, war aber an mehreren Stellen noch prototypisch. Ziel dieser Fassung ist eine verlässliche Grundlage, auf der man sauber weiterentwickeln kann.

## Bedienung

Nach dem Aktivieren des Plugins steht folgender Command zur Verfügung:

- **Export: Aktuelles Canvas als HTML speichern**

Die erzeugten HTML-Dateien werden in den eingestellten Ausgabeordner im Vault geschrieben.

Pro Canvas wird ein portables Export-Paket erzeugt. Je nach Inhalt enthält es:

- `index.html` für die Canvas-Ansicht
- `assets/images` für exportierte Bilder
- `assets/files` für sonstige Dateien
- zusätzliche HTML-Unterseiten für Markdown-Dateien, falls solche als Dateiknoten referenziert werden

## Entwicklung

```bash
npm install
npm run build
npm test
```

Für die Entwicklung mit Watch-Modus:

```bash
npm run dev
```

## Nächste sinnvolle Schritte

1. automatisierte Export-Regressionstests für Markdown-, Link- und Asset-Fälle
2. echte Behandlung weiterer Bild- und Medien-Sonderfälle
3. relative Ressourcenpfade noch robuster machen
4. optionale Vorschau im Browser
5. später zusätzliche Interaktivität gezielt wieder einbauen
