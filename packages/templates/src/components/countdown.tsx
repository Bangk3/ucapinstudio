"use client";

import { useEffect, useState } from "react";

interface CountdownProps {
  targetDate: string; // ISO date string or "YYYY-MM-DD"
  targetTime?: string; // "HH:MM" optional
  primaryColor?: string;
  label?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

function calcTimeLeft(targetDate: string, targetTime?: string): TimeLeft {
  const dateStr = targetTime ? `${targetDate}T${targetTime}:00` : `${targetDate}T00:00:00`;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, done: false };
}

export function Countdown({
  targetDate,
  targetTime,
  primaryColor = "#6b8f6e",
  label,
}: CountdownProps) {
  // Initialize null to avoid SSR/client hydration mismatch (Date.now() differs)
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    // First tick — runs only on client after hydration
    setTimeLeft(calcTimeLeft(targetDate, targetTime));
    const id = setInterval(() => {
      setTimeLeft(calcTimeLeft(targetDate, targetTime));
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate, targetTime]);

  if (timeLeft === null) {
    // SSR / pre-hydration — render placeholder with same dimensions to avoid layout shift
    return (
      <div className="text-center">
        {label && <p className="text-xs uppercase tracking-widest mb-4 opacity-60">{label}</p>}
        <div className="flex justify-center gap-4">
          {["Hari", "Jam", "Menit", "Detik"].map((l) => (
            <div key={l} className="flex flex-col items-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold text-white shadow-sm opacity-0"
                style={{ backgroundColor: primaryColor }}
              >
                --
              </div>
              <span className="mt-1 text-xs opacity-0">{l}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (timeLeft.done) {
    return (
      <p className="text-sm text-center opacity-60" style={{ color: primaryColor }}>
        Acara telah berlangsung
      </p>
    );
  }

  const units = [
    { value: timeLeft.days, label: "Hari" },
    { value: timeLeft.hours, label: "Jam" },
    { value: timeLeft.minutes, label: "Menit" },
    { value: timeLeft.seconds, label: "Detik" },
  ];

  return (
    <div className="text-center">
      {label && <p className="text-xs uppercase tracking-widest mb-4 opacity-60">{label}</p>}
      <div className="flex justify-center gap-4">
        {units.map(({ value, label: unitLabel }) => (
          <div key={unitLabel} className="flex flex-col items-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold text-white shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              {String(value).padStart(2, "0")}
            </div>
            <span className="mt-1 text-xs opacity-60">{unitLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
