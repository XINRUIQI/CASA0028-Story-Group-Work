"use client";

import { TICK_HOURS, formatHour } from "@/lib/vitality";

interface TimeSliderProps {
  hour: number;
  onChange: (hour: number) => void;
  color: string;
}

const MIN = TICK_HOURS[0];
const MAX = TICK_HOURS[TICK_HOURS.length - 1];
const STEP = 0.5;
/** Must match `::-webkit-slider-thumb` / `::-moz-range-thumb` width in CSS. */
const THUMB_PX = 20;

function valueToLeft(h: number): string {
  const t = (h - MIN) / (MAX - MIN);
  return `calc(${THUMB_PX / 2}px + (100% - ${THUMB_PX}px) * ${t})`;
}

function tickLabel(h: number) {
  return h >= 24 ? `0${h - 24}:00` : `${String(h).padStart(2, "0")}:00`;
}

export default function TimeSlider({ hour, onChange, color }: TimeSliderProps) {
  const pct = ((hour - MIN) / (MAX - MIN)) * 100;

  return (
    <div className="ts-wrap">
      {/* .ts-rail: one positioned ancestor so label + ticks use the same % width as the range. */}
      <div className="ts-rail">
        <span className="ts-current" style={{ left: valueToLeft(hour), color }}>
          {formatHour(hour)}
        </span>

        <div className="ts-track-bg">
          <div
            className="ts-track-fill"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, #f0b87a, ${color})`,
            }}
          />
        </div>

        <input
          type="range"
          className="ts-input"
          min={MIN}
          max={MAX}
          step={STEP}
          value={hour}
          onChange={(e) => onChange(Number(e.target.value))}
        />

        <div className="ts-ticks">
          {TICK_HOURS.map((h) => {
            return (
              <button
                key={h}
                type="button"
                className={`ts-tick ${h === Math.round(hour) ? "active" : ""}`}
                style={{ left: valueToLeft(h) }}
                onClick={() => onChange(h)}
              >
                <span className="ts-tick-dot" />
                <span className="ts-tick-label">{tickLabel(h)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
