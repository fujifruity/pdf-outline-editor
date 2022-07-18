# PDF Outline Editor

(Hosted on [Github-Pages](https://fujifruity.github.io/pdf-outline-editor))

A web app that creates and modifies PDF outline (table of contents).  It never uploads PDF to anywhere because it processes PDF in-browser.

![PDF document outline](src/lets-create-this.png)

## Note

- It may fail to read outline written by another app since outline data structure is very specific to editor app such as Adobe Acrobat DC.
- It uses [outline-pdf](https://github.com/lillallol/outline-pdf) for writing outline, [pdf-lib](https://pdf-lib.js.org/) for reading outline.