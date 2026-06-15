import { useState, useEffect } from 'react';
import { TRIP_DAYS, WEATHER_AVG } from '../constants';

const PTOWN_LAT = 42.0509;
const PTOWN_LON = -70.1859;
const CACHE_KEY = 'nws_forecast_v1';
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

function emojiForForecast(text = '') {
  const t = text.toLowerCase();
  if (t.includes('thunder')) return '⛈️';
  if (t.includes('shower') || t.includes('rain')) return '🌧️';
  if (t.includes('drizzle')) return '🌦️';
  if (t.includes('fog')) return '🌫️';
  if (t.includes('snow')) return '❄️';
  if (t.includes('mostly cloudy') || t.includes('overcast')) return '☁️';
  if (t.includes('partly')) return '⛅';
  if (t.includes('mostly sunny') || t.includes('mostly clear')) return '🌤️';
  if (t.includes('sunny') || t.includes('clear')) return '☀️';
  return '🌤️';
}

export function useWeather() {
  const [weather, setWeather] = useState(WEATHER_AVG);
  const [live, setLive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          setWeather(cached.data);
          setLive(true);
          return;
        }
      } catch {}

      try {
        const ptRes = await fetch(`https://api.weather.gov/points/${PTOWN_LAT},${PTOWN_LON}`, {
          headers: { 'User-Agent': 'jbbce-retreat-app' },
        });
        if (!ptRes.ok) return;
        const ptJson = await ptRes.json();
        const forecastUrl = ptJson.properties?.forecast;
        if (!forecastUrl) return;

        const fcRes = await fetch(forecastUrl, { headers: { 'User-Agent': 'jbbce-retreat-app' } });
        if (!fcRes.ok) return;
        const fcJson = await fcRes.json();
        const periods = fcJson.properties?.periods || [];

        // Build day-keyed map from NWS day/night period pairs
        const dayMap = {};
        for (const p of periods) {
          const day = p.startTime?.slice(0, 10);
          if (!day) continue;
          if (!dayMap[day]) dayMap[day] = {};
          if (p.isDaytime) {
            dayMap[day].hi = p.temperature;
            dayMap[day].icon = emojiForForecast(p.shortForecast);
            dayMap[day].shortForecast = p.shortForecast;
          } else {
            dayMap[day].lo = p.temperature;
            if (!dayMap[day].icon) dayMap[day].icon = emojiForForecast(p.shortForecast);
          }
        }

        const result = TRIP_DAYS.map((d, i) => {
          const key = d.toISOString().slice(0, 10);
          const entry = dayMap[key];
          if (entry?.hi != null) {
            return {
              hi: entry.hi,
              lo: entry.lo ?? WEATHER_AVG[i]?.lo,
              icon: entry.icon,
              shortForecast: entry.shortForecast,
            };
          }
          return WEATHER_AVG[i];
        });

        if (!cancelled) {
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: result })); } catch {}
          setWeather(result);
          setLive(true);
        }
      } catch {
        // silently fall back to WEATHER_AVG
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { weather, live };
}
