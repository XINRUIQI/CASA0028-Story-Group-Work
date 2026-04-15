"use client";

import { Journey } from "@/lib/api";
import {
  Clock,
  Footprints,
  ArrowLeftRight,
  Timer,
  ShieldCheck,
  Activity,
  HelpCircle,
  Coins,
} from "lucide-react";
import Link from "next/link";

interface OptionCardProps {
  time: string;
  index: number;
  journey: Journey | null;
  origin: string;
  destination: string;
  highlighted?: string[];
}

const LETTER = ["A", "B", "C", "D"];

export default function OptionCard({
  time,
  index,
  journey,
  origin,
  destination,
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
      value: journey.fare ? `£${(journey.fare / 100).toFixed(2)}` : "—",
    },
    {
      key: "walking",
      icon: <Footprints size={14} />,
      label: "Walking",
      value: `${Math.round(journey.walk_distance_m)} m`,
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
      value: "—",
    },
    {
      key: "support",
      icon: <ShieldCheck size={14} />,
      label: "Support nearby",
      value: "—",
    },
    {
      key: "activity",
      icon: <Activity size={14} />,
      label: "Activity context",
      value: "—",
    },
    {
      key: "uncertainty",
      icon: <HelpCircle size={14} />,
      label: "Service uncertainty",
      value: "—",
    },
  ];

  return (
    <div className="card flex flex-col">
      <h3 className="font-semibold text-lg mb-4">
        Option {LETTER[index]}{" "}
        <span style={{ color: "var(--accent-amber)" }}>· {time}</span>
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
