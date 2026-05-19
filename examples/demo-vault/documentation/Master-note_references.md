This "master"-note is set up to show the different possibilities of referencing other notes or at least parts of them and how this master-note then appears in the html-export of the canvas-file. 
# Reference other notes fully
Reference the "Misc."-note from the left side of the canvas:

[[Misc.]]
 
# Reference only heading-part of a note
Now we only reference the "Tables"-part of the "Misc."-note which is a h2-heading:

[[Misc.#Tables]]

# Reference only block of a note
Finally we only reference the integral of the "Math"-note. Therefore the integral has a block ID:

[[Math#^a1a814]]

> It is worth mentioning a small technical detail: 
> the block ID is not visible (it does not even exist) in the "Math"-note nor in the HTML representation, because block IDs are not included in the export.
> As a result: when following the link to the corresponding note, the referenced part cannot be highlighted as it is for heading references.

# Reference an "external" note
"External" means the note is used nowhere else in this canvas. So this note has to be additionally saved in the assets folder to be included in the export.
[[External note]]
