"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, ShieldCheck, Activity, HelpCircle, X } from "lucide-react";

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
    title: "Waiting",
    description:
      "How long you may wait, and what happens if you miss a connection.",
  },
  {
    icon: ShieldCheck,
    title: "Support nearby",
    description:
      "Shelters, open shops, pharmacies, and other facilities along the route.",
  },
  {
    icon: Activity,
    title: "Activity around stops",
    description:
      "Whether the surroundings are busy or quiet at different times.",
  },
  {
    icon: HelpCircle,
    title: "Service uncertainty",
    description:
      "How predictable the service is, and whether disruptions are reported.",
  },
];

export default function HeroCover() {
  const [visible, setVisible] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Lock background scroll while modal is open
  useEffect(() => {
    if (!showIntro) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showIntro]);

  // Close on Escape
  useEffect(() => {
    if (!showIntro) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowIntro(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showIntro]);

  const openIntro = () => setShowIntro(true);

  const continueToNext = () => {
    setShowIntro(false);
    // Allow modal close transition to settle before scrolling
    setTimeout(() => {
      sectionRef.current?.nextElementSibling?.scrollIntoView({
        behavior: "smooth",
      });
    }, 150);
  };

  return (
    <section ref={sectionRef} className="hero-cover">
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
          <span className="hero-title-line">Day and Night:</span>
          <span className="hero-subtitle-line">
            How the Same Journey Changes
          </span>
        </h1>

        <p className="hero-description">
          The point is not to decide which journey is better,
          <br />
          but to show how the same route asks different things
          <br />
          of the traveller in daylight and after dark.
        </p>

        <button onClick={openIntro} className="hero-cta" type="button">
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

      {/* ── Intro modal: "What changes after dark?" ─────────────── */}
      {showIntro && (
        <div
          className="intro-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-modal-title"
          onClick={() => setShowIntro(false)}
        >
          <div
            className="intro-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="intro-modal-close"
              onClick={() => setShowIntro(false)}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <h2 id="intro-modal-title" className="intro-modal-title">
              What changes after dark?
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
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
