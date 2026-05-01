import { PDFDocument } from 'pdf-lib';
import { saveFile } from './fileSaver';

export const mergePdfs = async (files) => {
  try {
    if (!files || files.length < 2) {
      throw new Error("Please select at least two PDF files to merge.");
    }

    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const arrayBuffer = await file.arrayBuffer();
      const pdfToMerge = await PDFDocument.load(arrayBuffer);
      const copiedPages = await mergedPdf.copyPages(pdfToMerge, pdfToMerge.getPageIndices());
      
      copiedPages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }

    const mergedPdfBytes = await mergedPdf.save();
    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    await saveFile(blob, 'merged-document.pdf');
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw error;
  }
};
