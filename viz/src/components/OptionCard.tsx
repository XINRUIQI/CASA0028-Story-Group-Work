"use client";

import type { CardData, Journey, JourneyRecoveryResult } from "@/lib/api";
import {
  Timer,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  LifeBuoy,
  AlertTriangle,
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
}
interface ServiceUncertaintyCard {
  uncertainty_score_pct?: number;
  uncertainty_label?: string;
  mean_headway_gap_ratio?: number | null;
}
interface LightingProxyCard {
  label?: string;
  mean_lamps_per_walk?: number;
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

/**
 * Map a qualitative label ("low" | "moderate" | "high" | "very high",
 * "easy" | "manageable" | "difficult" | "very difficult", etc.) to a
 * tone bucket the UI uses for color.
 */
function toneFromLabel(label?: string | null): "good" | "warn" | "bad" {
  const s = (label || "").toLowerCase();
  if (["low", "lower", "easy", "high resilience", "high"].includes(s)) {
    // "high" on resilience = good, but "high" on uncertainty = bad.
    // We pick tone from the specific metric — see below; this is just fallback.
    return "good";
  }
  if (s.includes("moderate") || s.includes("manageable")) return "warn";
  if (s.includes("very") || s === "bad" || s === "low")  return "bad";
  if (s.includes("difficult") || s === "sparse") return "bad";
  return "warn";
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

// Tone for lighting label.
function toneByLighting(label?: string): "good" | "warn" | "bad" {
  if (!label) return "warn";
  if (label.startsWith("well")) return "good";
  if (label.startsWith("moderate")) return "warn";
  return "bad"; // sparse / none
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
  const lp = (cards?.lighting_proxy ?? {}) as LightingProxyCard & CardData;
  const se = (cards?.safety_exposure ?? {}) as SafetyExposureCard & CardData;

  const metrics = [
    {
      key: "waiting",
      icon: <Timer size={14} />,
      label: "Waiting Time at stations",
      value:
        wb.total_expected_wait_min != null
          ? `${formatNum(wb.total_expected_wait_min, 1)} min`
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
        sa.total_support_all != null
          ? `of ${sa.total_support_all} within 300 m`
          : undefined,
      tone: toneBySupport(sa.total_support_open),
      source: "support_access",
    },
    {
      key: "service",
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
      key: "lighting",
      icon: <Lightbulb size={14} />,
      label: "Lighting proxy",
      value: titleCase(lp.label),
      sub:
        lp.mean_lamps_per_walk != null
          ? `${formatNum(lp.mean_lamps_per_walk, 1)} lamps / walk`
          : undefined,
      tone: toneByLighting(lp.label),
      source: "lighting_proxy",
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
      label: "Safety Exposure Level",
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

    </div>
  );
}
