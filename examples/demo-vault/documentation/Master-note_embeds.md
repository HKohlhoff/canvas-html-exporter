This "master"-note is set up to show the different possibilities of embedding other notes or at least parts of them and how this master-note then appears in the html-export of the canvas-file. 
# Embed other notes fully
Embed the full "Misc."-note from the left side of the canvas:

---
🚀  The embed starts here

![[Misc.]]

🏁 Here the embed ends. 

--- 
# Embed only heading-part of a note
Now we only embed the "Tables"-part of the "Misc."-note which is a h2-heading:

![[Misc.#Tables]]

# Embed only block of a note
Finally we embed only the integral of the "Math"-note. Therefore the integral has a block ID:

![[Math#^a1a814]]

Embedding complete.

> It is worth mentioning a small technical detail: 
> the block ID is not visible in the "Math"-note nor in the HTML representation.

# Embed from an "external" note
"External" means the note is used nowhere else in this canvas. So this note has to be additionally saved in the assets folder to be included in the export.

---
🚀  The embed starts here

![[External note#^36b28c]]

🏁 Here the embed ends.  

--- 
