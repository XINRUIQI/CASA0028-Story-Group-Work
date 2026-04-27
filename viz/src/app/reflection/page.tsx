"use client";

import Link from "next/link";
import {
  Lightbulb,
  AlertTriangle,
  ListChecks,
  AlertCircle,
  Clock,
  Moon,
  Users,
  Scale,
} from "lucide-react";

/**
 * "Echo" reflection — connects this prototype's findings to broader
 * social issues (gendered fear, gig-economy hours, support gaps).
 *
 * The numeric claims here are kept conservative: Night Tube coverage
 * is independently verifiable from TfL; references to gendered/disabled
 * traveller experience are described qualitatively and pointed to source
 * reports rather than reproduced as specific percentages we cannot
 * stand behind without citation.
 */
const ECHO_BLOCKS: {
  title: string;
  body: React.ReactNode;
  icon: React.ReactNode;
  accent: string;
}[] = [
  {
    title: "The night-time city is not the same city",
    icon: <Moon size={18} />,
    accent: "var(--champagne-gold)",
    body: (
      <>
        Services thin out, public spaces empty, and hidden burdens fall
        hardest on the people who travel anyway — shift workers, carers,
        students, people without other options. On Fridays and Saturdays
        only <strong>5 of 11</strong> London Underground lines run through
        the night. Every other night, almost the entire network closes.
        The fact that a route appears on a map is not the same as the
        route being reachable, frequent, or supported.
      </>
    ),
  },
  {
    title: "Who travels after dark is not random",
    icon: <Users size={18} />,
    accent: "var(--accent-rose)",
    body: (
      <>
        Evidence from disabled passengers and TfL's equality work shows
        that night-time public transport is shaped by unequal access,
        confidence and support, not simply by inconvenience.
        <sup className="refl-echo-ref">[1][2]</sup> Those calculations rarely
        make it into the data planners use. The journeys most likely to be
        silently re-routed, postponed, or never taken are also the ones
        that show up the least in headline statistics.
      </>
    ),
  },
  {
    title: "Hidden burdens are political",
    icon: <Scale size={18} />,
    accent: "var(--accent-emerald)",
    body: (
      <>
        Wait time is not fear. Support availability is not safety. This
        prototype does not measure either directly. What it can do is make
        the invisible parts of a journey legible — so routes are no longer
        silently judged on speed alone, and so that the trade-offs
        travellers already make in their heads are at least visible to the
        systems planning around them.
      </>
    ),
  },
];

const ECHO_REFERENCES: { id: string; label: string; url?: string }[] = [
  {
    id: "1",
    label:
      "Transport for All. (2023). Are we there yet? Barriers to transport for disabled people in 2023.",
    url: "https://www.transportforall.org.uk/wp-content/uploads/2023/12/NATS_Full_PDF.pdf",
  },
  {
    id: "2",
    label:
      "Transport for London. (2016). Action on Equality: TfL's Commitments to 2020.",
    url: "https://content.tfl.gov.uk/action-on-equality-tfls-commitments-to-2020.pdf",
  },
];

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
    title: "What this prototype cannot show",
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
      "Custom routes are limited to a 10×10 OD matrix due to static hosting on GitHub Pages.",
      "Comparison, not prediction.",
    ],
  },
  {
    num: 4,
    title: "Risks of misinterpretation",
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
  "Incorporate seasonal factors — daylight hours, weather, and holiday schedules.",
];

const DATA_SOURCES: { name: string; url?: string }[] = [
  { name: "TfL Unified API", url: "https://api.tfl.gov.uk/" },
  { name: "OpenStreetMap", url: "https://www.openstreetmap.org/" },
  { name: "NHS APIs", url: "https://digital.nhs.uk/developer/api-catalogue" },
  { name: "BHF The Circuit", url: "https://www.thecircuit.uk/" },
  { name: "data.police.uk", url: "https://data.police.uk/" },
  { name: "GLA London Datastore", url: "https://data.london.gov.uk/" },
  { name: "NASA Black Marble", url: "https://blackmarble.gsfc.nasa.gov/" },
  { name: "NaPTAN / DfT", url: "https://www.data.gov.uk/dataset/ff93ffc1-6656-47d8-9155-85ea0b8f2251/national-public-transport-access-nodes-naptan" },
  { name: "LLM" },
];

const VIZ_LIBRARIES: { name: string; url?: string }[] = [
  { name: "Mapbox GL JS", url: "https://docs.mapbox.com/mapbox-gl-js/" },
  { name: "Lucide React", url: "https://lucide.dev/" },
  { name: "Tailwind CSS v4", url: "https://tailwindcss.com/" },
  { name: "Next.js", url: "https://nextjs.org/" },
  { name: "React", url: "https://react.dev/" },
  { name: "Native SVG" },
];

export default function ReflectionPage() {
  return (
    <section className="refl-page">
      {/* Map-style background */}
      <div className="refl-map-bg" />

      {/* Title */}
      <div className="refl-header">
        <h1 className="refl-title">Reflection &amp; Limitations</h1>
        <blockquote className="story-pull-quote story-pull-quote--center">
          We did not set out to declare a route safe.
          <br />
          We set out to make hidden burdens visible.
        </blockquote>
      </div>

      {/* Echo: connect findings to broader social issues */}
      <section className="refl-echo">
        <p className="refl-echo-kicker">Why this matters</p>
        <div className="refl-echo-grid">
          {ECHO_BLOCKS.map((b) => (
            <article key={b.title} className="refl-echo-block">
              <header
                className="refl-echo-head"
                style={{ color: b.accent, borderBottomColor: b.accent }}
              >
                <span className="refl-echo-icon">{b.icon}</span>
                <h3 className="refl-echo-title">{b.title}</h3>
              </header>
              <p className="refl-echo-body">{b.body}</p>
            </article>
          ))}
        </div>
        <ol className="refl-echo-refs">
          {ECHO_REFERENCES.map((r, i) => (
            <li key={`${r.id}-${i}`}>
              <span className="refl-echo-ref-num">[{r.id}]</span>{" "}
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="refl-echo-ref-link"
                >
                  {r.label}
                </a>
              ) : (
                <span>{r.label}</span>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Section divider into methodology grid */}
      <p className="refl-echo-bridge">How we built it</p>

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
        &ldquo;The goal is not to declare a journey safe or unsafe&nbsp;&mdash;
        but to show how support, waiting, and recovery change
        from day to night, and why those changes matter.&rdquo;
      </blockquote>

      {/* Footer: Data Sources */}
      <div className="refl-footer">
        <div className="refl-footer-inner">
          <h3 className="refl-footer-title">Data Sources</h3>
          <div className="refl-footer-sources">
            {DATA_SOURCES.map((s) =>
              s.url ? (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="refl-footer-link"
                >
                  {s.name}
                </a>
              ) : (
                <span key={s.name} className="refl-footer-link">
                  {s.name}
                </span>
              )
            )}
          </div>
        </div>
      </div>

      {/* Footer: Visualisation Libraries */}
      <div className="refl-footer">
        <div className="refl-footer-inner">
          <h3 className="refl-footer-title">Visualisation Libraries</h3>
          <div className="refl-footer-sources">
            {VIZ_LIBRARIES.map((s) =>
              s.url ? (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="refl-footer-link"
                >
                  {s.name}
                </a>
              ) : (
                <span key={s.name} className="refl-footer-link">
                  {s.name}
                </span>
              )
            )}
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
