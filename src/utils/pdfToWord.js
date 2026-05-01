import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, SectionType, AlignmentType } from 'docx';
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
      const viewport = page.getViewport({ scale: 1.0 });
      const textContent = await page.getTextContent();
      const items = textContent.items;

      if (items.length === 0) {
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: `[Page ${pageNum} contains no extractable text.]`, italic: true, color: "888888" })]
        }));
        continue;
      }

      // Sort items by Y descending (top to bottom), then X ascending (left to right)
      items.sort((a, b) => {
        const yDiff = b.transform[5] - a.transform[5];
        if (Math.abs(yDiff) > 3) return yDiff;
        return a.transform[4] - b.transform[4];
      });

      let currentLineY = items[0].transform[5];
      let lineItems = [];
      
      const processLine = (itemsInLine) => {
        if (itemsInLine.length === 0) return;

        // Calculate alignment based on first item's X
        const firstX = itemsInLine[0].transform[4];
        const pageWidth = viewport.width;
        let alignment = AlignmentType.LEFT;
        
        // Simple heuristic for centering
        const lineContent = itemsInLine.map(i => i.str).join('');
        if (firstX > pageWidth * 0.25 && lineContent.length < 50) {
           // Might be centered or right-aligned
           if (firstX > pageWidth * 0.5) alignment = AlignmentType.RIGHT;
           else alignment = AlignmentType.CENTER;
        }

        const runs = itemsInLine.map(item => {
          // Calculate font size: scale factor in transform
          // scale factor is often transform[0] or transform[3]
          const fontSizeInPoints = Math.abs(item.transform[0]);
          
          // Detect bold/italic from font name
          const fontName = (item.fontName || "").toLowerCase();
          const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy');
          const isItalic = fontName.includes('italic') || fontName.includes('oblique');

          return new TextRun({
            text: item.str,
            size: fontSizeInPoints * 2, // docx expects half-points
            bold: isBold,
            italics: isItalic,
          });
        });

        docChildren.push(new Paragraph({
          children: runs,
          alignment: alignment,
          spacing: {
            before: 120, // Add some default spacing
            after: 120,
          }
        }));
      };

      items.forEach((item, index) => {
        const y = item.transform[5];
        
        if (Math.abs(y - currentLineY) > 3) {
          processLine(lineItems);
          lineItems = [item];
          currentLineY = y;
        } else {
          // Check for horizontal spacing
          if (lineItems.length > 0) {
            const lastItem = lineItems[lineItems.length - 1];
            const gap = item.transform[4] - (lastItem.transform[4] + lastItem.width);
            if (gap > 5) {
               lineItems.push({ str: ' ', transform: item.transform, fontName: item.fontName });
            }
          }
          lineItems.push(item);
        }

        if (index === items.length - 1) {
          processLine(lineItems);
        }
      });

      if (pageNum < numPages) {
        // We use a manual break or just start a new page
        // docx Section handles pages, but we can add page break runs
        docChildren.push(new Paragraph({
          children: [new TextRun({ text: "", break: 1 })]
        }));
      }
    }

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: 720, // 0.5 inch
              right: 720,
              bottom: 720,
              left: 720,
            },
          },
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
