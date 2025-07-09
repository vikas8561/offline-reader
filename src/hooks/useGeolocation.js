import { useState, useEffect } from 'react';

export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getCurrentLocation = (force = false) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    if (location && !force) {
      return;
    }
    setLoading(true);
    setError(null);
    console.log('Requesting geolocation...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
        setLoading(false);
        console.log('Geolocation granted:', position.coords);
      },
      (errorObj) => {
        if (errorObj.code === 1) {
          setError('Location permission denied. Please allow location access in your browser settings.');
        } else if (errorObj.code === 2) {
          setError('Location unavailable. Try again.');
        } else if (errorObj.code === 3) {
          setError('Location request timed out. Try again.');
        } else {
          setError(errorObj.message);
        }
        setLoading(false);
        console.log('Geolocation error:', errorObj);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const watchLocation = (onLocationChange) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return null;
    }
    return navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        setLocation(newLocation);
        if (onLocationChange) {
          onLocationChange(newLocation);
        }
      },
      (errorObj) => {
        if (errorObj.code === 1) {
          setError('Location permission denied. Please allow location access in your browser settings.');
        } else if (errorObj.code === 2) {
          setError('Location unavailable. Try again.');
        } else if (errorObj.code === 3) {
          setError('Location request timed out. Try again.');
        } else {
          setError(errorObj.message);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const clearWatch = (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  const resetLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    location,
    error,
    loading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
    resetLocation
  };
} 