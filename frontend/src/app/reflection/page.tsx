"use client";

import Link from "next/link";
import { CheckCircle, AlertTriangle, Info, Clock } from "lucide-react";

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  items: string[];
  accentColor: string;
}

function ReflectionSection({ icon, title, items, accentColor }: SectionProps) {
  return (
    <section className="card mb-6">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <span style={{ color: accentColor }} className="mt-0.5 shrink-0">
              ●
            </span>
            <span style={{ color: "var(--text-secondary)" }}>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function ReflectionPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      {/* Header */}
      <section className="mb-10">
        <h1 className="text-3xl font-bold mb-2">What This Means</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          This prototype compares conditions. It does not solve urban safety.
        </p>
      </section>

      <ReflectionSection
        icon={<CheckCircle size={20} style={{ color: "var(--accent-emerald)" }} />}
        title="What this prototype helps with"
        accentColor="var(--accent-emerald)"
        items={[
          "Making hidden journey burdens visible.",
          "Comparing trade-offs across departure times.",
          "Showing where urban support thins out after dark.",
          "Questioning what journey planners usually optimise for.",
        ]}
      />

      <ReflectionSection
        icon={<AlertTriangle size={20} style={{ color: "var(--accent-amber)" }} />}
        title="What it cannot know"
        accentColor="var(--accent-amber)"
        items={[
          "It does not measure fear directly.",
          'It does not prove that one route is "safe".',
          "It cannot represent every traveller equally.",
          "It cannot replace local judgement or lived experience.",
        ]}
      />

      <ReflectionSection
        icon={<Info size={20} style={{ color: "var(--accent-blue)" }} />}
        title="Method and limits"
        accentColor="var(--accent-blue)"
        items={[
          "Lighting is a proxy for lighting infrastructure presence, not measured brightness.",
          "Service uncertainty is inferred from timetables, arrivals and status feeds, not a true delay or cancellation probability.",
          "Crime data is approximate and used only as contextual exposure information.",
        ]}
      />

      <ReflectionSection
        icon={<AlertTriangle size={20} style={{ color: "var(--accent-rose)" }} />}
        title="If this prototype gets it wrong"
        accentColor="var(--accent-rose)"
        items={[
          'Users may read "more suitable" as "safe".',
          "Support proxies may overstate or understate lived experience.",
          "Some user groups may be better represented than others.",
          "Individual comparison tools can never replace structural change.",
        ]}
      />

      <ReflectionSection
        icon={<Clock size={20} style={{ color: "var(--text-secondary)" }} />}
        title="If there were more time"
        accentColor="var(--text-muted)"
        items={[
          "Run user testing with different night-time travellers.",
          "Add richer local support and accessibility data.",
          "Compare more route types and borough conditions.",
          "Explore how different users weigh the same journey differently.",
        ]}
      />

      {/* Closing */}
      <section className="mt-10 text-center">
        <p
          className="text-sm max-w-lg mx-auto mb-8"
          style={{ color: "var(--text-secondary)" }}
        >
          The goal is not to declare the city safe or unsafe. It is to show how
          support, waiting, and recovery change after dark — and why that
          matters.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Compare another journey
          </Link>
          <Link href="/" className="btn-secondary">
            Back to start
          </Link>
        </div>
      </section>
    </div>
  );
}
