"use client";

import {
  Timer,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
  LifeBuoy,
  AlertTriangle,
  X,
} from "lucide-react";

interface MechanismsProps {
  onClose?: () => void;
}

interface MechanismEntry {
  key: string;
  icon: React.ReactNode;
  label: string;
  source: string;
  description: string;
  formula?: string;
}

const ENTRIES: MechanismEntry[] = [
  {
    key: "waiting",
    icon: <Timer size={16} />,
    label: "Wait Time",
    source: "SERVICE FREQUENCY + TRANSFER POINTS",
    description:
      "Estimates how long you may spend waiting at stations, stops, or transfer points.",
    formula: "Expected wait = half of the service interval at each waiting point",
  },
  {
    key: "support",
    icon: <ShieldCheck size={16} />,
    label: "Nearby Help",
    source: "NEARBY PLACES + OPENING STATUS",
    description:
      "Counts useful places that are still open near the route, such as shops, cafés, toilets, pharmacies, or AED points.",
    formula: "Nearby help = open support places within 300 m of route stops",
  },
  {
    key: "service",
    icon: <HelpCircle size={16} />,
    label: "Service Reliability",
    source: "LIVE SERVICE STATUS + TIMETABLE GAPS + RECOVERY TIME",
    description:
      "Shows how likely the service is to run as planned, and how much extra time you may need if something goes wrong.",
    formula: "Reliability risk = delays + disruptions + long service gaps + recovery penalty",
  },
  {
    key: "activity",
    icon: <Lightbulb size={16} />,
    label: "Activity Nearby",
    source: "NIGHT-TIME ACTIVITY + ROUTE CONTEXT",
    description:
      "Shows whether the areas around the route still feel active, quiet, or empty at that time of day.",
    formula: "Activity nearby = activity level around stops and walking sections",
  },
  {
    key: "recovery",
    icon: <LifeBuoy size={16} />,
    label: "Backup Options",
    source: "ALTERNATIVE SERVICES + MISSED CONNECTIONS + EXTRA WAIT TIME",
    description:
      "Estimates how easy it is to recover if a train is delayed, a bus is diverted, or a connection is missed.",
    formula: "Backup time = extra time needed to find the next workable option",
  },
  {
    key: "safety",
    icon: <AlertTriangle size={16} />,
    label: "Route Exposure",
    source: "SAFETY INCIDENT DATA + WALKING SECTIONS + ROUTE BUFFER",
    description:
      "Measures how much the route overlaps with areas of higher reported safety incidents after dark, especially along walking sections.",
    formula: "Route exposure = reported night-time incidents near the route",
  },
];

export default function Mechanisms({ onClose }: MechanismsProps) {
  return (
    <div className="mechanisms-panel">
      <div className="mechanisms-header">
        <div>
          <p className="section-label">Behind the scores</p>
          <h2 className="mechanisms-title">How the indicators are estimated</h2>
          <p className="mechanisms-sub">
            Each score is built from route, service, and nearby-context data. The aim is not to label one route as &ldquo;best&rdquo;, but to show what may become harder when you leave later.
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            className="mechanisms-close"
            onClick={onClose}
            aria-label="Close mechanisms"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mechanisms-grid">
        {ENTRIES.map((e) => (
          <div key={e.key} className="mechanisms-card">
            <div className="mechanisms-card-head">
              <span className="mechanisms-icon">{e.icon}</span>
              <span className="mechanisms-card-label">{e.label}</span>
            </div>
            <p className="mechanisms-desc">{e.description}</p>
            {e.formula && (
              <code className="mechanisms-formula">{e.formula}</code>
            )}
            <div className="mechanisms-source">DATA USED: {e.source}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
