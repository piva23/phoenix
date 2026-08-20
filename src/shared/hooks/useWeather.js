import { useState, useEffect } from 'react';
import { getWeatherInfo } from '../utils/weatherCodes';
import { getMoonPhase } from '../utils/moon';

// Fallback caso o usuário negue geolocalização (ou o navegador não suporte).
const FALLBACK_COORDS = { lat: -30.0346, lon: -51.2177, name: 'Porto Alegre, RS' };

// Hook de clima real via Open-Meteo — não precisa de API key.
// Retorna hoje + próximos 2 dias (forecast_days=3), com sunrise/sunset e fase da lua.
export function useWeather() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'error'

  useEffect(() => {
    let cancelled = false;

    const fetchWeather = async (lat, lon, locationName) => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
          `&current_weather=true` +
          `&daily=temperature_2m_max,temperature_2m_min,weathercode,sunrise,sunset` +
          `&timezone=auto&forecast_days=3`;

        const res = await fetch(url);
        if (!res.ok) throw new Error('Falha ao buscar clima');
        const json = await res.json();
        if (cancelled) return;

        const days = json.daily.time.map((date, i) => ({
          date,
          max: Math.round(json.daily.temperature_2m_max[i]),
          min: Math.round(json.daily.temperature_2m_min[i]),
          weather: getWeatherInfo(json.daily.weathercode[i]),
          sunrise: json.daily.sunrise[i]?.slice(11, 16),
          sunset: json.daily.sunset[i]?.slice(11, 16),
          moon: getMoonPhase(new Date(date + 'T12:00:00')),
        }));

        setData({
          locationName,
          current: {
            temp: Math.round(json.current_weather.temperature),
            weather: getWeatherInfo(json.current_weather.weathercode),
          },
          days,
        });
        setStatus('ready');
      } catch (e) {
        if (!cancelled) setStatus('error');
      }
    };

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => fetchWeather(pos.coords.latitude, pos.coords.longitude, 'Sua localização'),
        () => fetchWeather(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, FALLBACK_COORDS.name),
        { timeout: 5000 }
      );
    } else {
      fetchWeather(FALLBACK_COORDS.lat, FALLBACK_COORDS.lon, FALLBACK_COORDS.name);
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, status };
}
