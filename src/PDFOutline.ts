import { outlinePdfFactory } from "../node_modules/@lillallol/outline-pdf/dist/index.esm.js";
import { PDFDocument, PDFPageLeaf, PDFDict, PDFString, PDFArray, PDFName, PDFNull, PDFNumber, PDFRef, toCodePoint, componentsToColor, } from 'pdf-lib'
import * as pdfLib from 'pdf-lib'

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