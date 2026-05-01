import { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileText, X, CheckCircle, FileUp, Image as ImageIcon, FileImage, Files, Presentation } from 'lucide-react';
import { convertPdfToWord } from '../utils/pdfToWord';
import { convertWordToPdf } from '../utils/wordToPdf';
import { convertImageToPdf } from '../utils/imageToPdf';
import { convertPdfToImage } from '../utils/pdfToImage';
import { mergePdfs } from '../utils/mergePdfs';
import { mergePpts } from '../utils/mergePpts';
import { convertPdfToPpt } from '../utils/pdfToPpt';
import { convertPptToPdf } from '../utils/pptToPdf';

const ConverterCard = ({ mode }) => {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionSuccess, setConversionSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Reset state when mode changes
  useEffect(() => {
    setFiles([]);
    setConversionSuccess(false);
  }, [mode]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelection(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelection(Array.from(e.target.files));
    }
  };

  const handleFileSelection = (selectedFiles) => {
    let validFiles = [];
    
    for (let f of selectedFiles) {
      const isPdf = f.type === 'application/pdf' || f.name.endsWith('.pdf');
      const isWord = f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || f.name.endsWith('.docx');
      const isImg = f.type.startsWith('image/');
      const isPpt = f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || f.name.endsWith('.pptx');
      
      if ((mode === 'pdf-to-word' || mode === 'pdf-to-image' || mode === 'merge-pdfs' || mode === 'pdf-to-ppt') && isPdf) {
        validFiles.push(f);
      } else if (mode === 'word-to-pdf' && isWord) {
        validFiles.push(f);
      } else if (mode === 'image-to-pdf' && isImg) {
        validFiles.push(f);
      } else if ((mode === 'ppt-to-pdf' || mode === 'merge-ppt') && isPpt) {
        validFiles.push(f);
      }
    }

    if (validFiles.length === 0) {
      alert(`Please select valid files for ${getModeTitle()}.`);
      return;
    }

    if (mode === 'merge-pdfs' || mode === 'merge-ppt') {
      setFiles(prev => [...prev, ...validFiles]);
    } else {
      setFiles([validFiles[0]]);
    }
    setConversionSuccess(false);
  };

  const removeFile = (index) => {
    if (index !== undefined) {
      setFiles(prev => prev.filter((_, i) => i !== index));
    } else {
      setFiles([]);
    }
    setConversionSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (files.length === 0) return;
    
    setIsConverting(true);
    setConversionSuccess(false);

    try {
      if (mode === 'pdf-to-word') {
        await convertPdfToWord(files[0]);
      } else if (mode === 'word-to-pdf') {
        await convertWordToPdf(files[0]);
      } else if (mode === 'image-to-pdf') {
        await convertImageToPdf(files[0]);
      } else if (mode === 'pdf-to-image') {
        await convertPdfToImage(files[0]);
      } else if (mode === 'merge-pdfs') {
        await mergePdfs(files);
      } else if (mode === 'merge-ppt') {
        await mergePpts(files);
      } else if (mode === 'pdf-to-ppt') {
        await convertPdfToPpt(files[0]);
      } else if (mode === 'ppt-to-pdf') {
        await convertPptToPdf(files[0]);
      }
      setConversionSuccess(true);
    } catch (error) {
      console.error('Conversion failed:', error);
      alert(`Conversion failed: ${error.message || 'Unknown error'}. Please try again.`);
    } finally {
      setIsConverting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getAcceptType = () => {
    if (mode === 'pdf-to-word' || mode === 'pdf-to-image' || mode === 'merge-pdfs' || mode === 'pdf-to-ppt') return '.pdf';
    if (mode === 'word-to-pdf') return '.docx';
    if (mode === 'image-to-pdf') return 'image/*';
    if (mode === 'ppt-to-pdf' || mode === 'merge-ppt') return '.pptx';
    return '*';
  };
  
  const getModeTitle = () => {
    if (mode === 'pdf-to-word') return 'PDF to Word';
    if (mode === 'word-to-pdf') return 'Word to PDF';
    if (mode === 'image-to-pdf') return 'Image to PDF';
    if (mode === 'pdf-to-image') return 'PDF to Image';
    if (mode === 'merge-pdfs') return 'Merge PDFs';
    if (mode === 'pdf-to-ppt') return 'PDF to PPT';
    if (mode === 'ppt-to-pdf') return 'PPT to PDF';
    if (mode === 'merge-ppt') return 'Merge PPT';
    return '';
  }

  const getFileIcon = () => {
    if (mode === 'word-to-pdf') return <FileUp className="file-icon" size={32} color="#3b82f6" />;
    if (mode === 'image-to-pdf') return <ImageIcon className="file-icon" size={32} color="#8b5cf6" />;
    if (mode === 'ppt-to-pdf' || mode === 'merge-ppt') return <Presentation className="file-icon" size={32} color="#ea580c" />;
    if (mode === 'pdf-to-ppt') return <FileText className="file-icon" size={32} color="#ef4444" />;
    return <FileText className="file-icon" size={32} color="#ef4444" />;
  }

  return (
    <div className="glass-card">
      {(files.length === 0 || mode === 'merge-pdfs' || mode === 'merge-ppt') && !isConverting && !conversionSuccess && (
        <div 
          className={`dropzone ${isDragging ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          style={(mode === 'merge-pdfs' || mode === 'merge-ppt') && files.length > 0 ? { padding: '2rem', marginBottom: '1rem' } : {}}
        >
          <UploadCloud className="dropzone-icon" />
          <p className="primary-text">{(mode === 'merge-pdfs' || mode === 'merge-ppt') && files.length > 0 ? 'Add more files' : 'Drag & drop your file here'}</p>
          <p>or click to browse from your computer</p>
          <button className="btn-primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current.click(); }}>
            Select {(mode === 'merge-pdfs' || mode === 'merge-ppt') ? 'Files' : 'File'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
            accept={getAcceptType()}
            multiple={mode === 'merge-pdfs' || mode === 'merge-ppt'}
          />
        </div>
      )}

      {files.length > 0 && !isConverting && !conversionSuccess && (
        <div className="files-list">
          {files.map((file, idx) => (
            <div key={idx} className="file-info" style={(mode === 'merge-pdfs' || mode === 'merge-ppt') ? { marginBottom: '0.5rem', marginTop: '0' } : {}}>
              <div className="file-details">
                {getFileIcon()}
                <div>
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)}</div>
                </div>
              </div>
              <div className="action-buttons">
                <button className="btn-icon" onClick={() => removeFile(idx)} title="Remove file">
                  <X size={18} />
                </button>
                {mode !== 'merge-pdfs' && mode !== 'merge-ppt' && (
                  <button className="btn-primary" onClick={handleConvert}>
                    Convert Now
                  </button>
                )}
              </div>
            </div>
          ))}
          {(mode === 'merge-pdfs' || mode === 'merge-ppt') && files.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button className="btn-primary" onClick={handleConvert} disabled={files.length < 2}>
                {mode === 'merge-pdfs' ? 'Merge Now' : 'Merge PPT Now'}
              </button>
            </div>
          )}
        </div>
      )}

      {isConverting && (
        <div className="loader-container">
          <div className="spinner"></div>
          <div className="status-text">
            {(mode === 'merge-pdfs' || mode === 'merge-ppt') ? `Merging your ${mode === 'merge-pdfs' ? 'PDFs' : 'PPTs'}...` : `Converting ${getModeTitle()}...`}
          </div>
        </div>
      )}

      {conversionSuccess && (
        <div className="success-state">
          <CheckCircle className="success-icon" />
          <h3>{(mode === 'merge-pdfs' || mode === 'merge-ppt') ? 'Merge Successful!' : 'Conversion Successful!'}</h3>
          <p>Your file has been {(mode === 'merge-pdfs' || mode === 'merge-ppt') ? 'merged' : 'converted'} and downloaded automatically.</p>
          <button className="btn-primary" onClick={() => removeFile()}>
            {(mode === 'merge-pdfs' || mode === 'merge-ppt') ? 'Merge More Files' : 'Convert Another File'}
          </button>
        </div>
      )}
    </div>
  );
};

export default ConverterCard;
