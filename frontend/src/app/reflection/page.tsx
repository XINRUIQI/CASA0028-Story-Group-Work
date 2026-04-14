"use client";

import Link from "next/link";
import {
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Database,
  ShieldAlert,
} from "lucide-react";
import { useReveal } from "@/lib/useReveal";

/* ── Data source / proxy matrix ──────────────────────────────── */

interface SourceRow {
  dataset: string;
  provider: string;
  type: "official_direct" | "official_contextual" | "open_proxy" | "restricted";
  resolution: string;
  limitation: string;
}

const SOURCE_MATRIX: SourceRow[] = [
  {
    dataset: "TfL Journey Planner / Unified API",
    provider: "TfL",
    type: "official_direct",
    resolution: "Stop-level, real-time",
    limitation: "Journey options depend on time of query; not all modes covered equally.",
  },
  {
    dataset: "Timetable headway (TransXChange)",
    provider: "TfL",
    type: "official_direct",
    resolution: "Route × time-band",
    limitation: "Placeholder data used for prototype; full parse requires TransXChange XML.",
  },
  {
    dataset: "OSM POIs + opening_hours",
    provider: "OpenStreetMap",
    type: "open_proxy",
    resolution: "Node-level",
    limitation: "Coverage varies; many POIs lack opening_hours tags.",
  },
  {
    dataset: "OSM street_lamp / lit=*",
    provider: "OpenStreetMap",
    type: "open_proxy",
    resolution: "Node / way-level",
    limitation: "Infrastructure presence, not measured brightness. May be outdated.",
  },
  {
    dataset: "NASA Black Marble",
    provider: "NASA",
    type: "open_proxy",
    resolution: "~500 m pixel",
    limitation: "City-scale ambient light only; not street-level.",
  },
  {
    dataset: "Police street-level crime",
    provider: "data.police.uk",
    type: "official_contextual",
    resolution: "Snapped to anonymisation points",
    limitation: "Approximate location. Contextual only — not exact danger labels.",
  },
  {
    dataset: "NHS Find a Pharmacy / Healthcare",
    provider: "NHS",
    type: "official_direct",
    resolution: "Service-level",
    limitation: "Requires API onboarding; not all services have machine-readable hours.",
  },
  {
    dataset: "BHF The Circuit (AED)",
    provider: "BHF",
    type: "official_direct",
    resolution: "Point-level",
    limitation: "Availability and access type vary; not guaranteed accessible 24/7.",
  },
  {
    dataset: "GLA Night Time Economy (MSOA)",
    provider: "London Datastore",
    type: "official_contextual",
    resolution: "MSOA-level",
    limitation: "Based on 2017 workplace data; does not capture real-time activity.",
  },
  {
    dataset: "TfL station footfall",
    provider: "TfL",
    type: "official_direct",
    resolution: "Station-level, annual",
    limitation: "Annual totals; no hourly public breakdown for most stations.",
  },
];

const TYPE_LABELS: Record<SourceRow["type"], { label: string; color: string }> = {
  official_direct:     { label: "Official direct",     color: "var(--accent-emerald)" },
  official_contextual: { label: "Official contextual", color: "var(--accent-blue)" },
  open_proxy:          { label: "Open proxy",          color: "var(--accent-amber)" },
  restricted:          { label: "Restricted",          color: "var(--accent-rose)" },
};

/* ── Section component ───────────────────────────────────────── */

function ReflectionModule({
  icon,
  title,
  items,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="reflect-module reveal-section">
      <div className="reflect-module-bar" style={{ background: accent }} />
      <div className="reflect-module-body">
        <div className="reflect-module-header">
          {icon}
          <h2 className="reflect-module-title">{title}</h2>
        </div>
        <ul className="reflect-list">
          {items.map((item, i) => (
            <li key={i}>
              <span className="reflect-bullet" style={{ color: accent }}>
                ›
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────── */

export default function ReflectionPage() {
  const revealRef = useReveal();

  return (
    <div ref={revealRef} className="max-w-3xl mx-auto px-6 pt-20 pb-16">
      {/* ── Header ── */}
      <section className="reveal-section text-center mb-14">
        <p className="section-label">Reflection</p>
        <h1 className="text-3xl font-bold mb-3">
          What this tool{" "}
          <span style={{ color: "var(--accent-amber)" }}>
            can and cannot do
          </span>
        </h1>
        <p
          className="text-base max-w-xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          This prototype compares conditions. It does not solve urban safety. It
          helps you see trade-offs — not make final judgements.
        </p>
      </section>

      {/* ── Five reflection modules ── */}
      <ReflectionModule
        icon={<CheckCircle size={20} style={{ color: "var(--accent-emerald)" }} />}
        title="What this prototype helps with"
        accent="var(--accent-emerald)"
        items={[
          "Making hidden journey burdens visible.",
          "Comparing trade-offs across departure times.",
          "Showing where urban support thins out after dark.",
          "Questioning what journey planners usually optimise for.",
        ]}
      />

      <ReflectionModule
        icon={<AlertTriangle size={20} style={{ color: "var(--accent-amber)" }} />}
        title="What it cannot know"
        accent="var(--accent-amber)"
        items={[
          "It does not measure fear directly.",
          "It does not prove that one route is \"safe\".",
          "It cannot represent every traveller equally.",
          "It cannot replace local judgement or lived experience.",
        ]}
      />

      <ReflectionModule
        icon={<ShieldAlert size={20} style={{ color: "var(--accent-rose)" }} />}
        title="If this prototype gets it wrong"
        accent="var(--accent-rose)"
        items={[
          "Users may read \"more suitable\" as \"safe\".",
          "Support proxies may overstate or understate lived experience.",
          "Some user groups may be better represented than others.",
          "Individual comparison tools can never replace structural change.",
        ]}
      />

      <ReflectionModule
        icon={<Clock size={20} style={{ color: "var(--text-secondary)" }} />}
        title="If there were more time"
        accent="var(--text-muted)"
        items={[
          "Run user testing with different night-time travellers.",
          "Add richer local support and accessibility data.",
          "Compare more route types and borough conditions.",
          "Explore how different users weigh the same journey differently.",
        ]}
      />

      {/* ── Source / proxy matrix ── */}
      <section className="reveal-section mb-10">
        <div className="reflect-module">
          <div className="reflect-module-bar" style={{ background: "var(--accent-blue)" }} />
          <div className="reflect-module-body">
            <div className="reflect-module-header">
              <Database size={20} style={{ color: "var(--accent-blue)" }} />
              <h2 className="reflect-module-title">Method and data sources</h2>
            </div>
            <p
              className="text-xs mb-4"
              style={{ color: "var(--text-muted)" }}
            >
              Every metric in this prototype is a proxy. Below is what each
              source shows, and what it does not.
            </p>

            <div className="source-table-wrap">
              <table className="source-table">
                <thead>
                  <tr>
                    <th>Dataset</th>
                    <th>Type</th>
                    <th>Resolution</th>
                    <th>Limitation</th>
                  </tr>
                </thead>
                <tbody>
                  {SOURCE_MATRIX.map((row) => {
                    const t = TYPE_LABELS[row.type];
                    return (
                      <tr key={row.dataset}>
                        <td>
                          <span className="source-name">{row.dataset}</span>
                          <span className="source-provider">{row.provider}</span>
                        </td>
                        <td>
                          <span
                            className="source-type-badge"
                            style={{
                              color: t.color,
                              borderColor: t.color,
                            }}
                          >
                            {t.label}
                          </span>
                        </td>
                        <td className="source-res">{row.resolution}</td>
                        <td className="source-limit">{row.limitation}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── Closing statement ── */}
      <section className="reveal-section text-center mb-12">
        <blockquote className="fairness-quote">
          The goal is not to declare the city safe or unsafe. It is to show how
          support, waiting, and recovery change after dark — and why that
          matters.
        </blockquote>
      </section>

      {/* ── Navigation ── */}
      <section className="reveal-section text-center">
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/ending" className="btn-primary px-6 py-3">
            Final thoughts →
          </Link>
          <Link href="/" className="btn-secondary px-6 py-3">
            Back to start
          </Link>
        </div>
      </section>
    </div>
  );
}
