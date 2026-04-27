"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  dayValue: number;
  nightValue: number;
  unit?: string;
  isNight: boolean;
  /** "decrease" shows a red arrow when night < day; "increase" the opposite */
  direction?: "decrease" | "increase";
}

function formatNum(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(1);
}

export default function StatCard({
  icon,
  label,
  dayValue,
  nightValue,
  unit = "",
  isNight,
  direction = "decrease",
}: StatCardProps) {
  const targetValue = isNight ? nightValue : dayValue;
  const [display, setDisplay] = useState(targetValue);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = display;
    const end = targetValue;
    const duration = 900;
    const t0 = performance.now();

    const step = (now: number) => {
      const elapsed = now - t0;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic
      setDisplay(start + (end - start) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetValue]);

  const change = dayValue === 0 ? 0 : ((nightValue - dayValue) / dayValue) * 100;
  const changeStr = `${change > 0 ? "+" : ""}${change.toFixed(0)}%`;
  const isWorse =
    direction === "decrease" ? nightValue < dayValue : nightValue > dayValue;

  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">
        {formatNum(display)}
        {unit && <span className="stat-unit">{unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
      {isNight && dayValue !== nightValue && (
        <div
          className="stat-change"
          style={{ color: isWorse ? "var(--accent-rose)" : "var(--champagne-gold)" }}
        >
          {changeStr} vs daytime
        </div>
      )}
    </div>
  );
}
