"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, ShieldCheck, Activity, HelpCircle } from "lucide-react";

const STAR_COUNT = 90;

interface Star {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateStars(): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < STAR_COUNT; i++) {
    stars.push({
      x: seededRandom(i * 5 + 1) * 100,
      y: seededRandom(i * 5 + 2) * 100,
      size: 0.8 + seededRandom(i * 5 + 3) * 2,
      delay: seededRandom(i * 5 + 4) * 6,
      duration: 3 + seededRandom(i * 5 + 5) * 5,
    });
  }
  return stars;
}

const STATIC_STARS = generateStars();

const INTRO_DIMENSIONS = [
  {
    icon: Clock,
    title: "Waiting time",
    description:
      "How long you may wait, and how easy it is to continue if you miss a bus, train, or connection.",
  },
  {
    icon: ShieldCheck,
    title: "Places to get help",
    description:
      "Open shops, shelters, stations, and other places that can make a route feel more supported.",
  },
  {
    icon: Activity,
    title: "How busy the area feels",
    description:
      "Whether stops and streets feel active, quiet, or empty at different times of day.",
  },
  {
    icon: HelpCircle,
    title: "If something goes wrong",
    description:
      "How easy it is to deal with delays, cancellations, or route changes after dark.",
  },
];

export default function HeroCover() {
  const [visible, setVisible] = useState(false);
  const introRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const scrollToIntro = () => {
    introRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const continueToNext = () => {
    introRef.current?.nextElementSibling?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <>
      {/* ── Hero cover (full-screen) ─────────────────────────────── */}
      <section className="hero-cover">
        {/* Starfield */}
        <div className="hero-stars">
          {STATIC_STARS.map((star, i) => (
            <span
              key={i}
              className="hero-star"
              style={{
                left: `${star.x.toFixed(4)}%`,
                top: `${star.y.toFixed(4)}%`,
                width: `${star.size.toFixed(4)}px`,
                height: `${star.size.toFixed(4)}px`,
                animationDelay: `${star.delay.toFixed(4)}s`,
                animationDuration: `${star.duration.toFixed(4)}s`,
              }}
            />
          ))}
        </div>

        {/* Centre content */}
        <div className={`hero-content ${visible ? "hero-visible" : ""}`}>
          <h1 className="hero-title">
            <span className="hero-title-line">The Same Way Home?</span>
            <span className="hero-subtitle-line">
              How the Same Journey Changes
            </span>
          </h1>

          <p className="hero-thesis">
            Same trip. Different city.
          </p>

          {/* Big-number opener: framing the day/night gap with three stats
              taken from our own City Vitality index (lib/vitality.ts) plus
              one externally verifiable Tube fact. */}
          <div className="hero-stats" aria-label="Day versus night summary">
            <div className="hero-stat">
              <span className="hero-stat-num">
                91<span className="hero-stat-sep">→</span>35
                <span className="hero-stat-unit">%</span>
              </span>
              <span className="hero-stat-label">
                City Vitality, day to 01:00
              </span>
            </div>
            <div className="hero-stat-divider" aria-hidden />
            <div className="hero-stat">
              <span className="hero-stat-num">
                97<span className="hero-stat-sep">→</span>22
                <span className="hero-stat-unit">%</span>
              </span>
              <span className="hero-stat-label">
                Support access, day to 01:00
              </span>
            </div>
            <div className="hero-stat-divider" aria-hidden />
            <div className="hero-stat">
              <span className="hero-stat-num">
                5<span className="hero-stat-sep">/</span>11
              </span>
              <span className="hero-stat-label">
                Tube lines run all night
              </span>
            </div>
          </div>

          <p className="hero-description hero-description--sub">
            A simple comparison of how travel changes
            <br />
            between daylight and after dark.
          </p>

          <button onClick={scrollToIntro} className="hero-cta" type="button">
            Begin exploring
          </button>
        </div>

        {/* Sparkle decoration — bottom right */}
        <div className="hero-sparkle" aria-hidden="true">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 0L13.8 10.2L24 12L13.8 13.8L12 24L10.2 13.8L0 12L10.2 10.2L12 0Z" />
          </svg>
        </div>
      </section>

      {/* ── Intro section: "What changes after dark?" ────────────── */}
      <section ref={introRef} className="intro-section">
        <h2 className="intro-modal-title">
          What feels different at night?
        </h2>

        <div className="intro-modal-grid">
          {INTRO_DIMENSIONS.map(({ icon: Icon, title, description }) => (
            <div key={title} className="intro-modal-card">
              <div className="intro-modal-icon">
                <Icon size={18} style={{ color: "var(--champagne-gold)" }} />
              </div>
              <h3 className="intro-modal-card-title">{title}</h3>
              <p className="intro-modal-card-desc">{description}</p>
            </div>
          ))}
        </div>

        <div className="intro-modal-footer">
          <button
            type="button"
            className="hero-cta intro-modal-cta"
            onClick={continueToNext}
          >
            See what matters to me
          </button>
        </div>
      </section>
    </>
  );
}
