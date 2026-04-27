"use client";

import { useState } from "react";
import { AlertTriangle, Clock, Route, ShieldCheck } from "lucide-react";
import { api, type Leg, type MissedConnectionResult } from "@/lib/api";

interface MissedConnectionProps {
  legs: Leg[];
  time: string;
}

export default function MissedConnection({ legs, time }: MissedConnectionProps) {
  const [result, setResult] = useState<MissedConnectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedLeg, setSelectedLeg] = useState<number | null>(null);

  const transitLegs = legs
    .map((leg, i) => ({ leg, i }))
    .filter(({ leg }) => !leg.is_walking && leg.line_id);

  if (transitLegs.length === 0) return null;

  const handleSimulate = async (legIndex: number, leg: Leg) => {
    setSelectedLeg(legIndex);
    setLoading(true);
    try {
      const res = await api.getMissedConnection(
        leg.departure_point.naptan_id,
        leg.line_id,
        time,
        leg.departure_point.lat ?? 0,
        leg.departure_point.lon ?? 0,
      );
      setResult(res);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor: Record<string, string> = {
    easy: "var(--accent-emerald)",
    manageable: "var(--champagne-gold)",
    difficult: "var(--accent-amber)",
    "very difficult": "var(--accent-rose)",
  };

  return (
    <div className="missed-wrap">
      <div className="missed-header">
        <AlertTriangle size={18} style={{ color: "var(--accent-amber)" }} />
        <div>
          <h4 className="missed-title">What if you miss a connection?</h4>
          <p className="missed-subtitle">
            Click a transit segment to simulate missing it.
          </p>
        </div>
      </div>

      <div className="missed-buttons">
        {transitLegs.map(({ leg, i }) => (
          <button
            key={i}
            className={`missed-btn ${selectedLeg === i ? "active" : ""}`}
            onClick={() => handleSimulate(i, leg)}
          >
            {leg.mode} — {leg.departure_point.name.split(/[,(]/)[0]}
          </button>
        ))}
      </div>

      {loading && (
        <p className="missed-loading">Simulating...</p>
      )}

      {result && !loading && (
        <div className="missed-result">
          <div className="missed-stat">
            <Clock size={16} style={{ color: "var(--accent-rose)" }} />
            <div>
              <span className="missed-stat-value">
                {result.extra_wait_min} min
              </span>
              <span className="missed-stat-label">
                wait for next service (daytime: {result.daytime_extra_wait_min} min)
              </span>
            </div>
          </div>
          <div className="missed-stat">
            <Route size={16} style={{ color: "var(--champagne-gold)" }} />
            <div>
              <span className="missed-stat-value">
                {result.fallback_lines} lines
              </span>
              <span className="missed-stat-label">
                alternative services at this stop
              </span>
            </div>
          </div>
          <div className="missed-stat">
            <ShieldCheck
              size={16}
              style={{
                color: difficultyColor[result.recovery_difficulty] ?? "var(--text-muted)",
              }}
            />
            <div>
              <span
                className="missed-stat-value"
                style={{
                  color: difficultyColor[result.recovery_difficulty] ?? "var(--text-muted)",
                }}
              >
                {result.recovery_difficulty}
              </span>
              <span className="missed-stat-label">
                {result.explanation}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
