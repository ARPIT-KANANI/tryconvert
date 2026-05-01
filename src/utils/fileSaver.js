/**
 * Centralized utility to handle file saving with "Save As" support.
 * Uses File System Access API where available, falls back to traditional download.
 */
export const saveFile = async (blob, suggestedName) => {
  // Check if File System Access API is supported
  if ('showSaveFilePicker' in window) {
    try {
      const extension = suggestedName.split('.').pop();
      const handle = await window.showSaveFilePicker({
        suggestedName: suggestedName,
        types: [
          {
            description: extension.toUpperCase() + ' File',
            accept: {
              [blob.type || 'application/octet-stream']: [`.${extension}`],
            },
          },
        ],
      });
      
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (err) {
      // If user cancelled, just return false
      if (err.name === 'AbortError') {
        return false;
      }
      // If failed for other reasons (e.g. security block), fallback
      console.warn('showSaveFilePicker failed, falling back:', err);
    }
  }

  // Fallback: Traditional <a> link download
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = suggestedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return true;
};
