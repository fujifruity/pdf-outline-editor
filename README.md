# PDF Outline Editor

(Hosted on [Github-Pages](https://fujifruity.github.io/pdf-outline-editor))

An web app allows you to edit PDF's "document outline" (below). It never uploads PDF file to anywhere because it processes PDF in-browser.

![PDF document outline](src/lets-create-this.png)

## Note

- Cannot read outline written by another app in most cases, since outline data structure is very specific to editor app, such as Adobe Acrobat DC.
- Uses [outline-pdf](https://github.com/lillallol/outline-pdf) for writing outline, [pdf-lib](https://pdf-lib.js.org/) for reading outline.