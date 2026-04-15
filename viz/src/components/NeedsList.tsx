"use client";

import {
  Footprints,
  Clock,
  Lightbulb,
  Store,
  ShieldAlert,
  ArrowLeftRight,
} from "lucide-react";
import type { ContextTag } from "@/lib/types";
import type { ReactNode } from "react";

interface Need {
  icon: ReactNode;
  text: string;
  reason: string;
}

/**
 * Maps each user context to the needs it emphasises.
 * Multiple contexts can be active → union of needs.
 */
const NEED_MAP: Record<ContextTag, Need[]> = {
  "travelling-alone": [
    {
      icon: <Footprints size={16} />,
      text: "Less walking at night",
      reason: "Walking alone after dark feels more exposed.",
    },
    {
      icon: <Store size={16} />,
      text: "Open shops or cafés nearby",
      reason: "Somewhere to step into if needed.",
    },
  ],
  "returning-late": [
    {
      icon: <Clock size={16} />,
      text: "Less time waiting at stops",
      reason: "Late-night waits are longer and harder to recover from.",
    },
    {
      icon: <ShieldAlert size={16} />,
      text: "More reliable service",
      reason: "Missing the last connection could mean being stranded.",
    },
  ],
  "carrying-bags": [
    {
      icon: <Footprints size={16} />,
      text: "Shorter walking segments",
      reason: "Heavy bags make long walks exhausting.",
    },
    {
      icon: <ArrowLeftRight size={16} />,
      text: "Fewer interchanges",
      reason: "Each transfer with luggage costs time and energy.",
    },
  ],
  "unfamiliar-area": [
    {
      icon: <Lightbulb size={16} />,
      text: "Well-lit walking routes",
      reason: "Unfamiliar streets feel safer when lit.",
    },
    {
      icon: <ShieldAlert size={16} />,
      text: "Simpler, easier-to-follow routes",
      reason: "Complex transfers raise the cost of mistakes.",
    },
  ],
  commuting: [
    {
      icon: <Clock size={16} />,
      text: "Predictable journey time",
      reason: "Consistency matters more than absolute speed.",
    },
    {
      icon: <ShieldAlert size={16} />,
      text: "Good recovery if service disrupted",
      reason: "Backup options keep the commute manageable.",
    },
  ],
  "student-budget": [
    {
      icon: <Clock size={16} />,
      text: "Avoid costly missed connections",
      reason: "A missed bus may mean an expensive taxi.",
    },
    {
      icon: <Store size={16} />,
      text: "Access to support facilities",
      reason: "Public toilets, shelters, and open services matter.",
    },
  ],
};

interface NeedsListProps {
  selectedContexts: ContextTag[];
}

export default function NeedsList({ selectedContexts }: NeedsListProps) {
  // Collect unique needs from all selected contexts
  const seen = new Set<string>();
  const needs: Need[] = [];
  for (const ctx of selectedContexts) {
    for (const need of NEED_MAP[ctx] ?? []) {
      if (!seen.has(need.text)) {
        seen.add(need.text);
        needs.push(need);
      }
    }
  }

  if (needs.length === 0) {
    return (
      <div className="needs-empty">
        <p>Select one or more situations above to see what matters most.</p>
      </div>
    );
  }

  return (
    <div className="needs-list">
      <h3 className="needs-heading">I need...</h3>
      <ul className="needs-items">
        {needs.map((need) => (
          <li key={need.text} className="need-item">
            <span className="need-icon">{need.icon}</span>
            <div>
              <span className="need-text">{need.text}</span>
              <span className="need-reason">{need.reason}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
