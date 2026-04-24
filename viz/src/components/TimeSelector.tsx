"use client";

import {
  COMPARE_TIMES,
  formatDisplayTime,
} from "@/lib/journeyPresets";

const PRESET_TIMES: readonly string[] = [...COMPARE_TIMES];
interface TimeSelectorProps {
  selected: string[];
  onChange: (times: string[]) => void;
}

export default function TimeSelector({ selected, onChange }: TimeSelectorProps) {
  const toggle = (time: string) => {
    if (selected.includes(time)) {
      onChange(selected.filter((t) => t !== time));
    } else {
      onChange(
        [...selected, time].sort(
          (left, right) => PRESET_TIMES.indexOf(left) - PRESET_TIMES.indexOf(right),
        ),
      );
    }
  };

  return (
    <div>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        Compare departure times
      </label>
      <div className="flex gap-2">
        {PRESET_TIMES.map((time) => (
          <button
            key={time}
            onClick={() => toggle(time)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: selected.includes(time)
                ? "rgba(201,169,110,0.2)"
                : "var(--bg-secondary)",
              border: `1px solid ${selected.includes(time) ? "var(--champagne-gold)" : "var(--border-subtle)"}`,
              color: selected.includes(time)
                ? "var(--champagne-gold)"
                : "var(--text-secondary)",
            }}
          >
            {formatDisplayTime(time)}
          </button>
        ))}
      </div>
      <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
        Compare daytime, evening, and late-night departures
      </p>
    </div>
  );
}
