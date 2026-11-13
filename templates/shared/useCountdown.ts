"use client";

import * as React from "react";
import { resolveEventIso } from "@/lib/utils";

export interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  finished: boolean;
}

function calcTimeLeft(targetIso: string): CountdownValues {
  const targetMs = new Date(targetIso).getTime();
  const diff = targetMs - Date.now();
  if (Number.isNaN(targetMs) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, finished: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    finished: false,
  };
}

export function useWeddingCountdown(dateInput?: string, timeInput?: string): CountdownValues | null {
  const targetIso = React.useMemo(
    () => (dateInput ? resolveEventIso(dateInput, timeInput) : ""),
    [dateInput, timeInput]
  );

  const [state, setState] = React.useState<CountdownValues | null>(null);

  React.useEffect(() => {
    if (!targetIso) {
      setState(null);
      return;
    }
    setState(calcTimeLeft(targetIso));
    const timer = window.setInterval(() => {
      setState(calcTimeLeft(targetIso));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [targetIso]);

  if (!dateInput || !targetIso) return null;
  return state;
}

export function padCountdownUnit(val: number): string {
  return String(val).padStart(2, "0");
}

