import pptxgen from "pptxgenjs";
import * as pdfjsLib from 'pdfjs-dist';
import { saveFile } from './fileSaver';

// Setup worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const convertPdfToPpt = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const pptx = new pptxgen();

    const scale = 2; // Better resolution

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;

      const imgData = canvas.toDataURL('image/png');
      const slide = pptx.addSlide();
      
      // Add the PDF page as an image covering the whole slide
      slide.addImage({ 
        data: imgData, 
        x: 0, 
        y: 0, 
        w: '100%', 
        h: '100%' 
      });
    }

    // Generate and save using the centralized saveFile utility
    const pptxBlob = await pptx.write('blob');
    const fileName = file.name.replace(/\.pdf$/i, '') + '.pptx';
    await saveFile(pptxBlob, fileName);
    
  } catch (error) {
    console.error('Error converting PDF to PPT:', error);
    throw error;
  }
};
