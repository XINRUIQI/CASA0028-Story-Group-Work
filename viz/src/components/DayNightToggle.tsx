"use client";

import { Sun, Moon, Sunset } from "lucide-react";

export type TimeBand = "daytime" | "evening" | "late_night";

interface DayNightToggleProps {
  value: TimeBand;
  onChange: (band: TimeBand) => void;
}

const OPTIONS: { band: TimeBand; label: string; icon: React.ReactNode }[] = [
  { band: "daytime", label: "Daytime", icon: <Sun size={16} /> },
  { band: "evening", label: "Evening", icon: <Sunset size={16} /> },
  { band: "late_night", label: "Late Night", icon: <Moon size={16} /> },
];

export default function DayNightToggle({ value, onChange }: DayNightToggleProps) {
  return (
    <div className="daynight-toggle">
      {OPTIONS.map((opt) => (
        <button
          key={opt.band}
          className={`daynight-btn ${value === opt.band ? "active" : ""}`}
          onClick={() => onChange(opt.band)}
        >
          {opt.icon}
          <span>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}
