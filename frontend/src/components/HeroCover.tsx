"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Full-viewport cinematic cover (Page 0).
 *
 * Visual concept: an abstract grid of city "nodes" that transitions
 * from a warm daytime palette to a cool, sparse nighttime palette,
 * symbolising how service/support thins out after dark.
 */

const NODE_COUNT = 48;

interface Node {
  x: number;
  y: number;
  delay: number;
  size: number;
}

/**
 * Deterministic pseudo-random using a simple seed so SSR and client
 * produce identical output (no hydration mismatch).
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 49297;
  return x - Math.floor(x);
}

function generateNodes(): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push({
      x: 8 + seededRandom(i * 4 + 1) * 84,
      y: 10 + seededRandom(i * 4 + 2) * 80,
      delay: seededRandom(i * 4 + 3) * 3,
      size: 2 + seededRandom(i * 4 + 4) * 3,
    });
  }
  return nodes;
}

const STATIC_NODES = generateNodes();

export default function HeroCover() {
  const [phase, setPhase] = useState<"day" | "night">("day");
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 200);
    const t2 = setTimeout(() => setPhase("night"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const scrollToContent = () => {
    sectionRef.current?.nextElementSibling?.scrollIntoView({
      behavior: "smooth",
    });
  };

  const isNight = phase === "night";

  return (
    <section
      ref={sectionRef}
      className="hero-cover"
      style={{
        background: isNight
          ? "linear-gradient(160deg, #070a15 0%, #0c1022 40%, #131830 100%)"
          : "linear-gradient(160deg, #1a2340 0%, #243058 40%, #2d3a6e 100%)",
      }}
    >
      {/* Animated city nodes */}
      <div className="hero-nodes">
        {STATIC_NODES.map((node, i) => {
          const shouldHide = isNight && i % 3 !== 0;
          return (
            <span
              key={i}
              className="hero-node"
              style={{
                left: `${node.x.toFixed(4)}%`,
                top: `${node.y.toFixed(4)}%`,
                width: `${node.size.toFixed(4)}px`,
                height: `${node.size.toFixed(4)}px`,
                opacity: shouldHide ? 0.04 : isNight ? 0.25 : 0.45,
                background: shouldHide
                  ? "var(--text-muted)"
                  : isNight
                    ? "var(--accent-blue)"
                    : "var(--accent-amber)",
                transitionDelay: `${node.delay.toFixed(4)}s`,
              }}
            />
          );
        })}
      </div>

      {/* Centre content */}
      <div className={`hero-content ${visible ? "hero-visible" : ""}`}>
        <p className="hero-eyebrow">
          {isNight
            ? "The same city. Different demands."
            : "London, after sunset"}
        </p>

        <h1 className="hero-title">
          <span className="hero-title-line">After Dark</span>
          <span className="hero-subtitle-line">
            How the Same Journey Changes
          </span>
        </h1>

        <p className="hero-question">
          Why does the same route feel heavier, less supported, and harder to
          recover from — simply because you left later?
        </p>

        <p className="hero-note">
          This tool does not tell you which route is safe. It helps you compare
          what changes — and decide what matters tonight.
        </p>

        <button onClick={scrollToContent} className="hero-cta" type="button">
          Begin exploring
        </button>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={scrollToContent}
        className="hero-scroll-hint"
        type="button"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} />
      </button>
    </section>
  );
}
