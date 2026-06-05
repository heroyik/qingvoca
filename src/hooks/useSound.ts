"use client";

import { useCallback, useEffect } from "react";

type SoundType = "correct" | "incorrect" | "cheer";

let globalCtx: AudioContext | null = null;
let globalUnlocked = false;

const getGlobalContext = (): AudioContext | null => {
  if (typeof window === "undefined") return null;
  if (!globalCtx) {
    const AudioContextClass = (
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    ) as typeof AudioContext | undefined;
    if (!AudioContextClass) return null;
    globalCtx = new AudioContextClass();
  }
  return globalCtx;
};

function playTone(ctx: AudioContext, frequency: number, startAt: number, duration: number, gainValue = 0.28) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playPattern(ctx: AudioContext, type: SoundType) {
  const now = ctx.currentTime;
  if (type === "correct") {
    playTone(ctx, 660, now, 0.11);
    playTone(ctx, 880, now + 0.09, 0.14);
    return;
  }

  if (type === "cheer") {
    playTone(ctx, 660, now, 0.09);
    playTone(ctx, 880, now + 0.08, 0.1);
    playTone(ctx, 1046, now + 0.17, 0.16);
    return;
  }

  playTone(ctx, 220, now, 0.12, 0.1);
  playTone(ctx, 165, now + 0.1, 0.18, 0.1);
}

export function useSound(enabled: boolean) {
  const unlock = useCallback(async () => {
    const ctx = getGlobalContext();
    if (!ctx) return;

    if (ctx.state !== "running") {
      await ctx.resume().catch(() => {});
    }

    globalUnlocked = ctx.state === "running";
  }, []);

  useEffect(() => {
    const handleGesture = () => {
      void unlock();
    };

    document.addEventListener("touchstart", handleGesture, { passive: true });
    document.addEventListener("mousedown", handleGesture);
    document.addEventListener("click", handleGesture);

    return () => {
      document.removeEventListener("touchstart", handleGesture);
      document.removeEventListener("mousedown", handleGesture);
      document.removeEventListener("click", handleGesture);
    };
  }, [unlock]);

  const play = useCallback(
    async (type: SoundType) => {
      if (!enabled) return;

      const ctx = getGlobalContext();
      if (!ctx) return;

      if (ctx.state !== "running") {
        await ctx.resume().catch(() => undefined);
      }

      globalUnlocked = ctx.state === "running" || globalUnlocked;
      playPattern(ctx, type);
    },
    [enabled],
  );

  return { play };
}
