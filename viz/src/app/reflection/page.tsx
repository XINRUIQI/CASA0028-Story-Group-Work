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
  "Test the prototype with different night-time travellers.",
  "Add richer local support, accessibility, and lighting data.",
  "Compare more route types, departure times, and borough contexts.",
  "Explore how different users weigh waiting, safety, cost, and backup options differently.",
];

const DATA_SOURCES = [
  { name: "TfL Unified API", url: "https://api.tfl.gov.uk/" },
  { name: "OpenStreetMap", url: "https://www.openstreetmap.org/" },
  { name: "NHS APIs", url: "https://digital.nhs.uk/developer/api-catalogue" },
  { name: "BHF The Circuit", url: "https://www.thecircuit.uk/" },
  { name: "data.police.uk", url: "https://data.police.uk/" },
  { name: "GLA London Datastore", url: "https://data.london.gov.uk/" },
  { name: "NASA Black Marble", url: "https://blackmarble.gsfc.nasa.gov/" },
  { name: "NaPTAN / DfT", url: "https://www.data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan" },
];

export default function ReflectionPage() {
  return (
    <section className="refl-page">
      {/* Map-style background */}
      <div className="refl-map-bg" />

      {/* Title */}
      <div className="refl-header">
        <h1 className="refl-title">Reflection &amp; Limits</h1>
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
        <h2 className="refl-future-title">Future Improvements</h2>
        <ul className="refl-card-list">
          {FUTURE_ITEMS.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Closing quote */}
      <blockquote className="refl-quote">
        &ldquo;The goal is not to label the city as safe or unsafe. It is to show how
        waiting, support, reliability, and recovery change after dark&nbsp;&mdash; and why those changes matter.&rdquo;
      </blockquote>

      {/* Footer: Data Sources */}
      <div className="refl-footer">
        <div className="refl-footer-inner">
          <h3 className="refl-footer-title">Data Sources</h3>
          <div className="refl-footer-sources">
            {DATA_SOURCES.map((s) => (
              <a
                key={s.name}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="refl-footer-link"
              >
                {s.name}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="refl-nav">
        <Link href="/" className="refl-nav-btn refl-nav-secondary">
          &larr; Back to start
        </Link>
        <Link href="/ending" className="refl-nav-btn">
          Final thoughts
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
