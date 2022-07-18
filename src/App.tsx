import React, { useEffect, useRef, useState } from 'react';
import letsCreateThis from './lets-create-this.png';
import './App.css';
import { PDFOutline } from './PDFOutline';

const App = () => (
  <div className="App">
    <header className="App-header">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.css" />
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/milligram/1.4.1/milligram.css" />
    </header>
    <h1>PDF Outline Editor</h1>
    <img src={letsCreateThis} alt="showing what is outline" />
    <OutlineForm />
    <a href="https://github.com/fujifruity/pdf-outline-editor/tree/master" target="_blank" rel="noopener noreferrer" >
      Go to github
    </a>
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
    <div className="OutlineForm" >
      <label htmlFor="load" >1. Load PDF</label>
      <input name="load" type="file" accept=".pdf" onChange={handleLoad} />
      <label htmlFor="edit" >2. Edit outline</label>
      <span>Line format: "page number | depth | title"</span>
      <textarea
        ref={textArea}
        name="edit"
        value={outline}
        style={{ height: height }}
        onChange={handleInput} ></textarea>
      <label htmlFor="write" >3. Write to PDF</label>
      <button name="write" onClick={handleWrite} >Write</button>
      <p ref={errorMsgArea} className='error-msg'>{errorMsg}</p>
    </div>
  )
}

export default App;
