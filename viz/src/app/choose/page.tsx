"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Bus,
  Clock3,
  CircleHelp,
  Users,
  Activity,
  Lightbulb,
  Star,
} from "lucide-react";
import { PERSONA_DEFS, type PersonaId } from "@/components/PersonaSwitch";
import { api } from "@/lib/api";

const PRESET_ROUTES: Record<
  PersonaId,
  { origin: string; dest: string; oName: string; dName: string }
> = {
  student: {
    origin: "940GZZLUESQ",
    dest: "HUBSVS",
    oName: "Euston Square",
    dName: "Seven Sisters",
  },
  budget: {
    origin: "940GZZLUSTD",
    dest: "940GZZLUBXN",
    oName: "Stratford",
    dName: "Brixton",
  },
  nightworker: {
    origin: "940GZZLUKSX",
    dest: "940GZZLUBKG",
    oName: "King's Cross",
    dName: "Barking",
  },
  unfamiliar: {
    origin: "940GZZLUPAC",
    dest: "HUBGNW",
    oName: "Paddington",
    dName: "Greenwich",
  },
};

const HOURS = [
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

interface HourlyPoint {
  duration_min: number;
  waiting_burden: number;
  support_open: number;
  recovery_penalty: number;
}

/* ── Portrait SVGs ── */

function StudentPortrait() {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12,130 C12,112 28,102 42,98 L50,95 L58,98 C72,102 88,112 88,130" />
      <path d="M42,98 L48,116" />
      <path d="M58,98 L52,116" />
      <path
        d="M48,98 L50,122 L52,98"
        fill="var(--champagne-gold)"
        stroke="var(--champagne-gold)"
        strokeWidth="0.8"
        opacity="0.5"
      />
      <path d="M44,82 L44,95" />
      <path d="M56,82 L56,95" />
      <ellipse cx="50" cy="52" rx="22" ry="28" />
      <path d="M28,44 C28,20 72,20 72,44" />
      <path d="M30,40 C33,24 45,17 50,16 C55,17 67,24 70,40" />
      <path d="M28,44 C30,37 36,35 39,38" />
      <rect x="34" y="48" width="12" height="9" rx="2.5" />
      <rect x="54" y="48" width="12" height="9" rx="2.5" />
      <line x1="46" y1="52" x2="54" y2="52" />
      <circle
        cx="40"
        cy="52"
        r="1.5"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <circle
        cx="60"
        cy="52"
        r="1.5"
        fill="var(--text-secondary)"
        stroke="none"
      />
    </svg>
  );
}

function BudgetPortrait() {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10,130 C10,110 26,100 40,96 L50,93 L60,96 C74,100 90,110 90,130" />
      <path d="M40,96 C42,100 44,104 44,108" />
      <path d="M60,96 C58,100 56,104 56,108" />
      <path d="M44,82 L44,93" />
      <path d="M56,82 L56,93" />
      <ellipse cx="50" cy="50" rx="22" ry="28" />
      <path d="M28,42 C28,18 72,18 72,42" />
      <path d="M28,42 C26,52 24,65 28,75" />
      <path d="M72,42 C74,52 76,65 72,75" />
      <path d="M30,38 C33,22 45,15 50,14 C55,15 67,22 70,38" />
      <circle
        cx="40"
        cy="50"
        r="1.8"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <circle
        cx="60"
        cy="50"
        r="1.8"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <path d="M44,60 Q50,64 56,60" />
    </svg>
  );
}

function NightworkerPortrait() {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10,130 C10,110 26,100 40,96 L50,93 L60,96 C74,100 90,110 90,130" />
      <path d="M40,96 L40,104" />
      <path d="M60,96 L60,104" />
      <line x1="30" y1="105" x2="70" y2="105" strokeWidth="0.8" />
      <path d="M44,80 L44,93" />
      <path d="M56,80 L56,93" />
      <ellipse cx="50" cy="50" rx="22" ry="28" />
      <path d="M28,42 C28,20 72,20 72,42" />
      <path d="M30,38 C33,22 45,15 50,14 C55,15 67,22 70,38" />
      <path d="M70,38 C72,34 74,28 70,18" />
      <circle cx="68" cy="16" r="5" />
      <circle
        cx="40"
        cy="50"
        r="1.8"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <circle
        cx="60"
        cy="50"
        r="1.8"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <path d="M44,60 Q50,64 56,60" />
    </svg>
  );
}

function UnfamiliarPortrait() {
  return (
    <svg
      viewBox="0 0 100 130"
      fill="none"
      stroke="var(--text-secondary)"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12,130 C12,112 28,102 42,98 L50,95 L58,98 C72,102 88,112 88,130" />
      <path d="M42,98 L42,104 L58,104 L58,98" />
      <line x1="50" y1="104" x2="50" y2="110" strokeWidth="0.8" />
      <path d="M44,82 L44,95" />
      <path d="M56,82 L56,95" />
      <ellipse cx="50" cy="52" rx="22" ry="28" />
      <path d="M28,44 C28,22 72,22 72,44" />
      <path d="M30,40 C33,26 45,19 50,18 C55,19 67,26 70,40" />
      <circle
        cx="40"
        cy="52"
        r="1.8"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <circle
        cx="60"
        cy="52"
        r="1.8"
        fill="var(--text-secondary)"
        stroke="none"
      />
      <path d="M46,64 L54,64" />
    </svg>
  );
}

const PORTRAITS: Record<PersonaId, () => React.JSX.Element> = {
  student: StudentPortrait,
  budget: BudgetPortrait,
  nightworker: NightworkerPortrait,
  unfamiliar: UnfamiliarPortrait,
};

/* ── Line chart ── */

const CHART_LINES = [
  {
    key: "waiting_burden" as const,
    label: "Expected wait",
    color: "var(--accent-rose)",
  },
  {
    key: "support_open" as const,
    label: "Nearby support",
    color: "var(--accent-emerald)",
  },
  {
    key: "recovery_penalty" as const,
    label: "Recovery penalty",
    color: "var(--accent-amber)",
  },
  {
    key: "duration_min" as const,
    label: "Journey time",
    color: "var(--champagne-gold)",
  },
];

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

function HourlyLineChart({
  curves,
}: {
  curves: Record<string, HourlyPoint | null>;
}) {
  const hours = HOURS.filter((h) => curves[h] !== undefined);
  if (hours.length === 0) return null;

  const W = 720;
  const H = 260;
  const PAD = { top: 30, right: 40, bottom: 38, left: 14 };
  const cw = W - PAD.left - PAD.right;
  const ch = H - PAD.top - PAD.bottom;

  const normed = useMemo(() => {
    const result: Record<string, [number, number][]> = {};
    for (const line of CHART_LINES) {
      const vals = hours.map((h) => curves[h]?.[line.key] ?? null);
      const nums = vals.filter((v): v is number => v !== null);
      const min = Math.min(...nums, 0);
      const max = Math.max(...nums, 1);
      const range = max - min || 1;
      result[line.key] = hours.map((h, i) => {
        const v = curves[h]?.[line.key] ?? null;
        const x = PAD.left + (i / (hours.length - 1)) * cw;
        const y =
          v !== null
            ? PAD.top + (1 - (v - min) / range) * ch
            : PAD.top + ch / 2;
        return [x, y] as [number, number];
      });
    }
    return result;
  }, [curves, hours, cw, ch]);

  const annotations = [
    {
      x: PAD.left + (1 / (hours.length - 1)) * cw,
      y: PAD.top + 6,
      text: "Waiting burden increases (High!)",
      anchor: "start" as const,
    },
    {
      x: PAD.left + (4 / (hours.length - 1)) * cw,
      y: PAD.top + ch * 0.38,
      text: "Nearby Support Drops (Mid)",
      anchor: "middle" as const,
    },
    {
      x: PAD.left + (7 / (hours.length - 1)) * cw,
      y: PAD.top + 14,
      text: "Recovery Penalty Increases",
      anchor: "end" as const,
    },
  ];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="choose-line-svg">
      {/* grid lines */}
      {hours.map((_, i) => {
        const x = PAD.left + (i / (hours.length - 1)) * cw;
        return (
          <line
            key={i}
            x1={x}
            y1={PAD.top}
            x2={x}
            y2={PAD.top + ch}
            stroke="rgba(201,169,110,0.08)"
            strokeWidth="1"
          />
        );
      })}

      {/* lines */}
      {CHART_LINES.map((line) => (
        <g key={line.key}>
          <path
            d={smoothPath(normed[line.key])}
            fill="none"
            stroke={line.color}
            strokeWidth="2"
            opacity="0.85"
          />
          {normed[line.key].map(([x, y], i) => (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="3.5"
              fill={line.color}
              stroke="var(--bg-primary)"
              strokeWidth="1.5"
              opacity="0.9"
            />
          ))}
        </g>
      ))}

      {/* annotations */}
      {annotations.map((a, i) => (
        <text
          key={i}
          x={a.x}
          y={a.y}
          textAnchor={a.anchor}
          fill="var(--text-secondary)"
          fontSize="11"
          fontStyle="italic"
          opacity="0.7"
        >
          {a.text}
        </text>
      ))}

      {/* x-axis labels */}
      {hours.map((h, i) => {
        const x = PAD.left + (i / (hours.length - 1)) * cw;
        return (
          <text
            key={h}
            x={x}
            y={H - 8}
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

/* ── Metric card ── */

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="choose-metric-card">
      <div className="choose-metric-label">{label}</div>
      <div className="choose-metric-value">{value}</div>
      <div className="choose-metric-icon">{icon}</div>
    </div>
  );
}

/* ── Helpers ── */

function fmtBurden(cards: Record<string, unknown> | null | undefined): string {
  if (!cards) return "—";
  const v = Number(cards.total_expected_wait_min ?? 0);
  if (v > 8) return "(High!)";
  if (v > 3) return "(Mid)";
  return "(Low)";
}

function fmtUncertainty(
  cards: Record<string, unknown> | null | undefined,
): string {
  if (!cards) return "—";
  const v = Number(cards.mean_headway_gap_ratio ?? 0);
  return `${(v * 100).toFixed(1)}%`;
}

function fmtSupport(
  cards: Record<string, unknown> | null | undefined,
): string {
  if (!cards) return "—";
  const v = Number(cards.total_support_open ?? 0);
  return v === 0 ? "(None)" : String(v);
}

function fmtDuration(
  cards: Record<string, unknown> | null | undefined,
): string {
  if (!cards) return "—";
  const v = Number(cards.total_duration_min ?? 0);
  return v > 0 ? v.toFixed(2) : "—";
}

function fmtActivity(
  cards: Record<string, unknown> | null | undefined,
): string {
  if (!cards) return "—";
  const open = cards.open_count ?? cards.nearby_activity_open ?? null;
  const total = cards.total_count ?? cards.nearby_activity_total ?? null;
  if (open !== null && total !== null) return `${open}/${total}`;
  return "—";
}

function fmtLighting(
  cards: Record<string, unknown> | null | undefined,
): string {
  if (!cards) return "—";
  const v = cards.lamp_count ?? cards.lamp_density ?? null;
  if (v !== null) return String(Math.round(Number(v)));
  return "—";
}

/* ── Page ── */

export default function ChoosePage() {
  const [persona, setPersona] = useState<PersonaId>("student");
  const [curves, setCurves] = useState<Record<string, HourlyPoint | null>>({});
  const [rawCards, setRawCards] = useState<
    Record<string, Record<string, Record<string, unknown>> | null>
  >({});
  const [loading, setLoading] = useState(false);

  const preset = PRESET_ROUTES[persona];

  useEffect(() => {
    let stale = false;
    setLoading(true);
    api
      .compareCards(preset.origin, preset.dest, HOURS)
      .then((res) => {
        if (stale) return;
        const pts: Record<string, HourlyPoint | null> = {};
        const cards: Record<
          string,
          Record<string, Record<string, unknown>> | null
        > = {};
        for (const [t, opt] of Object.entries(res.options)) {
          if (!opt) {
            pts[t] = null;
            cards[t] = null;
            continue;
          }
          const c = opt.cards as Record<string, Record<string, unknown>>;
          pts[t] = {
            duration_min: Number(c.functional_cost?.total_duration_min ?? 0),
            waiting_burden: Number(
              c.waiting_burden?.total_expected_wait_min ?? 0,
            ),
            support_open: Number(c.support_access?.total_support_open ?? 0),
            recovery_penalty:
              Number(c.service_uncertainty?.mean_headway_gap_ratio ?? 0) * 5,
          };
          cards[t] = c;
        }
        setCurves(pts);
        setRawCards(cards);
        setLoading(false);
      })
      .catch(() => {
        if (!stale) {
          setCurves({});
          setRawCards({});
          setLoading(false);
        }
      });
    return () => {
      stale = true;
    };
  }, [preset.origin, preset.dest]);

  const refCards = rawCards["22:00"] ?? rawCards["21:00"] ?? null;

  return (
    <div className="choose-page">
      <div className="choose-map-bg" />

      <div className="choose-content">
        {/* ── Persona portrait cards ── */}
        <div className="choose-persona-row">
          {PERSONA_DEFS.map((p) => {
            const Portrait = PORTRAITS[p.id];
            return (
              <button
                key={p.id}
                className={`choose-persona-card ${persona === p.id ? "active" : ""}`}
                onClick={() => setPersona(p.id)}
              >
                <div className="choose-persona-portrait">
                  <Portrait />
                </div>
                <span className="choose-persona-name">[{p.label}]</span>
              </button>
            );
          })}
        </div>

        {/* ── Line chart ── */}
        <div className="choose-chart-section">
          <h3 className="choose-chart-title">
            Hourly Curves of extra journey burdens (18:00 - 02:00)
          </h3>
          {loading ? (
            <p className="choose-chart-loading">Loading hourly data…</p>
          ) : Object.keys(curves).length === 0 ? (
            <p className="choose-chart-loading">
              Start the backend to enable live queries.
            </p>
          ) : (
            <HourlyLineChart curves={curves} />
          )}
        </div>

        {/* ── Bottom metric cards ── */}
        <div className="choose-metrics-row">
          <MetricCard
            label="Functional Cost"
            value={fmtDuration(refCards?.functional_cost)}
            icon={<Bus size={18} />}
          />
          <MetricCard
            label="Waiting Burden"
            value={fmtBurden(refCards?.waiting_burden)}
            icon={<Clock3 size={18} />}
          />
          <MetricCard
            label="Service Uncertain"
            value={fmtUncertainty(refCards?.service_uncertainty)}
            icon={<CircleHelp size={18} />}
          />
          <MetricCard
            label="Support Access"
            value={fmtSupport(refCards?.support_access)}
            icon={<Users size={18} />}
          />
          <MetricCard
            label="Activity Context"
            value={fmtActivity(refCards?.activity_context)}
            icon={<Activity size={18} />}
          />
          <MetricCard
            label="Lighting Proxy"
            value={fmtLighting(refCards?.lighting_proxy)}
            icon={<Lightbulb size={18} />}
          />
        </div>

        {/* ── Navigation ── */}
        <div className="choose-nav">
          <Link
            href={`/compare?origin=${preset.origin}&originName=${encodeURIComponent(preset.oName)}&destination=${preset.dest}&destinationName=${encodeURIComponent(preset.dName)}&times=18:00,21:00,23:30`}
            className="choose-nav-btn"
          >
            Compare this journey →
          </Link>
          <Link href="/reflection" className="choose-nav-btn choose-nav-secondary">
            Reflection & limits
          </Link>
        </div>
      </div>

      <div className="choose-sparkle">
        <Star size={18} />
      </div>
    </div>
  );
}
