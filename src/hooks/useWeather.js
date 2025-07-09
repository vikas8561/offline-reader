import { useState, useCallback } from 'react';

export default function useWeather(apiKey) {
  const [weather, setWeather] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(null);

  const getLocationBasedRecommendations = useCallback(async (location) => {
    if (!location || location.latitude == null || location.longitude == null) {
      setWeatherError("Location not available. Please enable location services.");
      return;
    }
    setWeatherLoading(true);
    setWeatherError(null);
    setWeather(null);
    try {
      const lat = location.latitude;
      const lon = location.longitude;
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch weather");
      const data = await response.json();
      setWeather(data);
    } catch (err) {
      setWeatherError("Could not fetch weather: " + err.message);
    } finally {
      setWeatherLoading(false);
    }
  }, [apiKey]);

  return {
    weather,
    weatherLoading,
    weatherError,
    getLocationBasedRecommendations,
  };
} 