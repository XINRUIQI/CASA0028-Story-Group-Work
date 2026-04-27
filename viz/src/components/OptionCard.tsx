"use client";

import type { CardData, Journey, JourneyRecoveryResult } from "@/lib/api";
import {
  Timer,
  ShieldCheck,
  HelpCircle,
  LifeBuoy,
  AlertTriangle,
  Activity,
} from "lucide-react";

interface OptionCardProps {
  time: string;
  index: number;
  journey: Journey | null;
  cards?: Record<string, CardData>;
  recovery?: JourneyRecoveryResult | null;
  highlighted?: string[];
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
  fallback_lines_total?: number | null;
  mean_alternative_routes?: number | null;
  transfer_count?: number | null;
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

function asFiniteNumber(value: unknown): number | null {
  if (value == null || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
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

function toneByRecoveryMinutes(minutes?: number | null): "good" | "warn" | "bad" {
  if (minutes == null) return "warn";
  if (minutes >= 15) return "bad";
  if (minutes >= 8) return "warn";
  return "good";
}

function buildRecoveryDisplay(
  journey: Journey,
  waitingBurden: WaitingBurdenCard,
  serviceUncertainty: ServiceUncertaintyCard,
  recovery?: JourneyRecoveryResult | null,
): { value: string; sub?: string; tone: "good" | "warn" | "bad" } {
  if (recovery?.mean_penalty_min != null) {
    return {
      value: `${formatNum(recovery.mean_penalty_min, 1)} min avg`,
      tone: toneByResilience(recovery.overall_resilience),
    };
  }

  if (recovery?.overall_resilience === "no transfers" || journey.transfers === 0) {
    return {
      value: "No transfers",
      tone: "good",
    };
  }

  const maxSingleWait = asFiniteNumber(waitingBurden.max_single_wait_min);
  const totalWait = asFiniteNumber(waitingBurden.total_expected_wait_min);
  const waitSegments = Math.max(1, asFiniteNumber(waitingBurden.wait_segments) ?? 1);
  const fallbackLines = asFiniteNumber(serviceUncertainty.fallback_lines_total);
  const alternatives = asFiniteNumber(serviceUncertainty.mean_alternative_routes);
  const transferCount = asFiniteNumber(serviceUncertainty.transfer_count) ?? journey.transfers;
  const expectedSingleWait = maxSingleWait ?? (totalWait != null ? totalWait / waitSegments : null);

  if (expectedSingleWait == null) {
    return {
      value: "Not returned",
      tone: "warn",
    };
  }

  let estimate = expectedSingleWait * 2;
  if (fallbackLines != null && fallbackLines <= 0) estimate *= 1.25;
  else if (alternatives != null && alternatives >= 10) estimate *= 0.9;
  estimate += Math.max(0, transferCount - 1);

  const rounded = Math.max(1, Math.round(estimate));
  return {
    value: `~${rounded} min est.`,
    tone: toneByRecoveryMinutes(rounded),
  };
}

/* ── Component ─────────────────────────────────────────────── */

export default function OptionCard({
  time,
  index,
  journey,
  cards,
  recovery,
  highlighted = [],
}: OptionCardProps) {
  const displayTime = time === "00:00" ? "24:00" : time;

  if (!journey) {
    return (
      <div className="card opacity-60">
        <h3 className="font-semibold text-lg mb-2">
          Option {LETTER[index]} · {displayTime}
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
  const recoveryDisplay = buildRecoveryDisplay(journey, wb, su, recovery);

  const metrics = [
    {
      key: "waiting",
      icon: <Timer size={14} />,
      label: "Wait Time",
      value:
        wb.total_expected_wait_min != null
          ? `~${formatNum(wb.total_expected_wait_min, 1)} min`
          : "—",
      tone: toneByMinutes(wb.total_expected_wait_min, 12, 5),
      source: "waiting_burden",
    },
    {
      key: "support",
      icon: <ShieldCheck size={14} />,
      label: "Nearby Help",
      value:
        sa.total_support_open != null
          ? `${sa.total_support_open} open`
          : "—",
      tone: toneBySupport(sa.total_support_open),
      source: "support_access",
    },
    {
      key: "activity",
      icon: <Activity size={14} />,
      label: "Activity Nearby",
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
      label: "Service Reliability",
      value:
        su.uncertainty_score_pct != null
          ? `${Math.round(su.uncertainty_score_pct)}%`
          : titleCase(su.uncertainty_label),
      tone: toneByScore(su.uncertainty_score_pct),
      source: "service_uncertainty",
    },
    {
      key: "recovery",
      icon: <LifeBuoy size={14} />,
      label: "Backup Options",
      value: recoveryDisplay.value,
      sub: recoveryDisplay.sub,
      tone: recoveryDisplay.tone,
      source: "journey_recovery",
    },
    {
      key: "safety",
      icon: <AlertTriangle size={14} />,
      label: "Route Exposure",
      value:
        se.safety_exposure_pct != null
          ? `${Math.round(se.safety_exposure_pct)}%`
          : titleCase(se.exposure_label),
      tone: toneByScore(se.safety_exposure_pct),
      source: "safety_exposure",
    },
  ];

  return (
    <div className="card option-card">
      <h3 className="font-semibold text-lg mb-4">
        Option {LETTER[index]}{" "}
        <span style={{ color: "var(--accent-amber)" }}>· {displayTime}</span>
      </h3>

      <div className="option-metrics-grid">
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
              <div className="option-metric-inner">
                <div className="text-sm font-semibold truncate option-metric-label">
                  {m.label}
                </div>
                <div className="option-metric-value-row">
                  <span className="option-metric-icon">{m.icon}</span>
                  <span className="text-sm font-semibold truncate">
                    {m.value}
                  </span>
                </div>
                {m.sub && (
                  <div
                    className="text-xs truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {m.sub}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
