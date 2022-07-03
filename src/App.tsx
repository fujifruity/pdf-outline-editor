import React, { SyntheticEvent, useRef, useState } from 'react';
import letsCreateThis from './lets-create-this.png';
import './App.css';
import { outlinePdfFactory } from "../node_modules/@lillallol/outline-pdf/dist/index.esm.js";
import { PDFDocument, PDFPageLeaf, PDFDict, PDFString, PDFArray, PDFName, PDFNull, PDFNumber, PDFRef, toCodePoint, componentsToColor, } from 'pdf-lib'
import * as pdfLib from 'pdf-lib'

const App = () => (
  <div className="App">
    <header className="App-header">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.css" />
      <h1>PDF Outline Editor</h1>
      <img src={letsCreateThis} alt="highlight what's outline" />
      <OutlineForm />
      <a href="https://github.com/fujifruity/pdf-outline" target="_blank" rel="noopener noreferrer" >
        Go to github
      </a>
    </header>
  </div>
);


const OutlineForm = () => {
  const defaultOutline = `3||Example Chapter 1
4|-|Example Section 1.1
5|--|Example Subsection 1.1.1
7|--|Example Subsection 1.1.2
9||Example Chapter 2
`
  const [outline, setOutline] = useState(defaultOutline);
  const [pdfOutline, setPdfOutline] = useState<PDFOutline>();
  const [errorMsg, setErrorMsg] = useState('');
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const pdfOutline = await PDFOutline.CreateAsync(e.target.files[0])
      setPdfOutline(pdfOutline)
      setOutline(pdfOutline.readOutline())
      setErrorMsg('')
    }
  }
  const handleSubmit = () => {
    pdfOutline?.writeOutline(outline).catch((error) => {
      if (error instanceof Error) setErrorMsg(error.message)
    })
  }
  const handleTextAreaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = '30px'
    e.target.style.height = e.target.scrollHeight + 'px';
    setOutline(e.target.value ?? '')
  };

  return (
    <div >
      <label htmlFor="load" >1. Load PDF</label>
      <input name="load" type="file" accept=".pdf" onChange={handleChange} />
      <label htmlFor="edit" >2. Edit outline</label>
      <textarea name="edit" className="text-area" value={outline} onInput={handleTextAreaInput}  ></textarea>
      <label htmlFor="write" >3. Write to PDF</label>
      <button name="write" onClick={handleSubmit} >Write</button>
      <p className='error-msg'>{errorMsg}</p>
    </div>
  )
}

class PDFOutline {
  pdfDoc: PDFDocument;
  file: File;
  private constructor(pdfDoc: PDFDocument, file: File) {
    this.pdfDoc = pdfDoc
    this.file = file
  }
  public static CreateAsync = async (f: File) => {
    const arrayBuffer = await f.arrayBuffer()
    const pdfDoc = await PDFDocument.load(
      new Uint8Array(arrayBuffer)
    )
    return new PDFOutline(pdfDoc, f);
  };

  getDict = (ref: PDFRef) => this.pdfDoc.context.lookup(ref) as PDFDict;
  getOutlineDictRef = (): PDFRef => this.pdfDoc.catalog.get(PDFName.of('Outlines')) as PDFRef;
  getOutlineDict = () => this.getDict(this.getOutlineDictRef());
  getOutlineItemRefs() {
    const outlineDict = this.getOutlineDict()
    const count = outlineDict.get(PDFName.of('Count')) as PDFNumber
    const firstOutlineRef = outlineDict.get(PDFName.of('First')) as PDFRef
    return [...Array(count.asNumber()).keys()].map(n =>
      PDFRef.of(n + firstOutlineRef.objectNumber)
    )
  }
  getPageRefs() {
    const refs: PDFRef[] = [];
    this.pdfDoc.catalog.Pages().traverse((kid, ref) => {
      if (kid instanceof PDFPageLeaf) refs.push(ref);
    });
    return refs;
  }

  getDepth(outlineItemRef: PDFRef): number {
    const parentRef = this.getDict(outlineItemRef).get(PDFName.of('Parent')) as PDFRef
    if (parentRef == this.getOutlineDictRef()) return 0
    return 1 + this.getDepth(parentRef)
  }

  readOutline() {
    return this.getOutlineItemRefs().map(outlineItemRef => {
      const outline = this.getDict(outlineItemRef)
      const title = outline.get(PDFName.Title) as PDFString
      const dest = outline.get(PDFName.of('Dest')) as PDFArray
      const destRef = dest.get(0) as PDFRef
      const pageRefs = this.getPageRefs()
      const pageNum = pageRefs.indexOf(destRef) + 1
      const depth = this.getDepth(outlineItemRef)
      return `${pageNum}|${'-'.repeat(depth)}|${title.decodeText()}`
    }).join('\n')
  }

  deleteOutline() {
    const outlineDictRef = this.getOutlineDictRef();
    this.getOutlineItemRefs().forEach(ref => this.pdfDoc.context.delete(ref))
    this.pdfDoc.context.delete(outlineDictRef);
  }

  /**
   * 
   * @param outline String representation of the outline
   */
  async writeOutline(outline: string) {
    const outlinePdf = outlinePdfFactory(pdfLib);
    const outlinedPdf: Uint8Array = await outlinePdf({ outline, pdf: this.pdfDoc }).then(pdfDoc => pdfDoc.save());
    const filename = this.file.name.replace(/\.pdf$/, '.outline.pdf')
    this.download(outlinedPdf, filename)
  }

  // https://stackoverflow.com/a/30832210/5380904
  download(data: BlobPart, filename: string) {
    var file = new Blob([data]);
    var a = document.createElement("a"),
      url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

}

export default App;
