import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun, SectionType, AlignmentType, HeadingLevel } from 'docx';
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

      let currentParagraphItems = [];
      let lastY = items[0].transform[5];
      let lastLineY = items[0].transform[5];

      const createParagraph = (itemsInPara) => {
        if (itemsInPara.length === 0) return;

        // Group into lines to detect alignment and structure
        const lines = [];
        let currentLine = [];
        let lineY = itemsInPara[0].transform[5];
        
        itemsInPara.forEach(item => {
          if (Math.abs(item.transform[5] - lineY) > 3) {
            lines.push(currentLine);
            currentLine = [item];
            lineY = item.transform[5];
          } else {
            currentLine.push(item);
          }
        });
        if (currentLine.length > 0) lines.push(currentLine);

        // Detect Alignment from the first line
        const firstLine = lines[0];
        const firstX = firstLine[0].transform[4];
        const pageWidth = viewport.width;
        let alignment = AlignmentType.LEFT;
        
        // Better centering detection
        if (firstX > pageWidth * 0.2) {
           const lineText = firstLine.map(i => i.str).join('');
           if (lineText.length < 60) {
              if (firstX > pageWidth * 0.4) alignment = AlignmentType.CENTER;
              if (firstX > pageWidth * 0.6) alignment = AlignmentType.RIGHT;
           }
        }

        // Detect Heading Level
        const avgFontSize = itemsInPara.reduce((acc, i) => acc + Math.abs(i.transform[0]), 0) / itemsInPara.length;
        let heading = undefined;
        if (avgFontSize > 18) heading = HeadingLevel.HEADING_1;
        else if (avgFontSize > 14) heading = HeadingLevel.HEADING_2;

        const runs = [];
        itemsInPara.forEach((item, idx) => {
          const fontSize = Math.abs(item.transform[0]);
          const fontName = (item.fontName || "").toLowerCase();
          const isBold = fontName.includes('bold') || fontName.includes('black') || avgFontSize > 14;
          const isItalic = fontName.includes('italic') || fontName.includes('oblique');

          // Add space if there's a horizontal gap
          if (idx > 0) {
             const prevItem = itemsInPara[idx - 1];
             const isSameLine = Math.abs(item.transform[5] - prevItem.transform[5]) < 3;
             if (isSameLine) {
                const gap = item.transform[4] - (prevItem.transform[4] + prevItem.width);
                if (gap > 2 && !prevItem.str.endsWith(' ') && !item.str.startsWith(' ')) {
                   runs.push(new TextRun(" "));
                }
             } else {
                // Manual line break if they are in the same paragraph but different lines
                runs.push(new TextRun({ text: "", break: 1 }));
             }
          }

          runs.push(new TextRun({
            text: item.str,
            size: fontSize * 2,
            bold: isBold,
            italics: isItalic,
          }));
        });

        docChildren.push(new Paragraph({
          children: runs,
          alignment: alignment,
          heading: heading,
          spacing: {
            before: 200,
            after: 200,
            line: 360, // 1.5 line spacing
          }
        }));
      };

      items.forEach((item, index) => {
        const y = item.transform[5];
        const yGap = Math.abs(y - lastLineY);
        
        // If the vertical gap is small, keep it in the same paragraph
        // Typical line height is ~12-15 points. Gap > 20 usually means new paragraph.
        if (yGap > 25 && index > 0) {
          createParagraph(currentParagraphItems);
          currentParagraphItems = [item];
        } else {
          currentParagraphItems.push(item);
        }
        
        if (Math.abs(y - lastLineY) > 3) {
           lastLineY = y;
        }
        
        if (index === items.length - 1) {
          createParagraph(currentParagraphItems);
        }
      });

      if (pageNum < numPages) {
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
              top: 1440, // 1 inch
              right: 1440,
              bottom: 1440,
              left: 1440,
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
