"use client";

import type { PersonaId } from "@/components/PersonaSwitch";
import { CONTEXT_LABELS, type ContextTag } from "@/lib/types";

const IMG_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * "Follow X tonight" — narrative overlay shown at the top of /compare.
 * Anchors the data comparison in a specific protagonist, journey, and
 * context, so the panels below feel like a story rather than a tool.
 */

interface PersonaNarrativeMeta {
  /** First name. `null` for the custom traveller (no fictional name). */
  name: string | null;
  /** "Maya / James / …" or "You". */
  display: string;
  /** Pronoun pair: subject / object / possessive. */
  pronoun: { subject: string; possessive: string };
  /** Triggering action that sets up the journey. */
  setup: string;
  /** What this person worries about as they leave. */
  concern: string;
  image: string;
  accent: string;
}

const PERSONA_NARRATIVE: Record<PersonaId, PersonaNarrativeMeta> = {
  student: {
    name: "Maya",
    display: "Maya",
    pronoun: { subject: "she", possessive: "her" },
    setup: "has just finished studying late",
    concern: "what worries her most is a route that suddenly takes much longer",
    image: "/01_late_night_student.png",
    accent: "var(--champagne-gold)",
  },
  budget: {
    name: "James",
    display: "James",
    pronoun: { subject: "he", possessive: "his" },
    setup: "is heading back with two heavy bags",
    concern: "he wants less walking, less waiting, fewer changes",
    image: "/02_passenger_with_luggage.png",
    accent: "var(--accent-amber)",
  },
  nightworker: {
    name: "Aisha",
    display: "Aisha",
    pronoun: { subject: "she", possessive: "her" },
    setup: "has just clocked off a long night shift",
    concern: "she needs services that still run, and that she can rely on",
    image: "/03_night_shift_worker.png",
    accent: "var(--accent-emerald)",
  },
  unfamiliar: {
    name: "Tom",
    display: "Tom",
    pronoun: { subject: "he", possessive: "his" },
    setup: "is heading back at the end of his first day in London",
    concern:
      "he wants a simple route — and someone nearby in case something goes wrong",
    image: "/04_first_time_visitor.png",
    accent: "var(--accent-rose)",
  },
  custom: {
    name: null,
    display: "You",
    pronoun: { subject: "you", possessive: "your" },
    setup: "are mapping a journey of your own",
    concern: "you can compare departure times to see how the trip changes",
    image: "/05_custom_traveller.png",
    accent: "var(--text-secondary)",
  },
};

/* Time-of-night strings rotate slightly per persona so the page does not
   feel templated when users switch between them. */
const PERSONA_TIME: Record<PersonaId, string> = {
  student: "23:47",
  budget: "21:18",
  nightworker: "00:32",
  unfamiliar: "22:05",
  custom: "tonight",
};

/* Map context tags to short narrative phrases that flow inside a sentence. */
const CONTEXT_PHRASES: Record<ContextTag, string> = {
  "travelling-alone": "travelling alone",
  "returning-late": "heading home late",
  "carrying-bags": "carrying bags",
  "unfamiliar-area": "in an area she barely knows",
  commuting: "after a long day at work",
  "student-budget": "watching every fare",
};

/* Pronoun-aware version for "her → his/their" inside phrases. */
function rewriteContextPhrase(phrase: string, possessive: string): string {
  if (possessive === "her") return phrase;
  return phrase.replace(/\bshe\b/g, possessive === "his" ? "he" : "they")
    .replace(/\bher\b/g, possessive);
}

interface JourneyNarrativeProps {
  persona: PersonaId | null;
  originName: string;
  destinationName: string;
  contexts: ContextTag[];
}

export default function JourneyNarrative({
  persona,
  originName,
  destinationName,
  contexts,
}: JourneyNarrativeProps) {
  const id: PersonaId = persona ?? "student";
  const meta = PERSONA_NARRATIVE[id];
  const time = PERSONA_TIME[id];

  const contextPhrases = contexts
    .map((c) => rewriteContextPhrase(CONTEXT_PHRASES[c], meta.pronoun.possessive))
    .filter(Boolean);
  const contextClause =
    contextPhrases.length === 0
      ? ""
      : contextPhrases.length === 1
        ? `, ${contextPhrases[0]}`
        : `, ${contextPhrases.slice(0, -1).join(", ")} and ${contextPhrases[contextPhrases.length - 1]}`;

  const opener =
    id === "custom"
      ? `${meta.display} ${meta.setup}${contextClause}.`
      : `It's ${time}. ${meta.display} ${meta.setup} at ${originName}${contextClause}.`;

  const heading =
    id === "custom"
      ? "Trace your route tonight"
      : `Follow ${meta.display} tonight`;

  return (
    <div className="jn-card" style={{ borderLeftColor: meta.accent }}>
      <div className="jn-portrait" aria-hidden>
        <img
          src={`${IMG_PREFIX}${meta.image}`}
          alt=""
          className="jn-portrait-img"
        />
        <span
          className="jn-portrait-glow"
          style={{ background: meta.accent, opacity: 0.18 }}
        />
      </div>

      <div className="jn-body">
        <p className="jn-kicker" style={{ color: meta.accent }}>
          <span className="jn-kicker-dot" style={{ background: meta.accent }} />
          {heading}
        </p>

        <p className="jn-narrative">
          <span className="jn-narrative-line">{opener}</span>{" "}
          {id === "custom" ? null : (
            <span className="jn-narrative-line">
              {capitalise(meta.pronoun.subject)} is heading home to{" "}
              <strong className="jn-place">{destinationName}</strong>, and{" "}
              {meta.concern}.
            </span>
          )}
        </p>

        <p className="jn-cta">
          Below: how the same trip changes when {meta.pronoun.subject} leaves
          earlier — or later.
        </p>
      </div>
    </div>
  );
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
