This "master"-note is set up to show the different possibilities of referencing other notes or at least parts of them and how this master-note then appears in the html-export of the canvas-file. 
# Reference other notes fully
Reference the "Misc."-note from the left side of the canvas:

[[Misc.]]
 
# Reference only heading-part of a note
Now we only reference the "Tables"-part of the "Misc."-note which is a h2-heading:

[[Misc.#Tables]]

# Reference only block of a note
Finally we only reference the integral of the "Math"-note. Therefore the integral has got an blockid:

[[Math#^a1a814]]

> It is worth mentioning a small technical detail: 
> the blockid is not visible (not even existing) in the "Math"-note nor in the html-representation, because blockids are not included in the export.  
> As a result: when following the link to the corresponding note the referenced part can not be highlighted as it is in case for heading-references. 

# Reference an "external" note
"External" means the note is used nowhere else in this canvas. So this note as to be  additionally saved in the assets-folder for being contained in the export. 
[[External note]]
