"use client";

import { CardData, Journey } from "@/lib/api";
import {
  Clock,
  Footprints,
  ArrowLeftRight,
  Timer,
  ShieldAlert,
  ShieldCheck,
  Activity,
  HelpCircle,
  Coins,
} from "lucide-react";
import Link from "next/link";
import { formatDisplayTime } from "@/lib/journeyPresets";
import { normalizeServiceUncertainty } from "@/lib/serviceUncertainty";

interface OptionCardProps {
  time: string;
  index: number;
  journey: Journey | null;
  cards?: Record<string, CardData>;
  origin: string;
  destination: string;
  highlighted?: string[];
}

const LETTER = ["A", "B", "C", "D"];

export default function OptionCard({
  time,
  index,
  journey,
  cards,
  origin,
  destination,
  highlighted = [],
}: OptionCardProps) {
  if (!journey) {
    return (
      <div className="card opacity-60">
        <h3 className="font-semibold text-lg mb-2">
          Time {LETTER[index]} · {formatDisplayTime(time)}
        </h3>
        <p style={{ color: "var(--text-muted)" }}>
          No route available for this departure time.
        </p>
      </div>
    );
  }

  const waitingCard = cards?.waiting_burden as {
    total_expected_wait_min?: number;
  } | undefined;
  const supportCard = cards?.support_access as {
    total_support_open?: number;
    route_support_index?: number;
  } | undefined;
  const activityCard = cards?.activity_context as {
    route_activity_index?: number;
  } | undefined;
  const safetyCard = cards?.safety_exposure as {
    safety_exposure_pct?: number;
    exposure_label?: string;
    safety_exposure_label?: string;
    route_safety_index?: number;
  } | undefined;
  const uncertainty = normalizeServiceUncertainty(
    cards?.service_uncertainty,
    journey.transfers,
  );

  const waitingText = waitingCard?.total_expected_wait_min != null
    ? `~${Number(waitingCard.total_expected_wait_min).toFixed(1).replace(/\.0$/, "")} min`
    : "—";
  const supportText = supportCard?.total_support_open != null
    ? `${Number(supportCard.total_support_open)} open`
    : supportCard?.route_support_index != null
      ? `Index ${Number(supportCard.route_support_index).toFixed(2)}`
      : "—";
  const activityText = activityCard?.route_activity_index != null
    ? `Index ${Number(activityCard.route_activity_index).toFixed(2)}`
    : "—";
  const safetyLabel = safetyCard?.exposure_label ?? safetyCard?.safety_exposure_label;
  const safetyText = safetyCard?.safety_exposure_pct != null
    ? `${Math.round(Number(safetyCard.safety_exposure_pct))}% exposure${safetyLabel ? ` · ${String(safetyLabel)}` : ""}`
    : safetyCard?.route_safety_index != null
      ? `Safety ${Number(safetyCard.route_safety_index).toFixed(2)}`
      : "—";
  const uncertaintyText = uncertainty.scorePct != null
    ? `${Math.round(uncertainty.scorePct)}% index${uncertainty.label ? ` · ${uncertainty.label}` : ""}`
    : "—";

  const metrics = [
    {
      key: "duration",
      icon: <Clock size={14} />,
      label: "Total time",
      value: `${journey.duration_min} min`,
    },
    {
      key: "fare",
      icon: <Coins size={14} />,
      label: "Fare",
      value: journey.fare != null ? `£${(journey.fare / 100).toFixed(2)}` : "—",
    },
    {
      key: "walking",
      icon: <Footprints size={14} />,
      label: "Walking (est.)",
      value: `~${Math.round(journey.walk_distance_m)} m`,
    },
    {
      key: "transfers",
      icon: <ArrowLeftRight size={14} />,
      label: "Transfers",
      value: String(journey.transfers),
    },
    {
      key: "waiting",
      icon: <Timer size={14} />,
      label: "Waiting burden",
      value: waitingText,
    },
    {
      key: "support",
      icon: <ShieldCheck size={14} />,
      label: "Support nearby",
      value: supportText,
    },
    {
      key: "activity",
      icon: <Activity size={14} />,
      label: "Activity context",
      value: activityText,
    },
    {
      key: "safety",
      icon: <ShieldAlert size={14} />,
      label: "Safety exposure",
      value: safetyText,
    },
    {
      key: "uncertainty",
      icon: <HelpCircle size={14} />,
      label: "Service uncertainty index",
      value: uncertaintyText,
    },
  ];

  return (
    <div className="card flex flex-col">
      <h3 className="font-semibold text-lg mb-4">
        Time {LETTER[index]}{" "}
        <span style={{ color: "var(--accent-amber)" }}>· {formatDisplayTime(time)}</span>
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {metrics.map((m) => (
          <div
            key={m.key}
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: highlighted.includes(m.key)
                ? "rgba(201,169,110,0.1)"
                : "var(--bg-secondary)",
              border: highlighted.includes(m.key)
                ? "1px solid var(--champagne-gold)"
                : "1px solid transparent",
            }}
          >
            <span style={{ color: "var(--text-muted)" }}>{m.icon}</span>
            <div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                {m.label}
              </div>
              <div className="text-sm font-medium">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          href={`/unpack?origin=${origin}&destination=${destination}&time=${time}`}
          className="btn-secondary text-center text-sm"
        >
          View journey breakdown
        </Link>
      </div>
    </div>
  );
}
