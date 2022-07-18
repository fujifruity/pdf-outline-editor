import * as fs from "fs";
import { render, screen } from '@testing-library/react';
import App from './App';
import { PDFOutline } from './PDFOutline';

// test('renders learn react link', () => {
//   render(<App />);
//   const linkElement = screen.getByText(/learn react/i);
//   expect(linkElement).toBeInTheDocument();
// });

describe('PdfOutline.readOutline', () => {
  it("just print pdf outline", async () => {
    const pdf = fs.readFileSync("test7.outline.pdf", { encoding: "base64" });
    const pdfOutline = await PDFOutline.CreateAsync(pdf)
    console.log(pdfOutline.readOutline())
  });
});