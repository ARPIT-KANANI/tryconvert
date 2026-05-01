import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { saveFile } from './fileSaver';

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const convertPdfToImage = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    const numPages = pdf.numPages;

    const scale = 2; // Better quality for converted images

    if (numPages === 1) {
      // Single page - just download the image directly
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const context = canvas.getContext('2d');
      await page.render({ canvasContext: context, viewport }).promise;
      
      canvas.toBlob(async (blob) => {
        await saveFile(blob, file.name.replace(/\.pdf$/i, '') + '.png');
      }, 'image/png');
    } else {
      // Multiple pages - create a ZIP file of images
      const zip = new JSZip();
      
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;
        
        const imgData = canvas.toDataURL('image/png').split(',')[1];
        zip.file(`page-${i}.png`, imgData, { base64: true });
      }
      
      const zipContent = await zip.generateAsync({ type: 'blob' });
      await saveFile(zipContent, file.name.replace(/\.pdf$/i, '') + '-images.zip');
    }
  } catch (error) {
    console.error('Error converting PDF to Image:', error);
    throw error;
  }
};
