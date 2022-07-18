import React, { useEffect, useRef, useState } from 'react';
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
      <img src={letsCreateThis} alt="showing what is outline" />
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
  const [filename, setFilename] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [height, setHeight] = useState(30);

  const handleLoad = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const pdf = await e.target.files[0].arrayBuffer()
      const pdfOutline = await PDFOutline.CreateAsync(pdf)
      setPdfOutline(pdfOutline)
      setOutline(pdfOutline.readOutline())
      setFilename(e.target.files[0].name)
      setErrorMsg('')
    }
  }

  const textArea = useRef<HTMLTextAreaElement>(null);
  const handleInput = () => {
    setOutline(textArea.current?.value ?? '')
  };
  // Update textarea's height when its content is modified.
  useEffect(() => {
    setHeight(textArea?.current?.scrollHeight ?? 30)
  });

  const errorMsgArea = useRef<HTMLParagraphElement>(null);
  const handleWrite = () => {
    pdfOutline?.writeOutline(outline, filename).catch((error) => {
      if (error instanceof Error) {
        setErrorMsg(error.message)
        errorMsgArea.current?.scrollIntoView({ behavior: "smooth" })
      }
    })
  }

  return (
    <div >
      <label htmlFor="load" >1. Load PDF</label>
      <input name="load" type="file" accept=".pdf" onChange={handleLoad} />
      <label htmlFor="edit" >2. Edit outline</label>
      <textarea
        ref={textArea}
        name="edit"
        className="text-area"
        value={outline}
        style={{ height: height }}
        onChange={handleInput} ></textarea>
      <label htmlFor="write" >3. Write to PDF</label>
      <button name="write" onClick={handleWrite} >Write</button>
      <p ref={errorMsgArea} className='error-msg'>{errorMsg}</p>
    </div>
  )
}

export class PDFOutline {
  pdfDoc: PDFDocument;

  private constructor(pdfDoc: PDFDocument) {
    this.pdfDoc = pdfDoc
  }
  public static CreateAsync = async (pdf: string | Uint8Array | ArrayBuffer) => {
    const pdfDoc = await PDFDocument.load(pdf)
    return new PDFOutline(pdfDoc);
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
    return this.getOutlineItemRefs()
      .map(ref => {
        const outline = this.getDict(ref)
        const title = outline.get(PDFName.Title) as PDFString
        const dest = outline.get(PDFName.of('Dest')) as PDFArray
        const destRef = dest.get(0) as PDFRef
        const pageNum = this.getPageRefs().indexOf(destRef) + 1
        const depth = this.getDepth(ref)
        return ({ pageNum: pageNum, depth: depth, title: title })
      }).sort((a, b) => a.pageNum - b.pageNum)
      .map(item =>
        `${item.pageNum}|${'-'.repeat(item.depth)}|${item.title.decodeText()}`
      ).join('\n')
  }

  deleteOutline() {
    const outlineDictRef = this.getOutlineDictRef();
    this.getOutlineItemRefs().forEach(ref => this.pdfDoc.context.delete(ref))
    this.pdfDoc.context.delete(outlineDictRef);
  }

  /**
   * @param outline String representation of the outline
   */
  async writeOutline(outline: string, filename: string) {
    const outlinePdf = outlinePdfFactory(pdfLib);
    const outlinedPdf: Uint8Array = await outlinePdf({ outline, pdf: this.pdfDoc }).then(pdfDoc => pdfDoc.save());
    const newFilename = filename.replace(/\.pdf$/, '.outline.pdf')
    this.download(outlinedPdf, newFilename)
  }

  download(data: BlobPart, filename: string) {
    const file = new Blob([data]);
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  }

}

export default App;
