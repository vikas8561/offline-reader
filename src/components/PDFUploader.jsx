import React, { useState, useRef } from 'react';
import { useBackgroundTasks } from '../hooks/useBackgroundTasks';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import fileManager from '../utils/fileManager';
import FileLibrary from './FileLibrary';

const PDFUploader = ({ onPDFLoad, currentFileId, handleLibraryFileSelect }) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [saveToLibrary, setSaveToLibrary] = useState(true);
  const fileInputRef = useRef();
  
  const { scheduleTask, scheduleCriticalTask } = useBackgroundTasks();
  const networkInfo = useNetworkInfo();

  const validateFile = (file) => {
    if (!file) return 'No file selected';
    if (file.type !== 'application/pdf') return 'Please select a PDF file';
    if (file.size > 50 * 1024 * 1024) return 'File size must be less than 50MB';
    return null;
  };

  const processPDF = async (file) => {
    setIsProcessing(true);
    setError(null);
    setUploadProgress(0);
    let fileId = null;
    try {
      if (saveToLibrary) {
        fileId = await fileManager.saveFile(file);
      }
      if (onPDFLoad) {
        onPDFLoad(file, fileId);
      }
    } catch (err) {
      setError('Failed to upload or save PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    await processPDF(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      await processPDF(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="card" style={{ marginBottom: '20px', boxShadow: '0 2px 16px rgba(60,72,100,0.10)' }}>
      <h3 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '18px', color: '#1a237e' }}>📄 Upload PDF Document</h3>
      <div className="flex-center" style={{ marginBottom: '18px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
        {/* Removed Upload New button */}
        <button 
          onClick={() => setShowLibrary((prev) => !prev)}
          className={showLibrary ? 'active' : ''}
        >
          📚 Library
        </button>
      </div>
      {showLibrary && (
        <FileLibrary onFileSelect={handleLibraryFileSelect} currentFileId={currentFileId} />
      )}
      {/* Network-aware upload warning */}
      {networkInfo.effectiveType === 'slow-2g' && (
        <div style={{
          marginBottom: '10px',
          padding: '10px',
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#b26a00',
          fontWeight: 500
        }}>
          ⚠️ Slow network detected. Large files may take longer to process.
        </div>
      )}
      {/* Save to Library Option */}
      <div style={{
        marginBottom: '10px',
        padding: '10px',
        background: '#f0f8ff',
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <input
          type="checkbox"
          checked={saveToLibrary}
          onChange={(e) => setSaveToLibrary(e.target.checked)}
          style={{ marginRight: '8px', accentColor: '#4f8cff', width: 18, height: 18 }}
        />
        <span style={{ fontWeight: 500, fontSize: '1rem' }}>💾 Save to library for offline access</span>
        <span style={{ fontSize: '12px', color: '#666', marginLeft: 'auto' }}>
          Files saved to library will be available offline and sync reading progress
        </span>
      </div>
      {/* Drag and Drop Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: `2.5px dashed ${isDragging ? '#4f8cff' : '#b3b8d0'}`,
          borderRadius: '14px',
          padding: '48px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragging ? '#e3f0ff' : '#f9f9f9',
          transition: 'all 0.3s ease',
          marginBottom: '18px',
          minHeight: '120px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '54px', marginBottom: '10px', color: '#4f8cff' }}>
          <span role="img" aria-label="folder">📁</span>
        </div>
        <p style={{ fontSize: '1.1rem', margin: '0 0 10px 0', color: '#444', fontWeight: 500 }}>
          {isDragging ? 'Drop your PDF here' : 'Click to select or drag & drop PDF'}
        </p>
        <p style={{ fontSize: '13px', margin: 0, color: '#999' }}>
          Maximum file size: 50MB
        </p>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
      {/* Upload Progress */}
      {isProcessing && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{
            width: '100%',
            height: '20px',
            background: '#f0f0f0',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(79,140,255,0.08)'
          }}>
            <div style={{
              width: `${uploadProgress}%`,
              height: '100%',
              background: '#4f8cff',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ textAlign: 'center', margin: '5px 0', fontSize: '14px', color: '#4f8cff', fontWeight: 600 }}>
            Processing PDF... {uploadProgress}%
          </p>
        </div>
      )}
      {/* Error Display */}
      {error && (
        <div style={{
          marginBottom: '10px',
          padding: '10px',
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '8px',
          color: '#c62828',
          fontWeight: 500
        }}>
          <p style={{ margin: '0 0 10px 0' }}>❌ {error}</p>
          <button 
            onClick={clearError}
            style={{
              background: '#c62828',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      {/* File Info Display */}
      <div style={{
        marginTop: '10px',
        padding: '10px',
        background: '#e8f5e8',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1b5e20',
        fontWeight: 500
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>📋 Supported Features:</h4>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li>Drag & drop PDF files</li>
          <li>Automatic network optimization</li>
          <li>Background processing</li>
          <li>Progress tracking</li>
          <li>File validation</li>
          <li>Offline storage with IndexedDB</li>
          <li>Reading progress sync</li>
        </ul>
      </div>
    </div>
  );
};

export default PDFUploader; 