"use client";

import { useState, useEffect, useMemo } from "react";
import {
  PERSONA_DEFS,
  type PersonaId,
} from "@/components/PersonaSwitch";
import { getStaticDataRoot } from "@/lib/publicBasePath";

const HOURS = [
  "14:00",
  "16:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
  "22:00",
  "23:00",
  "00:00",
  "01:00",
  "02:00",
];

export interface HourlyPoint {
  duration_min: number;
  waiting_burden: number;
  support_open: number;
  recovery_penalty: number;
}

type AllCurves = Record<string, Record<string, HourlyPoint | null>>;

const IMAGE_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

let _curveCache: AllCurves | null = null;
let _curvePromise: Promise<AllCurves> | null = null;

function loadAllCurves(): Promise<AllCurves> {
  if (_curveCache) return Promise.resolve(_curveCache);
  if (_curvePromise) return _curvePromise;
  _curvePromise = fetch(`${getStaticDataRoot()}/persona-curves.json`)
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
    .then((data: AllCurves) => {
      _curveCache = data;
      return data;
    });
  return _curvePromise;
}

/* ── Persona portrait images ── */

const PERSONA_IMAGES: Record<PersonaId, string> = {
  student: "/01_late_night_student.png",
  budget: "/02_passenger_with_luggage.png",
  nightworker: "/03_night_shift_worker.png",
  unfamiliar: "/04_first_time_visitor.png",
  custom: "/05_custom_traveller.png",
};

/* ── Line chart ── */

const CHART_LINES = [
  {
    key: "waiting_burden" as const,
    label: "Waiting time",
    color: "#ff6b6b",
  },
  {
    key: "support_open" as const,
    label: "Nearby help",
    color: "#51cf66",
  },
  {
    key: "recovery_penalty" as const,
    label: "Backup options",
    color: "#ffa94d",
  },
  {
    key: "duration_min" as const,
    label: "Total journey time",
    color: "#ffd43b",
  },
];

const PERSONA_HIGHLIGHT_KEYS: Partial<Record<PersonaId, string[]>> = {
  student: ["duration_min"],
  budget: ["duration_min", "support_open"],
  nightworker: ["recovery_penalty"],
  unfamiliar: ["waiting_burden"],
};

function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2[0]},${p2[1]}`;
  }
  return d;
}

const CHART_W = 720;
const CHART_H = 260;
const CHART_PAD = { top: 30, right: 150, bottom: 38, left: 14 } as const;
const CHART_CW = CHART_W - CHART_PAD.left - CHART_PAD.right;
const CHART_CH = CHART_H - CHART_PAD.top - CHART_PAD.bottom;

function HourlyLineChart({
  curves,
  persona,
}: {
  curves: Record<string, HourlyPoint | null>;
  persona: PersonaId;
}) {
  const hours = useMemo(
    () => HOURS.filter((h) => curves[h] !== undefined),
    [curves],
  );

  const normed = useMemo(() => {
    if (hours.length === 0) return {};
    const result: Record<string, [number, number][]> = {};
    for (const line of CHART_LINES) {
      const vals = hours.map((h) => curves[h]?.[line.key] ?? null);
      const nums = vals.filter((v): v is number => v !== null);
      const min = Math.min(...nums, 0);
      const max = Math.max(...nums, 1);
      const range = max - min || 1;
      result[line.key] = hours.map((h, i) => {
        const v = curves[h]?.[line.key] ?? null;
        const x = CHART_PAD.left + (i / (hours.length - 1)) * CHART_CW;
        const y =
          v !== null
            ? CHART_PAD.top + (1 - (v - min) / range) * CHART_CH
            : CHART_PAD.top + CHART_CH / 2;
        return [x, y] as [number, number];
      });
    }
    return result;
  }, [curves, hours]);

  if (hours.length === 0) return null;

  const legendX = CHART_PAD.left + CHART_CW + 20;
  const legendStartY = CHART_PAD.top + 24;
  const legendGap = 30;

  return (
    <svg viewBox={`0 0 ${CHART_W} ${CHART_H}`} className="choose-line-svg">
      {hours.map((_, i) => {
        const x = CHART_PAD.left + (i / (hours.length - 1)) * CHART_CW;
        return (
          <line
            key={i}
            x1={x}
            y1={CHART_PAD.top}
            x2={x}
            y2={CHART_PAD.top + CHART_CH}
            stroke="rgba(201,169,110,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {CHART_LINES.map((line) => {
        const highlights = PERSONA_HIGHLIGHT_KEYS[persona];
        const isPulse = highlights ? highlights.includes(line.key) : false;
        return (
          <g key={line.key} className={isPulse ? "chart-line-pulse" : undefined}>
            <path
              d={smoothPath(normed[line.key])}
              fill="none"
              stroke={line.color}
              strokeWidth={isPulse ? "5" : "2"}
              opacity="0.85"
            />
            {normed[line.key].map(([x, y], i) => (
              <circle
                key={i}
                cx={x}
                cy={y}
                r={isPulse ? "6.5" : "3.5"}
                fill={line.color}
                stroke="var(--bg-primary)"
                strokeWidth="1.5"
                opacity="0.9"
              />
            ))}
          </g>
        );
      })}

      {/* Right-side legend */}
      {CHART_LINES.map((line, i) => {
        const y = legendStartY + i * legendGap;
        return (
          <g key={line.key}>
            <line
              x1={legendX}
              y1={y}
              x2={legendX + 18}
              y2={y}
              stroke={line.color}
              strokeWidth="2"
              opacity="0.85"
            />
            <circle
              cx={legendX + 9}
              cy={y}
              r="3"
              fill={line.color}
              stroke="var(--bg-primary)"
              strokeWidth="1.5"
              opacity="0.9"
            />
            <text
              x={legendX + 26}
              y={y + 4}
              fill="var(--text-secondary)"
              fontSize="11"
              opacity="0.85"
            >
              {line.label}
            </text>
          </g>
        );
      })}

      {hours.map((h, i) => {
        const x = CHART_PAD.left + (i / (hours.length - 1)) * CHART_CW;
        return (
          <text
            key={h}
            x={x}
            y={CHART_H - 8}
            textAnchor="middle"
            fill="var(--text-muted)"
            fontSize="11"
          >
            {h}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Main component ── */

interface Props {
  persona?: PersonaId | null;
  onPersonaChange?: (p: PersonaId | null) => void;
  headerContent?: React.ReactNode;
  customCurves?: Record<string, HourlyPoint | null> | null;
}

export default function PersonaInsightsPanel({
  persona: personaProp,
  onPersonaChange,
  headerContent,
  customCurves,
}: Props = {}) {
  const [personaState, setPersonaState] = useState<PersonaId | null>(null);
  const persona = personaProp !== undefined ? personaProp : personaState;
  const setPersona = (p: PersonaId | null) => {
    if (onPersonaChange) onPersonaChange(p);
    if (personaProp === undefined) setPersonaState(p);
  };

  const [allCurves, setAllCurves] = useState<AllCurves | null>(_curveCache);

  useEffect(() => {
    if (_curveCache) return;
    let stale = false;
    loadAllCurves().then((data) => {
      if (!stale) setAllCurves(data);
    });
    return () => { stale = true; };
  }, []);

  const curves = persona === "custom" && customCurves
    ? customCurves
    : persona && allCurves?.[persona]
      ? (allCurves[persona] as Record<string, HourlyPoint | null>)
      : null;

  return (
    <div className="persona-insights-panel">
      <div className="choose-persona-row">
        {PERSONA_DEFS.map((p) => {
          const isActive = persona === p.id;
          return (
            <div key={p.id} className="choose-persona-wrap">
              <div
                className={`choose-persona-bubble ${isActive ? "visible" : ""}`}
                style={{ borderColor: "var(--champagne-gold)", "--bubble-accent": "var(--champagne-gold)" } as React.CSSProperties}
                role="status"
                aria-hidden={!isActive}
              >
                {p.need}
              </div>
              <button
                className={`choose-persona-card ${isActive ? "active" : ""}`}
                onClick={() => setPersona(isActive ? null : p.id)}
                type="button"
                aria-pressed={isActive}
              >
                <div className="choose-persona-portrait">
                  <img
                    src={`${IMAGE_PREFIX}${PERSONA_IMAGES[p.id]}`}
                    alt={p.label}
                    className="choose-persona-img"
                  />
                </div>
                <span className="choose-persona-name">[{p.label}]</span>
              </button>
            </div>
          );
        })}
      </div>

      {headerContent}

      <div className="choose-chart-section">
        <h3 className="choose-chart-title">
          How the journey changes as it gets later?
        </h3>
        {!persona ? (
          <p className="choose-chart-loading">
            Pick a traveller above to see their hourly burden curves.
          </p>
        ) : !curves ? (
          <p className="choose-chart-loading">Loading hourly data…</p>
        ) : (
          <HourlyLineChart curves={curves} persona={persona} />
        )}
      </div>

    </div>
  );
}
