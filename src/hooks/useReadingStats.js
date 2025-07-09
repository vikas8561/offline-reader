import { useState, useEffect, useRef, useCallback } from 'react';

export default function useReadingStats(currentPage, numPages, currentFile) {
  const [readingTime, setReadingTime] = useState(0);
  const [pagesRead, setPagesRead] = useState(0);
  const [readingSpeed, setReadingSpeed] = useState(0);
  const [readingProgress, setReadingProgress] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (currentFile) {
      timerRef.current = setInterval(() => {
        setReadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setReadingTime(0);
    }
    return () => clearInterval(timerRef.current);
  }, [currentFile]);

  const updateStats = useCallback((page, totalPages, file) => {
    if (page > pagesRead) setPagesRead(page);
    if (readingTime > 0) {
      setReadingSpeed(((pagesRead || 0) / (readingTime / 60)).toFixed(2));
    }
    if (totalPages > 0) {
      setReadingProgress(((page / totalPages) * 100).toFixed(2));
    }
  }, [pagesRead, readingTime]);

  return {
    readingTime,
    pagesRead,
    readingSpeed,
    readingProgress,
    updateStats,
  };
} 