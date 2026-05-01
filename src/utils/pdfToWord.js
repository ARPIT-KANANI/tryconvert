import * as pdfjsLib from 'pdfjs-dist';
import { Document, Packer, Paragraph, ImageRun, SectionType } from 'docx';
import { saveFile } from './fileSaver';

// Setup PDF.js worker for version 3.x
// Using a CDN to ensure version match and avoid Vite bundling issues with workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export const convertPdfToWord = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const sections = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // Using scale 2 for better resolution
      const viewport = page.getViewport({ scale: 2 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: context, viewport }).promise;
      
      // Convert canvas to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error('Canvas to Blob conversion failed'));
        }, 'image/png');
      });
      const imageArrayBuffer = await blob.arrayBuffer();

      // In docx, dimensions are in pixels? Actually it depends on the version.
      // For ImageRun in recent versions, it's usually EMU or abstracted.
      // Transformation width/height in docx 8/9 are points.
      // viewport.width is pixels at scale 2. Original points = pixels / 2.
      const widthInPoints = viewport.width / 2;
      const heightInPoints = viewport.height / 2;

      const imgRun = new ImageRun({
        data: imageArrayBuffer,
        transformation: {
          width: widthInPoints,
          height: heightInPoints,
        },
      });

      sections.push({
        properties: {
          page: {
            size: {
              width: widthInPoints * 20, // points to twips
              height: heightInPoints * 20,
            },
            margin: {
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
            },
          },
          type: pageNum === 1 ? SectionType.CONTINUOUS : SectionType.NEXT_PAGE,
        },
        children: [
          new Paragraph({
            children: [imgRun],
          }),
        ],
      });
    }

    const doc = new Document({
      sections: sections,
    });

    const docxBlob = await Packer.toBlob(doc);
    await saveFile(docxBlob, file.name.replace('.pdf', '.docx'));
  } catch (error) {
    console.error('Error converting PDF to Word:', error);
    throw error;
  }
};
