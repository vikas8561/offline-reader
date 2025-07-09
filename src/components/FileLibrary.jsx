import React, { useState, useEffect } from 'react';
import fileManager from '../utils/fileManager';
import { useBackgroundTasks } from '../hooks/useBackgroundTasks';

const FileLibrary = ({ onFileSelect, currentFileId }) => {
  const [files, setFiles] = useState([]);
  const [storageUsage, setStorageUsage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { scheduleTask } = useBackgroundTasks();

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      scheduleTask(async () => {
        const savedFiles = await fileManager.getAllFiles();
        const usage = await fileManager.getStorageUsage();
        
        setFiles(savedFiles);
        setStorageUsage(usage);
        setLoading(false);
      });
    } catch (err) {
      setError('Failed to load saved files: ' + err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleFileSelect = async (fileId) => {
    if (fileId === currentFileId) return;
    try {
      const { file, metadata } = await fileManager.getFile(fileId);
      onFileSelect(file, metadata);
    } catch (err) {
      setError('Failed to load file: ' + err.message);
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      try {
        await fileManager.deleteFile(fileId);
        await loadFiles();
      } catch (err) {
        setError('Failed to delete file: ' + err.message);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to delete all saved files? This action cannot be undone.')) {
      try {
        await fileManager.clearAllFiles();
        setFiles([]);
        setStorageUsage({ totalSize: 0, fileCount: 0, totalSizeMB: '0.00' });
      } catch (err) {
        setError('Failed to clear files: ' + err.message);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString() + ' ' + 
           new Date(dateString).toLocaleTimeString();
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>📚 File Library</h3>
      
      {storageUsage && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          background: '#f5f5f5',
          borderRadius: '5px',
          fontSize: '14px'
        }}>
          <p style={{ margin: '5px 0' }}>
            <strong>Storage:</strong> {storageUsage.totalSizeMB} MB used
          </p>
          <p style={{ margin: '5px 0' }}>
            <strong>Files:</strong> {storageUsage.fileCount} saved
          </p>
          {storageUsage.fileCount > 0 && (
            <button 
              onClick={handleClearAll}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Clear All Files
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: '10px',
          padding: '10px',
          background: '#ffebee',
          border: '1px solid #ffcdd2',
          borderRadius: '5px',
          color: '#c62828'
        }}>
          <p style={{ margin: '0 0 10px 0' }}>❌ {error}</p>
          <button 
            onClick={() => setError(null)}
            style={{
              background: '#c62828',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading saved files...</p>
        </div>
      )}

      {!loading && files.length === 0 && (
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: '#f9f9f9',
          borderRadius: '5px',
          color: '#666'
        }}>
          <p>No saved files yet. Upload a PDF to get started!</p>
        </div>
      )}

      {!loading && files.length > 0 && (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {files.map((file) => (
            <div 
              key={file.id}
              style={{
                padding: '10px',
                margin: '5px 0',
                background: currentFileId === file.id ? '#e3f2fd' : '#f9f9f9',
                border: `1px solid ${currentFileId === file.id ? '#2196F3' : '#ddd'}`,
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleFileSelect(file.id)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 5px 0', fontSize: '14px' }}>📄 {file.name}</h4>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    Size: {formatFileSize(file.size)}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                    Uploaded: {formatDate(file.uploadDate)}
                  </p>
                  {file.readingProgress > 0 && (
                    <div style={{ marginTop: '5px' }}>
                      <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#e0e0e0',
                        borderRadius: '2px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${file.readingProgress}%`,
                          height: '100%',
                          background: '#4CAF50',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#666' }}>
                        Progress: {Math.round(file.readingProgress)}% (Page {file.lastReadPage})
                      </p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.id, file.name);
                  }}
                  style={{
                    background: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '5px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    marginLeft: '10px'
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '10px', textAlign: 'center' }}>
        <button 
          onClick={loadFiles}
          style={{
            background: '#2196F3',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Refresh Library
        </button>
      </div>
    </div>
  );
};

export default FileLibrary; 