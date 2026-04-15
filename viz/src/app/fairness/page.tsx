"use client";

import Link from "next/link";
import FairnessPanel from "@/components/FairnessPanel";
import { useReveal } from "@/lib/useReveal";

export default function FairnessPage() {
  const revealRef = useReveal();

  return (
    <div ref={revealRef} className="max-w-5xl mx-auto px-6 pt-20 pb-16">
      {/* ── Header ── */}
      <section className="reveal-section text-center mb-14">
        <p className="section-label">City-wide Fairness · Mobility Support Inequality</p>
        <h1 className="text-3xl font-bold mb-3">
          Who loses mobility support{" "}
          <span style={{ color: "var(--accent-amber)" }}>after dark?</span>
        </h1>
        <p
          className="text-base max-w-2xl mx-auto mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          Some areas lose more than others when the sun goes down. Not because
          they become &ldquo;dangerous&rdquo; — but because they lose the
          service, support, and recoverability that made daytime travel
          manageable.
        </p>
        <p
          className="text-xs max-w-xl mx-auto"
          style={{ color: "var(--text-muted)" }}
        >
          This page compares the relative drop from day to night — not absolute
          night-time values. A large drop means the gap between daytime and
          night-time experience is wider.
        </p>
      </section>

      {/* ── Fairness panel ── */}
      <section className="reveal-section mb-14">
        <FairnessPanel />
      </section>

      {/* ── Narrative ── */}
      <section className="reveal-section mb-14">
        <div className="fairness-narrative-grid">
          <div className="card">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--accent-rose)" }}>
              Outer boroughs feel it most
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Areas like Barnet, Bromley, Croydon and Ealing see the sharpest
              drops. Fewer night buses, longer headways, and almost no open
              support nearby.
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--accent-blue)" }}>
              Inner London retains more
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Central areas keep Night Tube, more night buses, and higher
              activity levels — but even here, support POIs close and waits
              lengthen.
            </p>
          </div>
          <div className="card">
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--accent-amber)" }}>
              The gap is the story
            </h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              The question is not &ldquo;where is it dangerous?&rdquo; but
              &ldquo;where does the public transport experience degrade the
              most from day to night?&rdquo;
            </p>
          </div>
        </div>
      </section>

      {/* ── Key statement ── */}
      <section className="reveal-section text-center mb-14">
        <blockquote className="fairness-quote">
          These areas are not &ldquo;more dangerous&rdquo; at night. They are
          more likely to lose the high-support, recoverable, understandable
          public transport experience that daytime provides.
        </blockquote>
      </section>

      {/* ── Navigation ── */}
      <section className="reveal-section text-center">
        <p
          className="text-sm mb-6 max-w-md mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          See what these differences mean for a specific journey and persona.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/compare" className="btn-primary px-6 py-3">
            Compare a journey →
          </Link>
          <Link href="/reflection" className="btn-secondary px-6 py-3">
            Reflection & limits
          </Link>
        </div>
      </section>
    </div>
  );
}
