import { useState, useEffect } from 'react';

export function useNetworkInfo() {
  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
    online: navigator.onLine
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false,
          online: navigator.onLine
        });
      } else {
        // Fallback for browsers that don't support Network Information API
        setNetworkInfo(prev => ({
          ...prev,
          online: navigator.onLine
        }));
      }
    };

    const handleOnlineStatusChange = () => {
      setNetworkInfo(prev => ({
        ...prev,
        online: navigator.onLine
      }));
    };

    // Initial update
    updateNetworkInfo();

    // Listen for network changes
    if (navigator.connection) {
      navigator.connection.addEventListener('change', updateNetworkInfo);
    }

    // Listen for online/offline changes
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);

    return () => {
      if (navigator.connection) {
        navigator.connection.removeEventListener('change', updateNetworkInfo);
      }
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
    };
  }, []);

  return networkInfo;
} 