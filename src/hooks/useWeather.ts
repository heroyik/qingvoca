"use client";

import { useCallback, useEffect, useState } from "react";

export type WeatherType = "CLEAR" | "CLOUDY" | "RAIN" | "SNOW" | "THUNDER" | "LOADING";
export type TimeOfDay = "dawn" | "day" | "dusk" | "night";
export type UpdateStep = "IDLE" | "GEOLOCATING" | "FETCHING_WEATHER" | "FETCHING_LOCATION" | "COMPLETED" | "FAILED" | "DENIED";

export interface WeatherData {
  type: WeatherType;
  temperature?: number;
  maxTemp?: number;
  minTemp?: number;
  timeOfDay: TimeOfDay;
  sunrise?: string;
  sunset?: string;
  locationName?: string;
  updateStep: UpdateStep;
  refresh: () => void;
}

const WEATHER_CACHE_KEY = "qingvoca:weather:cache";
const VALID_WEATHER_TYPES: WeatherType[] = ["CLEAR", "CLOUDY", "RAIN", "SNOW", "THUNDER"];
const VALID_TIMES: TimeOfDay[] = ["dawn", "day", "dusk", "night"];

function parseISOToMinutes(iso: string): number {
  const timePart = iso.split("T")[1];
  if (!timePart) return 0;
  const [hours, minutes] = timePart.split(":").map(Number);
  return hours * 60 + minutes;
}

function fallbackTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 7) return "dawn";
  if (hour >= 7 && hour < 17) return "day";
  if (hour >= 17 && hour < 19) return "dusk";
  return "night";
}

function calcTimeOfDay(sunriseISO: string, sunsetISO: string): TimeOfDay {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sunrise = parseISOToMinutes(sunriseISO);
  const sunset = parseISOToMinutes(sunsetISO);

  if (currentMinutes >= sunrise - 30 && currentMinutes < sunrise + 30) return "dawn";
  if (currentMinutes >= sunset - 30 && currentMinutes < sunset + 30) return "dusk";
  if (currentMinutes >= sunrise + 30 && currentMinutes < sunset - 30) return "day";
  return "night";
}

function formatHHMM(iso: string): string {
  return iso.split("T")[1] || "";
}

function readCachedWeather(): Partial<WeatherData> | null {
  try {
    const cached = window.localStorage.getItem(WEATHER_CACHE_KEY);
    return cached ? (JSON.parse(cached) as Partial<WeatherData>) : null;
  } catch {
    return null;
  }
}

function mapWeatherCode(code: number): WeatherType {
  if ((code >= 1 && code <= 3) || (code >= 45 && code <= 48)) return "CLOUDY";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "RAIN";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "SNOW";
  if (code >= 95) return "THUNDER";
  return "CLEAR";
}

export function useWeather(): WeatherData {
  const [weather, setWeather] = useState<WeatherData>({
    type: "LOADING",
    timeOfDay: "day",
    updateStep: "IDLE",
    refresh: () => {},
  });

  const performUpdate = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const overrideWeather = params.get("weather")?.toUpperCase() as WeatherType | undefined;
    const overrideTime = params.get("time")?.toLowerCase() as TimeOfDay | undefined;
    const cached = readCachedWeather();
    const resolvedTime = overrideTime && VALID_TIMES.includes(overrideTime) ? overrideTime : cached?.timeOfDay ?? fallbackTimeOfDay();

    if (overrideWeather && VALID_WEATHER_TYPES.includes(overrideWeather)) {
      setWeather({ ...cached, type: overrideWeather, timeOfDay: resolvedTime, updateStep: "IDLE", refresh: () => {} });
      return;
    }
    if (overrideTime && VALID_TIMES.includes(overrideTime)) {
      setWeather({ ...cached, type: cached?.type ?? "CLEAR", timeOfDay: overrideTime, updateStep: "IDLE", refresh: () => {} });
      return;
    }

    const fetchWeather = async (lat: number, lon: number) => {
      setWeather((current) => ({ ...current, updateStep: "FETCHING_WEATHER" }));
      try {
        const weatherPromise = fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=sunrise,sunset,temperature_2m_max,temperature_2m_min&timezone=auto`,
        ).then((response) => response.json());

        setWeather((current) => ({ ...current, updateStep: "FETCHING_LOCATION" }));
        const locationPromise = fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
        ).then((response) => response.json());

        const [data, locData] = await Promise.all([weatherPromise, locationPromise]);
        const sunriseISO = data.daily?.sunrise?.[0] ?? "";
        const sunsetISO = data.daily?.sunset?.[0] ?? "";
        const updatedWeather: WeatherData = {
          type: mapWeatherCode(Number(data.current_weather?.weathercode ?? 0)),
          temperature: data.current_weather?.temperature,
          maxTemp: data.daily?.temperature_2m_max?.[0],
          minTemp: data.daily?.temperature_2m_min?.[0],
          timeOfDay: sunriseISO && sunsetISO ? calcTimeOfDay(sunriseISO, sunsetISO) : fallbackTimeOfDay(),
          sunrise: sunriseISO ? formatHHMM(sunriseISO) : undefined,
          sunset: sunsetISO ? formatHHMM(sunsetISO) : undefined,
          locationName: locData.city || locData.locality || locData.principalSubdivision || undefined,
          updateStep: "COMPLETED",
          refresh: () => {},
        };

        window.localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(updatedWeather));
        setWeather(updatedWeather);
        window.setTimeout(() => setWeather((current) => ({ ...current, updateStep: "IDLE" })), 5000);
      } catch (error) {
        console.warn("[weather] failed to fetch weather", error);
        setWeather({ ...cached, type: cached?.type ?? "CLEAR", timeOfDay: resolvedTime, updateStep: "FAILED", refresh: () => {} });
        window.setTimeout(() => setWeather((current) => ({ ...current, updateStep: "IDLE" })), 8000);
      }
    };

    if (!("geolocation" in navigator)) {
      setWeather({ ...cached, type: cached?.type ?? "CLEAR", timeOfDay: resolvedTime, updateStep: "FAILED", refresh: () => {} });
      return;
    }

    setWeather({ ...cached, type: cached?.type ?? "LOADING", timeOfDay: resolvedTime, updateStep: "GEOLOCATING", refresh: () => {} });
    navigator.geolocation.getCurrentPosition(
      (position) => void fetchWeather(position.coords.latitude, position.coords.longitude),
      (error) => {
        const updateStep: UpdateStep = error.code === 1 ? "DENIED" : "FAILED";
        setWeather({ ...cached, type: cached?.type ?? "CLEAR", timeOfDay: resolvedTime, updateStep, refresh: () => {} });
        window.setTimeout(() => setWeather((current) => ({ ...current, updateStep: "IDLE" })), 8000);
      },
      { timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void performUpdate();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [performUpdate]);

  return { ...weather, refresh: performUpdate };
}
