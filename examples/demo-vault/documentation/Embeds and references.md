Obsidian allows different ways to embed notes or only parts of them:
+ note as whole, referenced by filename
+ heading block, referenced by \#h1...6
+ blocks, referenced by block IDs as \^id
and all of these can similarly be used in canvas files and will be equally transferred to the HTML pages.
##### Remember: 
* **referencing** is just linking a note (or parts of it) in the master-note. The referenced content is not directly shown in the master-note. To read the content, one needs to open the linked note via the link provided.
* **embedding** is done the same way, but starts with an exclamation mark as first character of the link. But the main difference is, that the linked content is directly visible in the master-note as if it is written in there. 

To use references or content embedding, this plugin uses the standard Obsidian Markdown notation. There is no "behind the scenes" logic or trick. So you do not need to change anything in your existing notes or write new notes in any other way than you did before.
