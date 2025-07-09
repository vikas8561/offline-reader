import React, { useState, useEffect, useRef } from 'react';
import { useBackgroundTasks } from '../hooks/useBackgroundTasks';
import { useNetworkInfo } from '../hooks/useNetworkInfo';
import { useGeolocation } from '../hooks/useGeolocation';
import { useLazyLoad } from '../hooks/useLazyLoad';

const SmartReader = ({ children, readingStats }) => {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [locationBasedFeatures, setLocationBasedFeatures] = useState(false);
  
  const containerRef = useRef();
  const { scheduleTask, scheduleCriticalTask } = useBackgroundTasks();
  const networkInfo = useNetworkInfo();
  const { location, getCurrentLocation, watchLocation, clearWatch } = useGeolocation();
  const [watchId, setWatchId] = useState(null);

  useLazyLoad(containerRef, () => {
    scheduleTask(() => {});
  });

  useEffect(() => {
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      setPerformanceMode(true);
    } else {
      setPerformanceMode(false);
    }
  }, [networkInfo.effectiveType]);

  useEffect(() => {
    if (locationBasedFeatures && !location) {
      getCurrentLocation();
    }
  }, [locationBasedFeatures, location, getCurrentLocation]);

  const enableLocationTracking = () => {
    setLocationBasedFeatures(true);
    const id = watchLocation((newLocation) => {});
    setWatchId(id);
  };

  const disableLocationTracking = () => {
    setLocationBasedFeatures(false);
    if (watchId) {
      clearWatch(watchId);
      setWatchId(null);
    }
  };

  return (
    <div ref={containerRef} className="smart-reader">
      <div className="network-status" style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: networkInfo.online ? '#4CAF50' : '#f44336',
        color: 'white',
        padding: '5px 10px',
        borderRadius: '5px',
        fontSize: '12px',
        zIndex: 1000
      }}>
        {networkInfo.online ? 'Online' : 'Offline'} - {networkInfo.effectiveType}
      </div>

      {performanceMode && (
        <div style={{
          position: 'fixed',
          top: '50px',
          right: '10px',
          background: '#FF9800',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 1000
        }}>
          Performance Mode
        </div>
      )}

      <div className="reader-content">
        {children}
      </div>
    </div>
  );
};

export default SmartReader; 