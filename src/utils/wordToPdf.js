import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { saveFile } from './fileSaver';

export const convertWordToPdf = async (file) => {
  try {
    // 1. Read Word file as ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // 2. Extract text using mammoth
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    
    if (!text.trim()) {
      throw new Error("No text could be extracted from this Word document.");
    }

    // 3. Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxLineWidth = pageWidth - margin * 2;
    
    // 4. Set font and add text with automatic wrapping
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    // Split text by newlines first to preserve basic paragraph structure
    const paragraphs = text.split('\n');
    let cursorY = margin;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      if (para.trim()) {
        const lines = doc.splitTextToSize(para, maxLineWidth);
        
        // Add lines and handle page breaks
        for (let j = 0; j < lines.length; j++) {
          if (cursorY > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            cursorY = margin;
          }
          doc.text(lines[j], margin, cursorY);
          cursorY += 6; // line height
        }
        cursorY += 4; // paragraph spacing
      }
    }

    // 5. Download the generated PDF
    const pdfBlob = doc.output('blob');
    await saveFile(pdfBlob, file.name.replace(/\.docx?$/, '.pdf'));
  } catch (error) {
    console.error('Error converting Word to PDF:', error);
    throw error;
  }
};
