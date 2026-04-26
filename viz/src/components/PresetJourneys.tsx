"use client";

import { useRouter } from "next/navigation";

const IMG_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface PresetRoute {
  id: string;
  image: string;
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
    image: "/01_late_night_student.png",
    label: "Late-night Student",
    description: "UCL to Seven Sisters — returning from the library",
    originName: "Euston Square",
    originId: "940GZZLUESQ",
    destName: "Seven Sisters",
    destId: "HUBSVS",
    times: "18:00,21:00,23:30",
    accentColor: "var(--champagne-gold)",
  },
  {
    id: "budget",
    image: "/02_passenger_with_luggage.png",
    label: "Passenger with Luggage",
    description: "Stratford to Brixton — less walking, fewer changes",
    originName: "Stratford",
    originId: "940GZZLUSTD",
    destName: "Brixton",
    destId: "940GZZLUBXN",
    times: "18:00,21:00,23:30",
    accentColor: "var(--accent-amber)",
  },
  {
    id: "nightworker",
    image: "/03_night_shift_worker.png",
    label: "Night-shift Worker",
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
    image: "/04_first_time_visitor.png",
    label: "First-time Visitor",
    description: "Liverpool Street to Greenwich — first time in London",
    originName: "Liverpool Street",
    originId: "940GZZLULVT",
    destName: "Greenwich",
    destId: "940GZZDLGRE",
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
          <img
            src={`${IMG_PREFIX}${p.image}`}
            alt={p.label}
            className="preset-persona-img"
          />
          <span className="preset-label">{p.label}</span>
          <span className="preset-desc">{p.description}</span>
        </button>
      ))}
    </div>
  );
}
