"use client";

import Link from "next/link";
import { Moon, ExternalLink, Mail } from "lucide-react";
import { useReveal } from "@/lib/useReveal";

export default function EndingPage() {
  const revealRef = useReveal();

  return (
    <div ref={revealRef} className="ending-page">
      <div className="ending-inner">
        {/* ── Icon ── */}
        <div className="reveal-section ending-icon-wrap">
          <Moon size={48} style={{ color: "var(--accent-amber)" }} />
        </div>

        {/* ── Wish ── */}
        <section className="reveal-section text-center mb-10">
          <h1 className="ending-title">
            Build a city where the same journey
            <br />
            <span style={{ color: "var(--accent-amber)" }}>
              feels the same — day or night
            </span>
          </h1>
        </section>

        {/* ── Closing statement ── */}
        <section className="reveal-section text-center mb-14">
          <p className="ending-body">
            This prototype does not solve urban safety. It makes hidden
            trade-offs visible — so that travellers, planners, and researchers
            can ask better questions about what changes after dark.
          </p>
        </section>

        {/* ── Thank you ── */}
        <section className="reveal-section text-center mb-12">
          <p className="ending-thanks">Thank you for exploring.</p>
        </section>

        {/* ── Credits ── */}
        <section className="reveal-section mb-14">
          <div className="ending-credits">
            <h3 className="ending-credits-title">Project</h3>
            <p className="ending-credits-name">
              After Dark: How the Same Journey Changes
            </p>
            <p className="ending-credits-meta">
              CASA0028 — Story Group Work · UCL CASA · 2026
            </p>

            <h3 className="ending-credits-title" style={{ marginTop: "1.25rem" }}>
              Team
            </h3>
            <div className="ending-team">
              <TeamMember name="Xinrui Qi" />
              <TeamMember name="Shirly" />
            </div>

            <h3 className="ending-credits-title" style={{ marginTop: "1.25rem" }}>
              Data sources
            </h3>
            <p className="ending-credits-meta">
              TfL Unified API · OpenStreetMap · NHS APIs · BHF The Circuit ·
              GLA London Datastore · NASA Black Marble · data.police.uk ·
              NaPTAN (DfT)
            </p>

            <h3 className="ending-credits-title" style={{ marginTop: "1.25rem" }}>
              Built with
            </h3>
            <p className="ending-credits-meta">
              Next.js · FastAPI · Tailwind CSS · Mapbox · Lucide Icons
            </p>
          </div>
        </section>

        {/* ── Links ── */}
        <section className="reveal-section text-center mb-10">
          <div className="flex gap-4 justify-center flex-wrap">
            <a
              href="https://github.com/XINRUIQI/CASA0028-Story-Group-Work"
              target="_blank"
              rel="noopener noreferrer"
              className="ending-link"
            >
              <ExternalLink size={16} />
              <span>Source code</span>
            </a>
            <a
              href="mailto:ucfnxqi@ucl.ac.uk"
              className="ending-link"
            >
              <Mail size={16} />
              <span>Contact</span>
            </a>
          </div>
        </section>

        {/* ── Back to start ── */}
        <section className="reveal-section text-center">
          <Link href="/" className="btn-primary px-8 py-3 text-lg">
            Back to start
          </Link>
        </section>
      </div>
    </div>
  );
}

function TeamMember({ name }: { name: string }) {
  return (
    <span className="ending-team-member">{name}</span>
  );
}
