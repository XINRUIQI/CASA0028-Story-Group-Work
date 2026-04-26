"use client";

import type { ReactNode } from "react";

const IMG_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

export type PresetPersonaId = "student" | "budget" | "nightworker" | "unfamiliar";
export type PersonaId = PresetPersonaId | "custom";

interface PersonaDef {
  id: PersonaId;
  icon: ReactNode;
  image: string;
  label: string;
  accent: string;
  focusDimensions: string[];
  insight: string;
  need: string;
}

export interface PersonaRoute {
  origin: string;
  dest: string;
  oName: string;
  dName: string;
}

export const PERSONA_ROUTES: Record<PresetPersonaId, PersonaRoute> = {
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
    origin: "940GZZLULVT",
    dest: "940GZZDLGRE",
    oName: "Liverpool Street",
    dName: "Greenwich",
  },
};

function PersonaImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img
      src={`${IMG_PREFIX}${src}`}
      alt={alt}
      style={{ width: 16, height: 16, borderRadius: 4, objectFit: "cover" }}
    />
  );
}

export const PERSONA_DEFS: PersonaDef[] = [
  {
    id: "student",
    icon: <PersonaImg src="/01_late_night_student.png" alt="Student" />,
    image: "/01_late_night_student.png",
    label: "Late-night Student",
    accent: "var(--champagne-gold)",
    focusDimensions: ["waiting_burden", "activity_context"],
    insight: "Journey time predictability matters most. A route that suddenly takes much longer is the real worry.",
    need: "I need a way home after studying late — without the journey suddenly taking much longer.",
  },
  {
    id: "budget",
    icon: <PersonaImg src="/02_passenger_with_luggage.png" alt="Luggage" />,
    image: "/02_passenger_with_luggage.png",
    label: "Passenger with Luggage",
    accent: "var(--accent-amber)",
    focusDimensions: ["functional_cost", "waiting_burden"],
    insight: "Physical burden matters most. Walking distance, waiting time and number of changes all hit harder with luggage.",
    need: "I'm carrying luggage — I need less walking, less waiting, and fewer changes.",
  },
  {
    id: "nightworker",
    icon: <PersonaImg src="/03_night_shift_worker.png" alt="Night worker" />,
    image: "/03_night_shift_worker.png",
    label: "Night-shift Worker",
    accent: "var(--accent-emerald)",
    focusDimensions: ["service_uncertainty", "waiting_burden"],
    insight: "Service reliability and late-hour continuity are what this traveller needs.",
    need: "I need services that still run when my shift ends — and that I can rely on.",
  },
  {
    id: "unfamiliar",
    icon: <PersonaImg src="/04_first_time_visitor.png" alt="Visitor" />,
    image: "/04_first_time_visitor.png",
    label: "First-time Visitor",
    accent: "var(--accent-rose)",
    focusDimensions: ["functional_cost", "support_access"],
    insight: "Transfer complexity and wayfinding support dominate the experience.",
    need: "I need a simple route — and help nearby if I get lost or feel unsure.",
  },
  {
    id: "custom",
    icon: <PersonaImg src="/05_custom_traveller.png" alt="Custom" />,
    image: "/05_custom_traveller.png",
    label: "Custom Traveller",
    accent: "var(--text-secondary)",
    focusDimensions: [],
    insight: "Choose your own route to explore how journey burdens change through the night.",
    need: "I want to explore a specific route — pick your own origin and destination.",
  },
];

interface PersonaSwitchProps {
  active: PersonaId;
  onChange: (id: PersonaId) => void;
}

export default function PersonaSwitch({ active, onChange }: PersonaSwitchProps) {
  const activeDef = PERSONA_DEFS.find((p) => p.id === active)!;

  return (
    <div className="persona-switch">
      <div className="persona-switch-tabs">
        {PERSONA_DEFS.map((p) => (
          <button
            key={p.id}
            className={`persona-switch-btn ${active === p.id ? "active" : ""}`}
            onClick={() => onChange(p.id)}
            style={
              active === p.id
                ? { borderColor: p.accent, color: p.accent }
                : undefined
            }
          >
            <img
              src={`${IMG_PREFIX}${p.image}`}
              alt={p.label}
              className="persona-switch-img"
            />
            <span>{p.label}</span>
          </button>
        ))}
      </div>

      <div
        className="persona-switch-insight"
        style={{ borderLeftColor: activeDef.accent }}
      >
        <p>{activeDef.insight}</p>
        <p className="persona-switch-focus">
          Focus dimensions:{" "}
          {activeDef.focusDimensions
            .map((d) => d.replace(/_/g, " "))
            .join(", ")}
        </p>
      </div>
    </div>
  );
}
