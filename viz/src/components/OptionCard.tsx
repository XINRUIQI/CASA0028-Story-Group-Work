"use client";

import type { CardData, Journey, JourneyRecoveryResult } from "@/lib/api";
import Link from "next/link";
import {
  Clock,
  Footprints,
  ArrowLeftRight,
  Timer,
  ShieldCheck,
  HelpCircle,
  LifeBuoy,
  AlertTriangle,
  Coins,
  Activity,
} from "lucide-react";

interface OptionCardProps {
  time: string;
  index: number;
  journey: Journey | null;
  cards?: Record<string, CardData>;
  recovery?: JourneyRecoveryResult | null;
  highlighted?: string[];
  origin?: string;
  destination?: string;
}

const LETTER = ["A", "B", "C", "D"];

/* ── Card‑shape typing helpers (cards come back loosely typed) ── */

interface WaitingBurdenCard {
  total_expected_wait_min?: number;
  max_single_wait_min?: number;
  wait_segments?: number;
}
interface SupportAccessCard {
  total_support_open?: number;
  total_support_all?: number;
  route_support_index?: number;
}
interface ServiceUncertaintyCard {
  uncertainty_score_pct?: number;
  uncertainty_label?: string;
  mean_headway_gap_ratio?: number | null;
}
interface ActivityContextCard {
  route_activity_index?: number;
}
interface SafetyExposureCard {
  safety_exposure_pct?: number | null;
  exposure_label?: string | null;
  route_crime_percentile?: number | null;
}

/* ── Formatting + tone helpers ─────────────────────────────── */

function formatNum(v: unknown, digits = 0): string {
  if (typeof v !== "number" || !Number.isFinite(v)) return "—";
  return v.toFixed(digits);
}

function titleCase(s?: string | null): string {
  if (!s) return "—";
  return s
    .split(/[_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}


// Tone for metrics where "high value = bad" (uncertainty, safety exposure).
function toneByScore(pct?: number | null): "good" | "warn" | "bad" {
  if (pct == null) return "warn";
  if (pct >= 60) return "bad";
  if (pct >= 30) return "warn";
  return "good";
}

// Tone for "minutes waited" metrics.
function toneByMinutes(min?: number | null, bad = 10, warn = 5): "good" | "warn" | "bad" {
  if (min == null) return "warn";
  if (min >= bad) return "bad";
  if (min >= warn) return "warn";
  return "good";
}

// Tone for "support count" — more = better.
function toneBySupport(open?: number | null): "good" | "warn" | "bad" {
  if (open == null) return "warn";
  if (open >= 8) return "good";
  if (open >= 3) return "warn";
  return "bad";
}

// Tone for recovery resilience.
function toneByResilience(label?: string): "good" | "warn" | "bad" {
  if (!label) return "warn";
  if (label.includes("high") || label === "no transfers") return "good";
  if (label === "moderate") return "warn";
  return "bad";
}

/* ── Component ─────────────────────────────────────────────── */

export default function OptionCard({
  time,
  index,
  journey,
  cards,
  recovery,
  highlighted = [],
  origin,
  destination,
}: OptionCardProps) {
  if (!journey) {
    return (
      <div className="card opacity-60">
        <h3 className="font-semibold text-lg mb-2">
          Option {LETTER[index]} · {time}
        </h3>
        <p style={{ color: "var(--text-muted)" }}>
          No route available for this departure time.
        </p>
      </div>
    );
  }

  const wb = (cards?.waiting_burden ?? {}) as WaitingBurdenCard & CardData;
  const sa = (cards?.support_access ?? {}) as SupportAccessCard & CardData;
  const su = (cards?.service_uncertainty ?? {}) as ServiceUncertaintyCard & CardData;
  const ac = (cards?.activity_context ?? {}) as ActivityContextCard & CardData;
  const se = (cards?.safety_exposure ?? {}) as SafetyExposureCard & CardData;

  const metrics = [
    {
      key: "duration",
      icon: <Clock size={14} />,
      label: "Total time",
      value: `${journey.duration_min} min`,
      tone: toneByMinutes(journey.duration_min, 60, 35),
      source: "functional_cost",
    },
    {
      key: "fare",
      icon: <Coins size={14} />,
      label: "Fare",
      value: journey.fare != null ? `£${(journey.fare / 100).toFixed(2)}` : "—",
      tone: "warn" as const,
      source: "functional_cost",
    },
    {
      key: "walking",
      icon: <Footprints size={14} />,
      label: "Walking (est.)",
      value: `~${Math.round(journey.walk_distance_m)} m`,
      tone: toneByMinutes(journey.walk_distance_m / 80, 12, 6),
      source: "functional_cost",
    },
    {
      key: "transfers",
      icon: <ArrowLeftRight size={14} />,
      label: "Transfers",
      value: String(journey.transfers),
      tone: journey.transfers >= 3 ? "bad" : journey.transfers >= 2 ? "warn" : "good",
      source: "functional_cost",
    },
    {
      key: "waiting",
      icon: <Timer size={14} />,
      label: "Waiting burden",
      value:
        wb.total_expected_wait_min != null
          ? `~${formatNum(wb.total_expected_wait_min, 1)} min`
          : "—",
      sub:
        wb.max_single_wait_min != null
          ? `Longest single wait ${formatNum(wb.max_single_wait_min, 1)} min`
          : undefined,
      tone: toneByMinutes(wb.total_expected_wait_min, 12, 5),
      source: "waiting_burden",
    },
    {
      key: "support",
      icon: <ShieldCheck size={14} />,
      label: "Support nearby",
      value:
        sa.total_support_open != null
          ? `${sa.total_support_open} open`
          : "—",
      sub:
        sa.route_support_index != null
          ? `Index ${formatNum(sa.route_support_index, 2)}`
          : sa.total_support_all != null
            ? `of ${sa.total_support_all} within 300 m`
            : undefined,
      tone: toneBySupport(sa.total_support_open),
      source: "support_access",
    },
    {
      key: "activity",
      icon: <Activity size={14} />,
      label: "Activity context",
      value:
        ac.route_activity_index != null
          ? `Index ${formatNum(ac.route_activity_index, 2)}`
          : "—",
      tone:
        ac.route_activity_index != null
          ? Number(ac.route_activity_index) >= 0.5
            ? "good"
            : Number(ac.route_activity_index) >= 0.2
              ? "warn"
              : "bad"
          : "warn",
      source: "activity_context",
    },
    {
      key: "uncertainty",
      icon: <HelpCircle size={14} />,
      label: "Service uncertainty",
      value: titleCase(su.uncertainty_label),
      sub:
        su.uncertainty_score_pct != null
          ? `Composite ${Math.round(su.uncertainty_score_pct)} / 100`
          : undefined,
      tone: toneByScore(su.uncertainty_score_pct),
      source: "service_uncertainty",
    },
    {
      key: "recovery",
      icon: <LifeBuoy size={14} />,
      label: "Recovery time",
      value:
        recovery?.mean_penalty_min != null
          ? `${formatNum(recovery.mean_penalty_min, 1)} min avg`
          : recovery?.overall_resilience === "no transfers"
            ? "No transfers"
            : "—",
      sub:
        recovery?.overall_resilience
          ? `Resilience: ${titleCase(recovery.overall_resilience)}`
          : undefined,
      tone: toneByResilience(recovery?.overall_resilience),
      source: "journey_recovery",
    },
    {
      key: "safety",
      icon: <AlertTriangle size={14} />,
      label: "Safety exposure",
      value: titleCase(se.exposure_label),
      sub:
        se.safety_exposure_pct != null
          ? `Corridor index ${Math.round(se.safety_exposure_pct)} / 100`
          : undefined,
      tone: toneByScore(se.safety_exposure_pct),
      source: "safety_exposure",
    },
  ];

  return (
    <div className="card flex flex-col">
      <h3 className="font-semibold text-lg mb-4">
        Option {LETTER[index]}{" "}
        <span style={{ color: "var(--accent-amber)" }}>· {time}</span>
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map((m) => {
          const isHi = highlighted.includes(m.key);
          const toneClass =
            m.tone === "bad"
              ? "option-metric--bad"
              : m.tone === "warn"
                ? "option-metric--warn"
                : "option-metric--good";
          return (
            <div
              key={m.key}
              className={`option-metric ${toneClass}`}
              style={{
                background: isHi
                  ? "rgba(201,169,110,0.1)"
                  : "var(--bg-secondary)",
                border: isHi
                  ? "1px solid var(--champagne-gold)"
                  : "1px solid transparent",
              }}
              title={`Source: ${m.source}`}
            >
              <div className="flex items-center gap-2">
                <span className="option-metric-icon">{m.icon}</span>
                <div className="min-w-0">
                  <div
                    className="text-xs truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {m.label}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {m.value}
                  </div>
                  {m.sub && (
                    <div
                      className="text-[10px] truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {m.sub}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {origin && destination && (
        <div className="mt-auto flex flex-col gap-2">
          <Link
            href={`/unpack?origin=${origin}&destination=${destination}&time=${time}`}
            className="btn-secondary text-center text-sm"
          >
            View journey breakdown
          </Link>
        </div>
      )}

    </div>
  );
}
