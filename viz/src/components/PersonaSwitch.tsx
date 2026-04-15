"use client";

import { GraduationCap, Coins, Briefcase, MapPinOff } from "lucide-react";
import type { ReactNode } from "react";

export type PersonaId = "student" | "budget" | "nightworker" | "unfamiliar";

interface PersonaDef {
  id: PersonaId;
  icon: ReactNode;
  label: string;
  accent: string;
  focusDimensions: string[];
  insight: string;
}

export const PERSONA_DEFS: PersonaDef[] = [
  {
    id: "student",
    icon: <GraduationCap size={16} />,
    label: "Late-night student",
    accent: "var(--accent-blue)",
    focusDimensions: ["waiting_burden", "activity_context"],
    insight: "Waiting alone matters most. Activity and 'someone around' feeling are key.",
  },
  {
    id: "budget",
    icon: <Coins size={16} />,
    label: "Budget traveller",
    accent: "var(--accent-amber)",
    focusDimensions: ["functional_cost", "service_uncertainty"],
    insight: "Fare penalties and missed-connection recovery cost are the main concern.",
  },
  {
    id: "nightworker",
    icon: <Briefcase size={16} />,
    label: "Night-shift worker",
    accent: "var(--accent-emerald)",
    focusDimensions: ["service_uncertainty", "waiting_burden"],
    insight: "Service reliability and late-hour continuity are what this traveller needs.",
  },
  {
    id: "unfamiliar",
    icon: <MapPinOff size={16} />,
    label: "Unfamiliar traveller",
    accent: "var(--accent-rose)",
    focusDimensions: ["functional_cost", "support_access"],
    insight: "Transfer complexity and error recovery dominate the experience.",
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
            {p.icon}
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
