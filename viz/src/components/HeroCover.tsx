"use client";

import { useEffect, useState, useRef } from "react";

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

export default function HeroCover() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const scrollToContent = () => {
    sectionRef.current?.nextElementSibling?.scrollIntoView({
      behavior: "smooth",
    });
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
          <span className="hero-title-line">After Dark:</span>
          <span className="hero-subtitle-line">
            How the Same Journey Changes
          </span>
        </h1>

        <p className="hero-description">
          The point is not to declare one option right or wrong,
          <br />
          but to show how the same journey asks different things
          <br />
          of the traveller after dark.
        </p>

        <button onClick={scrollToContent} className="hero-cta" type="button">
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
  );
}
