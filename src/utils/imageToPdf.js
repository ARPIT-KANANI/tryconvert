import { jsPDF } from 'jspdf';
import { saveFile } from './fileSaver';

export const convertImageToPdf = async (file) => {
  try {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        // Create pdf matching image dimensions
        const orientation = img.width > img.height ? 'l' : 'p';
        const doc = new jsPDF({
          orientation: orientation,
          unit: 'px',
          format: [img.width, img.height]
        });
        
        doc.addImage(img, 'JPEG', 0, 0, img.width, img.height);
        
        const pdfBlob = doc.output('blob');
        URL.revokeObjectURL(url);
        saveFile(pdfBlob, file.name.replace(/\.[^/.]+$/, "") + '.pdf').then(resolve).catch(reject);
      };
      
      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      
      img.src = url;
    });
  } catch (error) {
    console.error('Error converting image to PDF:', error);
    throw error;
  }
};
