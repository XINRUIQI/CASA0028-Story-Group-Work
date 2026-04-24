"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Coins, Briefcase, MapPinOff } from "lucide-react";
import {
  COMPARE_TIMES,
  FIXED_ROUTE_PRESETS,
  encodeCompareTimes,
} from "@/lib/journeyPresets";

interface PresetRoute {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  originName: string;
  originId: string;
  destName: string;
  destId: string;
  times: string;
  accentColor: string;
}

const PRESETS: PresetRoute[] = [
  {
    id: "student",
    icon: <GraduationCap size={18} />,
    label: "Late-night student",
    description: "UCL to Seven Sisters — returning from the library",
    originName: FIXED_ROUTE_PRESETS.student.originName,
    originId: FIXED_ROUTE_PRESETS.student.origin,
    destName: FIXED_ROUTE_PRESETS.student.destinationName,
    destId: FIXED_ROUTE_PRESETS.student.destination,
    times: encodeCompareTimes(COMPARE_TIMES),
    accentColor: "var(--champagne-gold)",
  },
  {
    id: "budget",
    icon: <Coins size={18} />,
    label: "Budget traveller",
    description: "Stratford to Brixton — cheapest late options",
    originName: FIXED_ROUTE_PRESETS.budget.originName,
    originId: FIXED_ROUTE_PRESETS.budget.origin,
    destName: FIXED_ROUTE_PRESETS.budget.destinationName,
    destId: FIXED_ROUTE_PRESETS.budget.destination,
    times: encodeCompareTimes(COMPARE_TIMES),
    accentColor: "var(--accent-amber)",
  },
  {
    id: "nightworker",
    icon: <Briefcase size={18} />,
    label: "Night-shift worker",
    description: "King's Cross to Barking — finishing late",
    originName: FIXED_ROUTE_PRESETS.nightworker.originName,
    originId: FIXED_ROUTE_PRESETS.nightworker.origin,
    destName: FIXED_ROUTE_PRESETS.nightworker.destinationName,
    destId: FIXED_ROUTE_PRESETS.nightworker.destination,
    times: encodeCompareTimes(COMPARE_TIMES),
    accentColor: "var(--accent-emerald)",
  },
  {
    id: "unfamiliar",
    icon: <MapPinOff size={18} />,
    label: "Unfamiliar traveller",
    description: "Liverpool Street to Greenwich — first time in London",
    originName: FIXED_ROUTE_PRESETS.unfamiliar.originName,
    originId: FIXED_ROUTE_PRESETS.unfamiliar.origin,
    destName: FIXED_ROUTE_PRESETS.unfamiliar.destinationName,
    destId: FIXED_ROUTE_PRESETS.unfamiliar.destination,
    times: encodeCompareTimes(COMPARE_TIMES),
    accentColor: "var(--accent-rose)",
  },
];

export default function PresetJourneys() {
  const router = useRouter();

  const handleClick = (p: PresetRoute) => {
    const params = new URLSearchParams({
      origin: p.originId,
      originName: p.originName,
      destination: p.destId,
      destinationName: p.destName,
      times: p.times,
      contexts: "",
    });
    router.push(`/compare?${params.toString()}`);
  };

  return (
    <div className="preset-grid">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          className="preset-card"
          onClick={() => handleClick(p)}
        >
          <span className="preset-icon" style={{ color: p.accentColor }}>
            {p.icon}
          </span>
          <span className="preset-label">{p.label}</span>
          <span className="preset-desc">{p.description}</span>
        </button>
      ))}
    </div>
  );
}
