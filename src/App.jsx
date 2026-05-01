import { useState } from 'react';
import ThemeToggle from './components/ThemeToggle';
import ConverterCard from './components/ConverterCard';
import { X, FileText, FileUp, Image as ImageIcon, FileImage, Files, ArrowLeft, Presentation } from 'lucide-react';
import logo from './assets/convertlogo.jpg';

const tools = [
  {
    id: 'pdf-to-word',
    title: 'PDF to Word',
    description: 'Convert your PDF documents into editable Word files with high accuracy.',
    icon: <FileText size={32} color="#ef4444" />,
    color: '#ef4444'
  },
  {
    id: 'word-to-pdf',
    title: 'Word to PDF',
    description: 'Create professional PDF documents from your Word files instantly.',
    icon: <FileUp size={32} color="#3b82f6" />,
    color: '#3b82f6'
  },
  {
    id: 'image-to-pdf',
    title: 'Image to PDF',
    description: 'Turn your JPG, PNG, and other images into a single PDF document.',
    icon: <ImageIcon size={32} color="#8b5cf6" />,
    color: '#8b5cf6'
  },
  {
    id: 'pdf-to-image',
    title: 'PDF to Image',
    description: 'Extract pages from your PDF and save them as high-quality images.',
    icon: <FileImage size={32} color="#10b981" />,
    color: '#10b981'
  },
  {
    id: 'ppt-to-pdf',
    title: 'PPT to PDF',
    description: 'Convert your PowerPoint presentations into PDF documents.',
    icon: <Presentation size={32} color="#ea580c" />,
    color: '#ea580c'
  },
  {
    id: 'pdf-to-ppt',
    title: 'PDF to PPT',
    description: 'Convert your PDF pages into professional PowerPoint slides.',
    icon: <Presentation size={32} color="#d97706" />,
    color: '#d97706'
  },
  {
    id: 'merge-pdfs',
    title: 'Merge PDFs',
    description: 'Combine multiple PDF files into one organized document.',
    icon: <Files size={32} color="#f59e0b" />,
    color: '#f59e0b'
  },
  {
    id: 'merge-ppt',
    title: 'Merge PPT',
    description: 'Combine multiple PowerPoint files into one presentation.',
    icon: <Files size={32} color="#f97316" />,
    color: '#f97316'
  }
];

function App() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [modalContent, setModalContent] = useState(null); // 'terms' or 'privacy'

  const openModal = (type) => setModalContent(type);
  const closeModal = () => setModalContent(null);

  const Modal = ({ title, children }) => (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="btn-icon" onClick={closeModal}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );

  const activeTool = selectedTool ? tools.find(t => t.id === selectedTool) : null;

  return (
    <div className="app-container">
      <header>
        <div className="logo" onClick={() => setSelectedTool(null)} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Convertify Logo" style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover' }} />
          Convertify
        </div>
        <ThemeToggle />
      </header>

      <main>
        <div className="hero-text">
          <h1>{activeTool ? activeTool.title : 'Seamless Document Conversion'}</h1>
          <p>
            {activeTool 
              ? activeTool.description 
              : 'Convert between PDF, Word, and Images, or merge multiple PDFs instantly right in your browser. Fast, secure, and 100% private.'}
          </p>
        </div>

        {!selectedTool ? (
          <div className="tool-grid">
            {tools.map(tool => (
              <div key={tool.id} className="tool-card" onClick={() => setSelectedTool(tool.id)}>
                <div className="tool-icon-wrapper" style={{ backgroundColor: `${tool.color}15` }}>
                  {tool.icon}
                </div>
                <h3>{tool.title}</h3>
                <p>{tool.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="converter-view-container">
            <button className="btn-back" onClick={() => setSelectedTool(null)}>
              <ArrowLeft size={18} /> Back to All Tools
            </button>
            <ConverterCard mode={selectedTool} />
          </div>
        )}
      </main>

      <footer>
        <div className="footer-content">
          <div className="footer-logo-section">
            <div className="footer-logo">
              <img src={logo} alt="Convertify Logo" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
              Convertify
            </div>
            <p className="footer-tagline">Professional browser-based document conversion.</p>
          </div>
          
          <div className="footer-info-section">
            <div className="footer-column">
              <h4>Legal</h4>
              <div className="footer-links">
                <button className="link-btn" onClick={() => openModal('terms')}>Terms of Service</button>
                <button className="link-btn" onClick={() => openModal('privacy')}>Privacy Policy</button>
              </div>
            </div>
            
            <div className="footer-column">
              <h4>Contact</h4>
              <div className="footer-links">
                <button className="link-btn" onClick={() => openModal('contact')}>Get in Touch</button>
                <button className="link-btn" onClick={() => openModal('contact')}>Email Me</button>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Convertify. All rights reserved.</p>
          <p>Made with <span className="heart">❤️</span> by ARPIT KHUSHI KACHARIA</p>
        </div>
      </footer>

      {modalContent === 'terms' && (
        <Modal title="Terms of Service">
          <p>Last updated: April 2024</p>
          <section>
            <h3>1. Use of Service</h3>
            <p>Convertify provides browser-based document conversion services. By using our service, you agree to these terms.</p>
          </section>
          <section>
            <h3>2. Privacy & Security</h3>
            <p>All file processing is performed locally in your browser. We do not upload your files to our servers.</p>
          </section>
          <section>
            <h3>3. Limitation of Liability</h3>
            <p>The service is provided "as is" without any warranty. We are not liable for any data loss or conversion inaccuracies.</p>
          </section>
        </Modal>
      )}

      {modalContent === 'privacy' && (
        <Modal title="Privacy Policy">
          <p>Last updated: April 2024</p>
          <section>
            <h3>1. Data Collection</h3>
            <p>We do not collect any personal data or file content. All processing happens on your device.</p>
          </section>
          <section>
            <h3>2. Cookies</h3>
            <p>We use local storage only to remember your theme preference (Light/Dark mode).</p>
          </section>
          <section>
            <h3>3. Third-Party Services</h3>
            <p>We use CDNs to load essential libraries (PDF.js). These services may log standard technical data like your IP address.</p>
          </section>
        </Modal>
      )}

      {modalContent === 'contact' && (
        <Modal title="Contact Us">
          <section>
            <h3>Get in Touch</h3>
            <p>We'd love to hear from you! Whether you have a question about features, pricing, or anything else, our team is ready to answer all your questions.</p>
          </section>
          <section>
            <div className="contact-info-list">
              <div className="contact-item">
                <strong>Email:</strong>
                <a href="mailto:ARPIT.KANANI1234@GMAIL.COM">ARPIT.KANANI1234@GMAIL.COM</a>
              </div>
              <div className="contact-item">
                <strong>Phone:</strong>
                <a href="tel:7322779602">7322779602</a>
              </div>
              <div className="contact-item">
                <strong>Location:</strong>
                <p>New York, USA</p>
              </div>
            </div>
          </section>
        </Modal>
      )}
    </div>
  );
}

export default App;
