"use client";

import Link from "next/link";
import { Lightbulb, AlertTriangle, ListChecks, AlertCircle, Clock } from "lucide-react";

const CARDS = [
  {
    num: 1,
    title: "What this prototype helps with",
    icon: <Lightbulb size={20} />,
    iconColor: "var(--accent-amber)",
    items: [
      "Making hidden journey burdens visible.",
      "Comparing trade-offs across departure times.",
      "Showing where urban support thins out after dark.",
      "Questioning what journey planners usually optimise for.",
    ],
  },
  {
    num: 2,
    title: "What it cannot know",
    icon: <AlertTriangle size={20} />,
    iconColor: "var(--accent-amber)",
    items: [
      "It does not measure fear directly.",
      "It does not prove that one route is \"safe\".",
      "It cannot represent every traveller equally.",
      "It cannot replace local judgement or lived experience.",
    ],
  },
  {
    num: 3,
    title: "Method and limits",
    icon: <ListChecks size={20} />,
    iconColor: "var(--accent-amber)",
    items: [
      "Every metric is a proxy — not ground truth.",
      "Coverage and quality vary across datasets.",
      "Night-time data is especially scarce.",
      "Comparison, not prediction.",
    ],
  },
  {
    num: 4,
    title: "If this prototype gets it wrong",
    icon: <AlertCircle size={20} />,
    iconColor: "var(--accent-amber)",
    items: [
      "Users may read \"more suitable\" as \"safe\".",
      "Support proxies may overstate or understate lived experience.",
      "Some user groups may be better represented than others.",
      "Individual tools can never replace structural change.",
    ],
  },
];

const FUTURE_ITEMS = [
  "Run user testing with different night-time travellers.",
  "Add richer local support and accessibility data.",
  "Compare more route types and borough conditions.",
  "Explore how different users weigh the same journey differently.",
];

const DATA_SOURCES = [
  "Police approximation",
  "Timetable proxy",
  "HSDS footfall",
  "NHS machine check",
];

export default function ReflectionPage() {
  return (
    <section className="refl-page">
      {/* Map-style background */}
      <div className="refl-map-bg" />

      {/* Title */}
      <div className="refl-header">
        <h1 className="refl-title">Reflection / Design Limits</h1>
      </div>

      {/* 2×2 card grid */}
      <div className="refl-grid">
        {CARDS.map((card) => (
          <div key={card.num} className="refl-card">
            <div className="refl-card-icon" style={{ color: card.iconColor }}>
              {card.icon}
            </div>
            <h2 className="refl-card-title">
              {card.num}. {card.title}
            </h2>
            <ul className="refl-card-list">
              {card.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* If there were more time */}
      <div className="refl-future">
        <div className="refl-future-icon" style={{ color: "var(--text-secondary)" }}>
          <Clock size={20} />
        </div>
        <h2 className="refl-future-title">If there were more time</h2>
        <ul className="refl-card-list">
          {FUTURE_ITEMS.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Closing quote */}
      <blockquote className="refl-quote">
        The goal is not to declare the city safe or unsafe. It is to show how
        support, waiting, and recovery change after dark — and why that matters.
      </blockquote>

      {/* Footer: Author & Data Sources */}
      <div className="refl-footer">
        <div className="refl-footer-inner">
          <h3 className="refl-footer-title">Author &amp; Data Sources</h3>
          <div className="refl-footer-sources">
            {DATA_SOURCES.map((s) => (
              <span key={s} className="refl-footer-item">
                &bull;&ensp;{s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="refl-nav">
        <Link href="/ending" className="refl-nav-btn">
          Final thoughts &rarr;
        </Link>
        <Link href="/" className="refl-nav-btn refl-nav-secondary">
          Back to start
        </Link>
      </div>

      {/* Decorative sparkle */}
      <div className="refl-sparkle" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2L12 0Z" />
        </svg>
      </div>
    </section>
  );
}
