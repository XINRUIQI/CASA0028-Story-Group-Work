"use client";

import type { ReactNode } from "react";

export interface Persona {
  id: string;
  icon: ReactNode;
  title: string;
  who: string;
  situation: string;
  concerns: string[];
  accentColor: string;
}

interface PersonaCardProps {
  persona: Persona;
  selected: boolean;
  onSelect: (id: string) => void;
}

export default function PersonaCard({
  persona,
  selected,
  onSelect,
}: PersonaCardProps) {
  return (
    <button
      onClick={() => onSelect(persona.id)}
      className="persona-card"
      style={{
        borderColor: selected ? persona.accentColor : "var(--border-subtle)",
        background: selected
          ? `${persona.accentColor}12`
          : "var(--bg-card)",
      }}
    >
      <div
        className="persona-icon"
        style={{ background: `${persona.accentColor}18` }}
      >
        {persona.icon}
      </div>
      <h3 className="persona-title">{persona.title}</h3>
      <p className="persona-who">{persona.who}</p>
      <p className="persona-situation">{persona.situation}</p>
      <ul className="persona-concerns">
        {persona.concerns.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
    </button>
  );
}
