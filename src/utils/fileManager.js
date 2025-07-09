class FileManager {
  constructor() {
    this.dbName = 'OfflineReaderDB';
    this.dbVersion = 1;
    this.storeName = 'pdfFiles';
    this.db = null;
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('name', 'name', { unique: false });
          store.createIndex('uploadDate', 'uploadDate', { unique: false });
          store.createIndex('size', 'size', { unique: false });
        }
      };
    });
  }

  async saveFile(file) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);

        const id = Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const fileData = {
          id,
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified,
          uploadDate: new Date().toISOString(),
          data: reader.result,
          readingProgress: 0,
          lastReadPage: 1
        };

        const request = store.add(fileData);
        
        request.onsuccess = () => {
          resolve(id);
        };

        request.onerror = () => {
          reject(new Error('Failed to save file to IndexedDB'));
        };
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async getAllFiles() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const files = request.result.map(file => ({
          ...file,
          data: null
        }));
        resolve(files);
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve files'));
      };
    });
  }

  async getFile(id) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          const blob = new Blob([request.result.data], { type: request.result.type });
          const file = new File([blob], request.result.name, {
            type: request.result.type,
            lastModified: request.result.lastModified
          });
          
          resolve({
            file,
            metadata: {
              id: request.result.id,
              uploadDate: request.result.uploadDate,
              readingProgress: request.result.readingProgress,
              lastReadPage: request.result.lastReadPage
            }
          });
        } else {
          reject(new Error('File not found'));
        }
      };

      request.onerror = () => {
        reject(new Error('Failed to retrieve file'));
      };
    });
  }

  async updateProgress(id, progress, page) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          const fileData = getRequest.result;
          fileData.readingProgress = progress;
          fileData.lastReadPage = page;
          fileData.lastReadDate = new Date().toISOString();

          const updateRequest = store.put(fileData);
          
          updateRequest.onsuccess = () => {
            resolve();
          };

          updateRequest.onerror = () => {
            reject(new Error('Failed to update progress'));
          };
        } else {
          reject(new Error('File not found'));
        }
      };

      getRequest.onerror = () => {
        reject(new Error('Failed to retrieve file for update'));
      };
    });
  }

  async deleteFile(id) {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to delete file'));
      };
    });
  }

  async getStorageUsage() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        const totalSize = request.result.reduce((sum, file) => sum + file.size, 0);
        const fileCount = request.result.length;
        
        resolve({
          totalSize,
          fileCount,
          totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
        });
      };

      request.onerror = () => {
        reject(new Error('Failed to calculate storage usage'));
      };
    });
  }

  async clearAllFiles() {
    if (!this.db) {
      await this.initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = () => {
        reject(new Error('Failed to clear files'));
      };
    });
  }
}

const fileManager = new FileManager();

export default fileManager; 