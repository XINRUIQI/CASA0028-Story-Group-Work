"use client";

import { useEffect, useRef } from "react";

/**
 * Attach to a container element; adds `.revealed` to each
 * child with `.reveal-section` when it enters the viewport.
 */
export function useReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    const sections = el.querySelectorAll(".reveal-section");
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, []);

  return containerRef;
}
