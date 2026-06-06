"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWeather, type TimeOfDay, type UpdateStep, type WeatherType } from "@/hooks/useWeather";

type Particle = {
  x: number;
  y: number;
  speed: number;
  size: number;
  opacity: number;
  vx?: number;
  w?: number;
  h?: number;
};

const SKY: Record<TimeOfDay, string> = {
  dawn: "linear-gradient(180deg, #5f7799 0%, #9ab7c8 52%, #d7d5c3 100%)",
  day: "linear-gradient(180deg, #4d79a8 0%, #8fb8d0 58%, #dce7df 100%)",
  dusk: "linear-gradient(180deg, #3f5176 0%, #8a7696 48%, #c49b8b 100%)",
  night: "linear-gradient(180deg, #0f172a 0%, #1f3555 58%, #394b5b 100%)",
};

const WEATHER_DIM: Record<WeatherType, string> = {
  CLEAR: "transparent",
  CLOUDY: "rgba(44, 62, 80, 0.10)",
  RAIN: "rgba(17, 24, 39, 0.26)",
  SNOW: "rgba(226, 238, 247, 0.14)",
  THUNDER: "rgba(8, 13, 24, 0.38)",
  WIND: "rgba(255, 255, 255, 0.08)",
  LOADING: "rgba(17, 24, 39, 0.08)",
};

const WEATHER_META: Record<WeatherType, { label: string; icon: string }> = {
  CLEAR: { label: "Sunny", icon: "☀️" },
  CLOUDY: { label: "Cloudy", icon: "☁️" },
  RAIN: { label: "Rainy", icon: "🌧️" },
  SNOW: { label: "Snowy", icon: "❄️" },
  THUNDER: { label: "Thunder", icon: "⛈️" },
  WIND: { label: "Windy", icon: "💨" },
  LOADING: { label: "Weather", icon: "⌁" },
};

function statusLabel(step: UpdateStep) {
  switch (step) {
    case "GEOLOCATING":
      return "Locating...";
    case "FETCHING_WEATHER":
      return "Fetching Weather...";
    case "FETCHING_LOCATION":
      return "Detecting City...";
    case "FAILED":
      return "Update Failed";
    case "DENIED":
      return "Location Denied";
    default:
      return "";
  }
}

function WeatherProgress({ step, timeOfDay, onRetry }: { step: UpdateStep; timeOfDay: TimeOfDay; onRetry: () => void }) {
  if (step === "IDLE" || step === "COMPLETED") return null;

  const progress: Record<UpdateStep, number> = {
    IDLE: 0,
    GEOLOCATING: 20,
    FETCHING_WEATHER: 50,
    FETCHING_LOCATION: 80,
    COMPLETED: 100,
    FAILED: 100,
    DENIED: 100,
  };
  const isError = step === "FAILED" || step === "DENIED";
  const isNight = timeOfDay === "night";

  return (
    <button
      type="button"
      className="weather-progress"
      onClick={() => {
        if (isError) onRetry();
      }}
      style={{
        color: isNight ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.62)",
        pointerEvents: isError ? "auto" : "none",
        cursor: isError ? "pointer" : "default",
      }}
    >
      <span>{statusLabel(step)} {isError ? "↻" : ""}</span>
      <span className="weather-progress-track">
        <span
          className="weather-progress-fill"
          style={{
            width: `${progress[step]}%`,
            background: isError ? "#ef4444" : isNight ? "#dbeafe" : "#3b82f6",
          }}
        />
      </span>
    </button>
  );
}

export function WeatherBackground() {
  const { type, timeOfDay, sunrise, sunset, maxTemp, minTemp, windSpeed, locationName, moonPhase, updateStep, refresh } = useWeather();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const frameId = useRef<number>(0);
  const [thunderFlash, setThunderFlash] = useState(false);
  const dates = useMemo(() => {
    const now = new Date();
    return {
      solar: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", weekday: "short" }).format(now),
      lunar: new Intl.DateTimeFormat("en-US-u-ca-chinese", { month: "numeric", day: "numeric" }).format(now),
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    const initParticles = () => {
      particles.current = [];
      if (type === "RAIN" || type === "THUNDER") {
        for (let i = 0; i < 110; i += 1) {
          particles.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 6 + 7,
            size: Math.random() * 1.5 + 1,
            opacity: Math.random() * 0.4 + 0.2,
          });
        }
      } else if (type === "SNOW") {
        for (let i = 0; i < 80; i += 1) {
          particles.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 1.2 + 0.4,
            size: Math.random() * 3 + 2,
            opacity: Math.random() * 0.5 + 0.3,
            vx: (Math.random() - 0.5) * 0.8,
          });
        }
      } else if (type === "CLOUDY") {
        for (let i = 0; i < 6; i += 1) {
          particles.current.push({
            x: Math.random() * canvas.width,
            y: 30 + Math.random() * 120,
            speed: Math.random() * 0.18 + 0.06,
            size: 0,
            opacity: Math.random() * 0.18 + 0.12,
            w: 180 + Math.random() * 160,
            h: 55 + Math.random() * 45,
            vx: Math.random() > 0.5 ? 1 : -1,
          });
        }
      } else if (type === "WIND") {
        for (let i = 0; i < 76; i += 1) {
          particles.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: Math.random() * 4 + 3.5,
            size: Math.random() * 34 + 28,
            opacity: Math.random() * 0.24 + 0.16,
            vx: Math.random() * 0.8 + 0.9,
          });
        }
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (type === "RAIN" || type === "THUNDER") {
        ctx.strokeStyle = "rgba(174,194,224,0.45)";
        ctx.lineWidth = 1;
        particles.current.forEach((particle) => {
          ctx.globalAlpha = particle.opacity;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x - 1, particle.y + particle.size * 6);
          ctx.stroke();
          particle.y += particle.speed;
          if (particle.y > canvas.height) {
            particle.y = -20;
            particle.x = Math.random() * canvas.width;
          }
        });
      } else if (type === "SNOW") {
        ctx.fillStyle = "white";
        particles.current.forEach((particle) => {
          ctx.globalAlpha = particle.opacity;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          particle.y += particle.speed;
          particle.x += particle.vx ?? 0;
          if (particle.y > canvas.height) {
            particle.y = -10;
            particle.x = Math.random() * canvas.width;
          }
        });
      } else if (type === "CLOUDY") {
        particles.current.forEach((particle) => {
          if (!particle.w || !particle.h) return;
          const gradient = ctx.createRadialGradient(particle.x, particle.y, particle.h * 0.1, particle.x, particle.y, particle.w * 0.5);
          gradient.addColorStop(0, `rgba(200,210,220,${particle.opacity})`);
          gradient.addColorStop(1, "rgba(200,210,220,0)");
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.ellipse(particle.x, particle.y, particle.w * 0.5, particle.h * 0.5, 0, 0, Math.PI * 2);
          ctx.fill();
          particle.x += (particle.vx ?? 1) * particle.speed;
          if (particle.x - particle.w / 2 > canvas.width) particle.x = -particle.w / 2;
          if (particle.x + particle.w / 2 < 0) particle.x = canvas.width + particle.w / 2;
        });
      } else if (type === "WIND") {
        particles.current.forEach((particle) => {
          ctx.globalAlpha = particle.opacity;
          ctx.strokeStyle = "rgba(255,255,255,0.62)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.bezierCurveTo(
            particle.x + particle.size * 0.32,
            particle.y - 7,
            particle.x + particle.size * 0.68,
            particle.y + 7,
            particle.x + particle.size,
            particle.y,
          );
          ctx.stroke();
          particle.x += particle.speed * (particle.vx ?? 1);
          particle.y += Math.sin(particle.x * 0.012) * 0.35;
          if (particle.x > canvas.width + particle.size) {
            particle.x = -particle.size;
            particle.y = Math.random() * canvas.height;
          }
        });
      }
      ctx.globalAlpha = 1;
      frameId.current = window.requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resize);
    resize();
    animate();
    return () => {
      window.removeEventListener("resize", resize);
      window.cancelAnimationFrame(frameId.current);
    };
  }, [type]);

  useEffect(() => {
    if (type !== "THUNDER") return undefined;
    const flash = () => {
      if (Math.random() > 0.985) {
        setThunderFlash(true);
        window.setTimeout(() => setThunderFlash(false), 80 + Math.random() * 120);
      }
      frameId.current = window.requestAnimationFrame(flash);
    };
    const id = window.requestAnimationFrame(flash);
    return () => window.cancelAnimationFrame(id);
  }, [type]);

  const isNight = timeOfDay === "night";
  const badgeColor = isNight ? "rgba(255,255,255,0.76)" : "rgba(15,23,42,0.62)";
  const badgeBg = isNight ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.46)";
  const weatherMeta = WEATHER_META[type];
  const weatherLabel = isNight && type === "CLEAR" ? moonPhase.label : weatherMeta.label;
  const weatherIcon = isNight ? moonPhase.emoji : weatherMeta.icon;

  return (
    <>
      <div className="weather-scene" aria-hidden="true" style={{ background: SKY[timeOfDay] }}>
        <div className="weather-scene-light" />
        <div className={`weather-celestial ${isNight ? `weather-moon weather-moon-${moonPhase.name}` : "weather-sun"}`}>
          {isNight && <span>{moonPhase.emoji}</span>}
        </div>
        <div className="weather-mountains weather-mountains-far" />
        <div className="weather-mountains weather-mountains-near" />
        <div className="weather-water" />
        <div className="weather-ground" />
        <div className="weather-dim" style={{ background: WEATHER_DIM[type], opacity: type === "LOADING" ? 0.35 : 1 }} />
      </div>
      <div className="weather-canvas-layer" aria-hidden="true">
        <canvas ref={canvasRef} />
        {thunderFlash && <div className="weather-thunder-flash" />}
      </div>
      <div className="weather-badges" style={{ color: badgeColor }}>
        {locationName && <div style={{ background: badgeBg }}>📍 {locationName}</div>}
        <div style={{ background: badgeBg }}>
          <span>{weatherIcon}</span>
          <span>{weatherLabel}</span>
          {type === "WIND" && windSpeed !== undefined && <span>{Math.round(windSpeed)} km/h</span>}
        </div>
        <div className="weather-date-badge" style={{ background: badgeBg }}>
          <span>{dates.solar}</span>
          <span className="weather-lunar">Lunar {dates.lunar}</span>
        </div>
        {(maxTemp !== undefined || minTemp !== undefined) && (
          <div style={{ background: badgeBg }}>
            {maxTemp !== undefined && <span className="weather-high">H: {Math.round(maxTemp)}°</span>}
            {minTemp !== undefined && <span className="weather-low">L: {Math.round(minTemp)}°</span>}
          </div>
        )}
        {(sunrise || sunset) && (
          <div style={{ background: badgeBg }}>
            {sunrise && <span>🌅 {sunrise}</span>}
            {sunset && <span>🌇 {sunset}</span>}
          </div>
        )}
      </div>
      <WeatherProgress step={updateStep} timeOfDay={timeOfDay} onRetry={refresh} />
    </>
  );
}
