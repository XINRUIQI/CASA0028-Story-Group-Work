"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Coins, Briefcase, MapPinOff } from "lucide-react";

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
    originName: "Euston Square",
    originId: "940GZZLUESQ",
    destName: "Seven Sisters",
    destId: "940GZZLUSEV",
    times: "18:00,21:00,23:30",
    accentColor: "var(--accent-blue)",
  },
  {
    id: "budget",
    icon: <Coins size={18} />,
    label: "Budget traveller",
    description: "Stratford to Brixton — cheapest late options",
    originName: "Stratford",
    originId: "940GZZLUSTD",
    destName: "Brixton",
    destId: "940GZZLUBXN",
    times: "18:00,21:00,23:30",
    accentColor: "var(--accent-amber)",
  },
  {
    id: "nightworker",
    icon: <Briefcase size={18} />,
    label: "Night-shift worker",
    description: "King's Cross to Barking — finishing late",
    originName: "King's Cross",
    originId: "940GZZLUKSX",
    destName: "Barking",
    destId: "940GZZLUBKG",
    times: "22:00,23:30,01:00",
    accentColor: "var(--accent-emerald)",
  },
  {
    id: "unfamiliar",
    icon: <MapPinOff size={18} />,
    label: "Unfamiliar traveller",
    description: "Paddington to Greenwich — first time in London",
    originName: "Paddington",
    originId: "940GZZLUPAC",
    destName: "Greenwich",
    destId: "940GZZLUGR",
    times: "18:00,21:00,23:30",
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
