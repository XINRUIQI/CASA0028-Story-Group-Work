"use client";

const PRESET_TIMES = ["18:00", "21:00", "23:00"];

interface TimeSelectorProps {
  selected: string[];
  onChange: (times: string[]) => void;
}

export default function TimeSelector({ selected, onChange }: TimeSelectorProps) {
  const toggle = (time: string) => {
    if (selected.includes(time)) {
      onChange(selected.filter((t) => t !== time));
    } else {
      onChange([...selected, time].sort());
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
            {time}
          </button>
        ))}
      </div>
      <p className="text-xs mt-1.5" style={{ color: "var(--text-muted)" }}>
        Start with three evening time points
      </p>
    </div>
  );
}
