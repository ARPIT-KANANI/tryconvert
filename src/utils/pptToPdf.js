import JSZip from 'jszip';
import { jsPDF } from 'jspdf';
import { saveFile } from './fileSaver';

export const convertPptToPdf = async (file) => {
  try {
    const zip = await JSZip.loadAsync(file);
    const pdf = new jsPDF();
    
    // 1. Find all slides
    const slideEntries = Object.keys(zip.files).filter(path => path.startsWith('ppt/slides/slide') && path.endsWith('.xml'));
    slideEntries.sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0]);
      const numB = parseInt(b.match(/\d+/)[0]);
      return numA - numB;
    });

    if (slideEntries.length === 0) {
      throw new Error("No slides found in the PowerPoint file.");
    }

    let cursorY = 20;

    for (let i = 0; i < slideEntries.length; i++) {
      if (i > 0) pdf.addPage();
      
      const slideXml = await zip.file(slideEntries[i]).async('string');
      
      // Very basic text extraction from Slide XML
      // Looking for <a:t> elements which contain text in OpenXML
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(slideXml, "text/xml");
      const textNodes = xmlDoc.getElementsByTagName("a:t");
      
      pdf.setFontSize(16);
      pdf.text(`Slide ${i + 1}`, 10, 15);
      pdf.setFontSize(12);
      
      cursorY = 30;
      
      Array.from(textNodes).forEach(node => {
        const text = node.textContent;
        if (text.trim()) {
          const lines = pdf.splitTextToSize(text, 180);
          lines.forEach(line => {
            if (cursorY > 280) {
              pdf.addPage();
              cursorY = 20;
            }
            pdf.text(line, 15, cursorY);
            cursorY += 7;
          });
          cursorY += 5;
        }
      });
    }

    const pdfBlob = pdf.output('blob');
    await saveFile(pdfBlob, file.name.replace(/\.pptx$/i, '') + '.pdf');

  } catch (error) {
    console.error('Error converting PPT to PDF:', error);
    throw error;
  }
};
