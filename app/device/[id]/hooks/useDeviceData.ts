// Custom hooks for device page
import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { getDeviceData, onDeviceValue } from '@/lib/utils/rtdbHelper';

/**
 * Hook to fetch and monitor weather data
 */
export function useWeatherData(deviceId: string) {
  const [weatherData, setWeatherData] = useState<{
    temperature: number | null;
    humidity: number | null;
    loading: boolean;
  }>({
    temperature: null,
    humidity: null,
    loading: false
  });

  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!deviceId) {
        console.log('[Weather] No deviceId');
        return;
      }
      
      console.log('[Weather] Fetching temperature/humidity for device:', deviceId);
      setWeatherData(prev => ({ ...prev, loading: true }));
      
      try {
        // Strategy 1: Check for device sensor data first
        try {
          const sensors = await getDeviceData(deviceId, 'sensors');
          
          if (sensors && (sensors.temperature !== undefined || sensors.humidity !== undefined)) {
            console.log('[Weather] Using device sensor data');
            setWeatherData({
              temperature: sensors.temperature ?? null,
              humidity: sensors.humidity ?? null,
              loading: false
            });
            fetchFreshWeather().catch(() => {});
            return;
          }
        } catch (sensorError) {
          console.log('[Weather] No device sensor data available:', sensorError);
        }
        
        // Strategy 2: Try cached weather data
        try {
          const cachedWeather = await getDeviceData(deviceId, 'weather');
          
          if (cachedWeather) {
            const cacheAge = Date.now() - (cachedWeather.timestamp || 0);
            const maxCacheAge = 10 * 60 * 1000; // 10 minutes
            
            if (cacheAge < maxCacheAge && (cachedWeather.temperature !== null || cachedWeather.humidity !== null)) {
              console.log('[Weather] Using cached weather data');
              setWeatherData({
                temperature: cachedWeather.temperature ?? null,
                humidity: cachedWeather.humidity ?? null,
                loading: false
              });
              fetchFreshWeather().catch(() => {});
              return;
            }
          }
        } catch (cacheError) {
          console.log('[Weather] No cached weather data:', cacheError);
        }
        
        // Strategy 3: Fetch fresh data
        await fetchFreshWeather();
      } catch (error) {
        console.error('[Weather] Error fetching weather data:', error);
        setWeatherData({ temperature: null, humidity: null, loading: false });
      }
    };
    
    const fetchFreshWeather = async () => {
      try {
        let lat: number | null = null;
        let lng: number | null = null;
        
        // Try gps path first
        try {
          const gps = await getDeviceData(deviceId, 'gps');
          if (gps) {
            lat = gps.lat ?? null;
            lng = gps.lng ?? null;
            console.log('[Weather] GPS data from gps path:', { lat, lng });
          }
        } catch (gpsError) {
          console.log('[Weather] No GPS data at gps path');
        }
        
        // Fallback to location path
        if (!lat || !lng) {
          try {
            const location = await getDeviceData(deviceId, 'location');
            if (location) {
              lat = location.latitude ?? location.lat ?? null;
              lng = location.longitude ?? location.lng ?? null;
              console.log('[Weather] GPS data from location path:', { lat, lng });
            }
          } catch (locationError) {
            console.log('[Weather] No GPS data at location path');
          }
        }
        
        if (!lat || !lng) {
          console.log('[Weather] No GPS coordinates available, cannot fetch weather');
          setWeatherData({ temperature: null, humidity: null, loading: false });
          return;
        }
        
        // Fetch weather from Open-Meteo API
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m&timezone=auto`;
        console.log('[Weather] Fetching from:', weatherUrl);
        const response = await fetch(weatherUrl);
        
        if (!response.ok) {
          throw new Error('Weather API request failed');
        }
        
        const data = await response.json();
        console.log('[Weather] API response:', data);
        
        const temperature = data.current?.temperature_2m ?? null;
        const humidity = data.current?.relative_humidity_2m ?? null;
        
        console.log('[Weather] Temperature:', temperature, 'Humidity:', humidity);
        
        setWeatherData({ temperature, humidity, loading: false });
        
        // Store to RTDB
        if (temperature !== null || humidity !== null) {
          try {
            console.log('[Weather] Storing to RTDB...');
            const weatherRef = ref(database, `devices/${deviceId}/weather`);
            await set(weatherRef, {
              temperature,
              humidity,
              timestamp: Date.now(),
              source: 'open-meteo'
            });
            console.log('[Weather] Stored successfully');
          } catch (writeError) {
            console.error('[Weather] Error storing to RTDB (non-critical):', writeError);
          }
        }
      } catch (error) {
        console.error('[Weather] Error fetching fresh weather data:', error);
        setWeatherData({ temperature: null, humidity: null, loading: false });
      }
    };
    
    fetchWeatherData();
    
    // Refresh every 10 minutes
    const interval = setInterval(fetchWeatherData, 10 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [deviceId]);

  return weatherData;
}

/**
 * Hook to fetch and monitor GPS data
 */
export function useGPSData(deviceId: string) {
  const [gpsData, setGpsData] = useState<any>(null);

  useEffect(() => {
    const fetchGPSData = async () => {
      if (!deviceId) return;
      
      try {
        const gps = await getDeviceData(deviceId, 'gps');
        
        if (gps) {
          setGpsData(gps);
        } else {
          // Try location path as fallback
          const location = await getDeviceData(deviceId, 'location');
          
          if (location) {
            setGpsData({
              lat: location.latitude ?? location.lat,
              lng: location.longitude ?? location.lng,
              ts: location.timestamp,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching GPS data:', error);
      }
    };
    
    fetchGPSData();
    
    // Set up real-time listener
    const unsubscribe = onDeviceValue(deviceId, 'gps', (gps: any) => {
      if (gps) {
        setGpsData(gps);
      }
    });
    
    return () => unsubscribe();
  }, [deviceId]);

  return gpsData;
}

/**
 * Format timestamp utility
 */
export function formatTimestamp(ts: number): string {
  if (!ts) return 'Unknown';
  
  const year2000InSeconds = 946684800;
  const year2000InMs = 946684800000;
  
  let date: Date;
  if (ts < year2000InSeconds) {
    return `Timestamp: ${ts}`;
  } else if (ts < year2000InMs) {
    date = new Date(ts * 1000);
  } else {
    date = new Date(ts);
  }
  
  if (isNaN(date.getTime())) {
    return `Timestamp: ${ts}`;
  }
  
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}
