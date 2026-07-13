// Códigos WMO retornados pelo Open-Meteo (https://open-meteo.com/en/docs)
export const WEATHER_CODES = {
  0: { label: 'Céu limpo', icon: '☀️' },
  1: { label: 'Poucas nuvens', icon: '🌤️' },
  2: { label: 'Parcialmente nublado', icon: '⛅' },
  3: { label: 'Nublado', icon: '☁️' },
  45: { label: 'Neblina', icon: '🌫️' },
  48: { label: 'Neblina gelada', icon: '🌫️' },
  51: { label: 'Garoa leve', icon: '🌦️' },
  53: { label: 'Garoa', icon: '🌦️' },
  55: { label: 'Garoa forte', icon: '🌧️' },
  56: { label: 'Garoa congelante', icon: '🌧️' },
  57: { label: 'Garoa congelante forte', icon: '🌧️' },
  61: { label: 'Chuva leve', icon: '🌦️' },
  63: { label: 'Chuva', icon: '🌧️' },
  65: { label: 'Chuva forte', icon: '🌧️' },
  66: { label: 'Chuva congelante', icon: '🌧️' },
  67: { label: 'Chuva congelante forte', icon: '🌧️' },
  71: { label: 'Neve leve', icon: '🌨️' },
  73: { label: 'Neve', icon: '🌨️' },
  75: { label: 'Neve forte', icon: '❄️' },
  77: { label: 'Grãos de neve', icon: '🌨️' },
  80: { label: 'Pancadas de chuva leves', icon: '🌦️' },
  81: { label: 'Pancadas de chuva', icon: '🌧️' },
  82: { label: 'Pancadas de chuva fortes', icon: '⛈️' },
  85: { label: 'Pancadas de neve leves', icon: '🌨️' },
  86: { label: 'Pancadas de neve fortes', icon: '❄️' },
  95: { label: 'Trovoadas', icon: '⛈️' },
  96: { label: 'Trovoadas com granizo', icon: '⛈️' },
  99: { label: 'Trovoadas fortes com granizo', icon: '⛈️' },
};

export function getWeatherInfo(code) {
  return WEATHER_CODES[code] || { label: '—', icon: '🌡️' };
}
