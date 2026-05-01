import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, SectionType } from 'docx';
import { saveFile } from './fileSaver';

// Setup PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const convertPdfToWord = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const docChildren = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = textContent.items;

      if (items.length === 0) {
        // Fallback for scanned pages: inform the user or use OCR (which we don't have client-side easily)
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `[Page ${pageNum} contains no extractable text. It might be a scanned image.]`, italic: true, color: "888888" })]
        }));
        continue;
      }

      // Sort items: Y coordinate descending (top to bottom), then X coordinate ascending (left to right)
      // item.transform: [scaleX, skewY, skewX, scaleY, transformX, transformY]
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 5) { // Threshold for being on the same line
          return yDiff;
        }
        return a.transform[4] - b.transform[4];
      });

      let currentLineY = items[0].transform[5];
      let currentLineText = "";
      
      items.forEach((item, index) => {
        const y = item.transform[5];
        
        if (Math.abs(y - currentLineY) > 5) {
          // New line detected
          docChildren.push(new Paragraph({
            children: [new TextRun(currentLineText.trim())]
          }));
          currentLineText = item.str;
          currentLineY = y;
        } else {
          // Same line
          // Add space if there's a gap between items
          if (currentLineText && !currentLineText.endsWith(' ') && !item.str.startsWith(' ')) {
             currentLineText += " ";
          }
          currentLineText += item.str;
        }

        // Add the last line of the page
        if (index === items.length - 1) {
          docChildren.push(new Paragraph({
            children: [new TextRun(currentLineText.trim())]
          }));
        }
      });

      // Add a page break if not the last page
      if (pageNum < numPages) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: "", break: 1 })]
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          type: SectionType.CONTINUOUS,
        },
        children: docChildren,
      }],
    });

    const docxBlob = await Packer.toBlob(doc);
    await saveFile(docxBlob, file.name.replace('.pdf', '.docx'));
  } catch (error) {
    console.error('Error converting PDF to Word:', error);
    throw error;
  }
};
