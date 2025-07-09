import React, { useState, useEffect, useRef } from "react";
import * as pdfjsLib from "pdfjs-dist/webpack";
import DocumentViewer from "./components/DocumentViewer";
import SmartReader from "./components/SmartReader";
import PDFUploader from "./components/PDFUploader";
import FileLibrary from "./components/FileLibrary";
import { useBackgroundTasks } from "./hooks/useBackgroundTasks";
import { useNetworkInfo } from "./hooks/useNetworkInfo";
import { useGeolocation } from "./hooks/useGeolocation";
import fileManager from "./utils/fileManager";
import useReadingStats from "./hooks/useReadingStats";
import useWeather from "./hooks/useWeather";
import useBlobUrl from "./hooks/useBlobUrl";

const WEATHER_API_KEY = "d07bc4f29f14e466d7e4e48b17f08c2d";

function App() {
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentFile, setCurrentFile] = useState(null);
  const [currentFileId, setCurrentFileId] = useState(null);
  const [isFileLoaded, setIsFileLoaded] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const canvasRef = useRef();
  const blobUrl = useBlobUrl(currentFile);
  console.log('App render', { currentFile, blobUrl, currentPage });

  const {
    readingTime,
    pagesRead,
    readingSpeed,
    readingProgress,
    updateStats,
  } = useReadingStats(currentPage, numPages, currentFile);

  const {
    weather,
    weatherLoading,
    weatherError,
    getLocationBasedRecommendations,
  } = useWeather(WEATHER_API_KEY);

  const { scheduleTask, scheduleCriticalTask } = useBackgroundTasks();
  const networkInfo = useNetworkInfo();
  const { location, getCurrentLocation, disableLocationTracking } = useGeolocation();

  const loadPDF = async (url) => {
    try {
      setIsFileLoaded(false);
      scheduleTask(async () => {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setIsFileLoaded(true);
      });
    } catch (error) {
      console.error('Failed to load PDF:', error);
      setIsFileLoaded(false);
    }
  };

  const handlePDFLoad = (file, fileId = null) => {
    // Only update if file or fileId is different
    if (
      (!currentFile || file !== currentFile) ||
      (fileId !== currentFileId)
    ) {
      setCurrentFile(file);
      setCurrentFileId(fileId);
    }
  };

  const handleFileSelect = (file) => {
    scheduleTask(() => {
      localStorage.setItem('lastUploadedFile', JSON.stringify({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified
      }));
    });
  };

  const handleLibraryFileSelect = (file, metadata) => {
    // Only update if file or fileId is different
    if (
      (!currentFile || file !== currentFile) ||
      (metadata.id !== currentFileId)
    ) {
      handlePDFLoad(file, metadata.id);
      if (metadata.lastReadPage > 1) {
        setCurrentPage(metadata.lastReadPage);
      }
    }
  };

  useEffect(() => {
    if (blobUrl) {
      loadPDF(blobUrl);
    }
  }, [blobUrl]);

  useEffect(() => {
    updateStats(currentPage, numPages, currentFile);
  }, [currentPage, numPages, currentFile, updateStats]);

  const handlePageChange = (pageNumber) => {
    scheduleCriticalTask(() => {
      setCurrentPage(pageNumber);
    });
    scheduleTask(async () => {
      localStorage.setItem('readingProgress', pageNumber.toString());
      if (currentFile) {
        localStorage.setItem('currentFile', currentFile.name);
      }
      if (currentFileId && numPages > 0) {
        try {
          const progress = (pageNumber / numPages) * 100;
          await fileManager.updateProgress(currentFileId, progress, pageNumber);
        } catch (error) {}
      }
    });
  };

  const onPageLoad = React.useCallback(() => {
    scheduleTask(() => {
      // console.log('Background task: Page loaded successfully');
    });
  }, [scheduleTask]);

  const handleGetRecommendation = () => {
    console.log('Calling getLocationBasedRecommendations with location:', location);
    getLocationBasedRecommendations(location);
  };

  const handleRetryWeather = () => {
    if (location) {
      getLocationBasedRecommendations(location);
    }
  };

  return (
    <>
      <header className="app-header">
        <div className="app-logo">
          <span>📚</span> Offline PDF Reader
        </div>
      </header>
      <div className="main-container">
        <SmartReader
          readingStats={{
            timeSpent: readingTime,
            pagesRead: pagesRead,
            readingSpeed: readingSpeed
          }}
        >
          <div className="dashboard-header-wrapper">
            <div
              className="dashboard-header-row"
              style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 24,
                alignItems: 'stretch',
                justifyContent: 'space-between',
                width: '100%',
                maxWidth: 1100,
                margin: '0 auto',
                padding: '24px 0 12px 0',
              }}
            >
              <div className="dashboard-card location-card" style={{ minWidth: 220, maxWidth: 340, flex: 1, marginRight: 12 }}>
                <h3>Location-Based Features</h3>
                <div>
                  <span role="img" aria-label="location">📍</span>
                  {location ? `Location: ${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}` : 'Location not available'}
                </div>
                {location && <div>Accuracy: {location.accuracy}m</div>}
                <div style={{ marginTop: 8, display: 'flex', gap: 10 }}>
                  {!location ? (
                    <button onClick={getCurrentLocation}>Enable Location</button>
                  ) : null}
                  {location && (
                    <button onClick={handleGetRecommendation} disabled={weatherLoading}>
                      {weatherLoading ? 'Loading...' : 'Get Recommendation'}
                    </button>
                  )}
                </div>
                {weatherError && (
                  <div style={{ color: 'red', marginTop: 6 }}>
                    {weatherError}
                    <button onClick={handleRetryWeather} style={{ marginLeft: 8, padding: '2px 8px', fontSize: '0.95em' }}>Retry</button>
                  </div>
                )}
                {weatherLoading && (
                  <div style={{ color: '#1976d2', marginTop: 6 }}>Fetching weather...</div>
                )}
                {weather && !weatherError && !weatherLoading && (
                  <div className="weather-recommendation">
                    <strong>Weather:</strong> {weather.weather[0].main} ({weather.weather[0].description})<br/>
                    <strong>Temp:</strong> {weather.main.temp}°C<br/>
                    {weather.weather[0].main === 'Rain' ? (
                      <>It's rainy, enjoy your reading indoors! 📚☔</>
                    ) : weather.weather[0].main === 'Clear' ? (
                      <>It's sunny, maybe read outside! 🌞</>
                    ) : weather.weather[0].main === 'Clouds' ? (
                      <>Cloudy day, perfect for a cozy reading session! ☁️📖</>
                    ) : (
                      <>Great time to read a book!</>
                    )}
                  </div>
                )}
              </div>
              <div className="dashboard-card stats-card" style={{ minWidth: 220, maxWidth: 340, flex: 1, marginRight: 12 }}>
                <h3>Reading Statistics</h3>
                <div>⏱️ <strong>Time:</strong> {readingTime}s</div>
                <div>📄 <strong>Pages Read:</strong> {pagesRead}</div>
                <div>⚡ <strong>Speed:</strong> {readingSpeed} pages/min</div>
              </div>
              <div className="dashboard-card network-card" style={{ minWidth: 220, maxWidth: 340, flex: 1 }}>
                <h3>Network Status</h3>
                <div>{networkInfo.online ? '🟢 Online' : '🔴 Offline'} - {networkInfo.effectiveType}</div>
                <div>⬇️ <strong>Down:</strong> {networkInfo.downlink} Mbps</div>
                <div>⏱️ <strong>Latency:</strong> {networkInfo.rtt}ms</div>
                {networkInfo.saveData && <div style={{ color: '#b26a00', fontWeight: 600 }}>⚠️ Data Saver Mode</div>}
              </div>
            </div>
          </div>
          <div
            className="main-content-row"
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 32,
              alignItems: 'flex-start',
              width: '100%',
              maxWidth: 1100,
              margin: '0 auto',
              padding: '0 0 32px 0',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <PDFUploader
                onPDFLoad={handlePDFLoad}
                onFileSelect={handleFileSelect}
                currentFileId={currentFileId}
                handleLibraryFileSelect={handleLibraryFileSelect}
              />
              <div style={{ height: 24 }} />
              {currentFile && (
                <div className="current-file-info">
                  <h4>📄 Current Document</h4>
                  <div><strong>Name:</strong> {currentFile.name}</div>
                  <div><strong>Size:</strong> {(currentFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  <div><strong>Last Modified:</strong> {new Date(currentFile.lastModified).toLocaleDateString()}</div>
                  {currentFileId && (
                    <div style={{ color: '#4CAF50' }}>
                      ✅ Saved to library (ID: {currentFileId})
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {numPages > 0 && (
                <div className="reading-progress">
                  <h3>Reading Progress</h3>
                  <canvas 
                    ref={canvasRef}
                    width="300" 
                    height="30"
                    style={{ border: '1px solid #ccc', borderRadius: '5px' }}
                  />
                  <div>Page {currentPage} of {numPages}</div>
                </div>
              )}
              {numPages > 0 && (
                <div className="page-navigation" style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                  <button 
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    Previous Page
                  </button>
                  <button 
                    onClick={() => handlePageChange(Math.min(numPages, currentPage + 1))}
                    disabled={currentPage >= numPages}
                  >
                    Next Page
                  </button>
                </div>
              )}
              {numPages > 0 && blobUrl && (
                <div className="pdf-block">
                  <DocumentViewer 
                    file={blobUrl} 
                    pageNumber={currentPage} 
                    onPageLoad={onPageLoad}
                  />
                </div>
              )}
              {(!blobUrl || numPages === 0) && (
                <div className="no-pdf-loaded">
                  <p>No PDF loaded. Please upload or select a document from the library.</p>
                </div>
              )}
            </div>
          </div>
        </SmartReader>
      </div>
      <footer style={{ width: '100%', background: 'rgba(255,255,255,0.95)', marginTop: 32, padding: '32px 0 0 0', boxShadow: '0 -2px 16px rgba(60,72,100,0.08)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 18px' }}>
          <h2 style={{ textAlign: 'center', color: '#1a237e', fontWeight: 800, marginBottom: 24, letterSpacing: '-1px', fontSize: '2rem' }}>Features Included</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}>
            {/* Feature cards */}
            <div className="feature-card accent1">
              <span className="feature-icon">📁</span>
              <div className="feature-title">Drag & drop PDF upload</div>
            </div>
            <div className="feature-card accent2">
              <span className="feature-icon">💾</span>
              <div className="feature-title">Offline storage with IndexedDB</div>
            </div>
            <div className="feature-card accent3">
              <span className="feature-icon">🔄</span>
              <div className="feature-title">Reading progress sync</div>
            </div>
            <div className="feature-card accent4">
              <span className="feature-icon">⚙️</span>
              <div className="feature-title">Background processing</div>
            </div>
            <div className="feature-card accent5">
              <span className="feature-icon">📊</span>
              <div className="feature-title">Progress tracking</div>
            </div>
            <div className="feature-card accent6">
              <span className="feature-icon">✅</span>
              <div className="feature-title">File validation</div>
            </div>
            <div className="feature-card accent7">
              <span className="feature-icon">🌐</span>
              <div className="feature-title">Automatic network optimization</div>
            </div>
            <div className="feature-card accent8">
              <span className="feature-icon">☁️</span>
              <div className="feature-title">Location-based weather recommendations</div>
            </div>
            {/* Web APIs & Tech Used cards */}
            <h2 style={{ textAlign: 'center', color: '#1a237e', fontWeight: 800, margin: '48px 0 24px 0', letterSpacing: '-1px', fontSize: '2rem' }}>Web APIs & Tech Used</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 32 }}>
              {/* Web APIs & Tech Used cards */}
              <div className="tech-card accent9">
                <span className="feature-icon">⚛️</span>
                <div className="feature-title">React</div>
              </div>
              <div className="tech-card accent10">
                <span className="feature-icon">⚡</span>
                <div className="feature-title">Vite</div>
              </div>
              <div className="tech-card accent11">
                <span className="feature-icon">📄</span>
                <div className="feature-title">PDF.js</div>
              </div>
              <div className="tech-card accent12">
                <span className="feature-icon">🗄️</span>
                <div className="feature-title">IndexedDB (localForage)</div>
              </div>
              <div className="tech-card accent13">
                <span className="feature-icon">🛡️</span>
                <div className="feature-title">Service Workers</div>
              </div>
              <div className="tech-card accent14">
                <span className="feature-icon">📍</span>
                <div className="feature-title">Geolocation API</div>
              </div>
              <div className="tech-card accent15">
                <span className="feature-icon">📶</span>
                <div className="feature-title">Network Information API</div>
              </div>
              <div className="tech-card accent16">
                <span className="feature-icon">☀️</span>
                <div className="feature-title">OpenWeatherMap API</div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;
