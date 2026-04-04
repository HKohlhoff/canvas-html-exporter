# Alle Features im Überblick

## Interaktion in der HTML-Ausgabe
**Zoom & Pan** — Mausrad zum Zoomen, Drag auf dem Hintergrund zum Verschieben. Die Steuerung funktioniert wie in einer professionellen Canvas-App mit Trägheit und sanften Übergängen.

**Drag & Drop** — Jeder Knoten (außer Gruppen) kann per Maus verschoben werden. Beim Ziehen wird der Knoten halbtransparent mit verstärktem Schatten dargestellt.
Suche — Die Suchleiste oben in der Mitte durchsucht alle Knoteninhalte. Treffer werden mit einem pulsierenden blauen Rahmen hervorgehoben und das Canvas scrollt automatisch zum ersten Ergebnis.

**Minimap** — Unten rechts zeigt eine kleine Übersichtskarte alle Knoten und den aktuellen Viewport-Ausschnitt. Klick auf die Minimap navigiert sofort dorthin.

**Screenshot** — Der Kamera-Button exportiert das Canvas als SVG-Datei zum Download.

**Dark/Light Mode** — Über den Mond/Sonnen-Button oben links jederzeit umschaltbar, alle CSS-Variablen werden live aktualisiert.

## Tastenkürzel

| Taste | Funktion |
|---|---|
| `+` / `-` | Zoomen |
| `0` | Zoom zurücksetzen |
| `F` | Alles einpassen |
| `Strg+F` | Suche fokussieren |

## Kommandozeilen-Optionen

### Einfache Konvertierung (Dark Mode)  
python canvas_to_html.py mein_canvas.canvas

### Light Mode
python canvas_to_html.py mein_canvas.canvas --light

### Bilder in separaten Ordner exportieren
python canvas_to_html.py mein_canvas.canvas --export-images

### Eigene Ausgabedatei
python canvas_to_html.py mein_canvas.canvas -o meine_seite.html

### Vault-Pfad explizit angeben (für Dateireferenzen)
python canvas_to_html.py mein_canvas.canvas --vault ~/Documents/MeinVault

### Mehrere Canvas-Dateien in einer HTML
python canvas_to_html.py *.canvas --multi -o alle_canvas.html

## Was wird alles korrekt konvertiert?
**Knoten-Typen**: Text, Dateireferenzen (.md, Bilder, PDFs), Links (mit iframe-Embed), Gruppen, Bilder.

**Markdown**: Überschriften, Bold/Italic/Strikethrough, Highlight (==text==), Code (inline & Blöcke mit Syntax-Klasse), Tabellen, Checklisten, Blockquotes, Listen (verschachtelt), Bilder, interne Links ([[Link]]), externe Links, Fußnoten, Tags (#tag), horizontale Linien.

**Verbindungen**: Bézier-Kurven mit richtungsabhängigen Kontrollpunkten, Pfeilspitzen an beiden Enden konfigurierbar, Kanten-Labels, individuelle Farben.

**Farben**: Alle 6 Obsidian-Farbcodes (1–6) sowie benutzerdefinierte Hex-Farben werden als farbiger linker Rand und subtiler Hintergrund-Gradient dargestellt.