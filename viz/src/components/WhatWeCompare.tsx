"use client";

import {
  Clock,
  ShieldCheck,
  Activity,
  Target,
  RefreshCw,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react";

const INDICATORS = [
  {
    icon: <Clock size={22} strokeWidth={2.2} />,
    label: "Wait Time",
    desc: "How long you may spend waiting at stations, stops, or transfer points.",
    color: "#66d9c2",
    glow: "rgba(102,217,194,0.45)",
  },
  {
    icon: <ShieldCheck size={22} strokeWidth={2.2} />,
    label: "Nearby Help",
    desc: "Open or staffed places nearby, such as shops, cafés, toilets, pharmacies, or AED points.",
    color: "#8bb8f0",
    glow: "rgba(139,184,240,0.45)",
  },
  {
    icon: <Activity size={22} strokeWidth={2.2} />,
    label: "Activity Nearby",
    desc: "Whether the surrounding area still feels busy, quiet, or empty when you travel.",
    color: "#f0b87a",
    glow: "rgba(240,184,122,0.45)",
  },
  {
    icon: <Target size={22} strokeWidth={2.2} />,
    label: "Service Reliability",
    desc: "How likely the service is to go as planned, including delays, cancellations, long gaps between services, route changes, and the extra time needed if something goes wrong.",
    color: "#c8a0e8",
    glow: "rgba(200,160,232,0.45)",
  },
  {
    icon: <RefreshCw size={22} strokeWidth={2.2} />,
    label: "Backup Options",
    desc: "How easy it is to find another way if a train is delayed, a bus is diverted, or a connection is missed.",
    color: "#f0a0b8",
    glow: "rgba(240,160,184,0.45)",
  },
  {
    icon: <AlertTriangle size={22} strokeWidth={2.2} />,
    label: "Route Exposure",
    desc: "How exposed the journey may feel after dark, especially during walking sections or low-support areas.",
    color: "#f08c6e",
    glow: "rgba(240,140,110,0.45)",
  },
] as const;

export default function WhatWeCompare() {
  return (
    <div className="wwc-panel">
      <div className="wwc-grid-overlay" aria-hidden />

      <div className="wwc-header">
        <h3 className="choose-chart-title">What we compare</h3>
        <p className="compare-route-desc compare-route-desc--jtc">
          These six indicators show what can feel different when you leave later.
        </p>
      </div>

      {/* Horizontal metro diagram */}
      <div className="wwc-metro">
        {/* Top row: cards 0, 2, 4 (even) */}
        <div className="wwc-row wwc-row--top">
          {INDICATORS.filter((_, i) => i % 2 === 0).map((ind) => (
            <div
              key={ind.label}
              className="wwc-col"
              style={{ "--wwc-accent": ind.color, "--wwc-glow": ind.glow } as React.CSSProperties}
            >
              <div className="wwc-card">
                <div className="wwc-card-head">
                  <span className="wwc-badge">{ind.icon}</span>
                  <span className="wwc-card-label">{ind.label}</span>
                </div>
                <span className="wwc-card-desc">{ind.desc}</span>
              </div>
              <div className="wwc-branch wwc-branch--down">
                <span className="wwc-branch-line" />
                <span className="wwc-node" />
              </div>
            </div>
          ))}
        </div>

        {/* Trunk line (horizontal, day → night) */}
        <div className="wwc-trunk">
          <span className="wwc-endpoint wwc-endpoint--day">
            <Sun size={18} strokeWidth={2.4} />
          </span>
          <span className="wwc-trunk-line" />
          <span className="wwc-endpoint wwc-endpoint--night">
            <Moon size={18} strokeWidth={2.4} />
          </span>
        </div>

        {/* Bottom row: cards 1, 3, 5 (odd) */}
        <div className="wwc-row wwc-row--bottom">
          {INDICATORS.filter((_, i) => i % 2 === 1).map((ind) => (
            <div
              key={ind.label}
              className="wwc-col"
              style={{ "--wwc-accent": ind.color, "--wwc-glow": ind.glow } as React.CSSProperties}
            >
              <div className="wwc-branch wwc-branch--up">
                <span className="wwc-node" />
                <span className="wwc-branch-line" />
              </div>
              <div className="wwc-card">
                <div className="wwc-card-head">
                  <span className="wwc-badge">{ind.icon}</span>
                  <span className="wwc-card-label">{ind.label}</span>
                </div>
                <span className="wwc-card-desc">{ind.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="wwc-footnote">
        Leaving later can change more than the route. These indicators help
        reveal what to expect.
      </p>
    </div>
  );
}
