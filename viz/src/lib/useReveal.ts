"use client";

import { useEffect, useRef } from "react";

/**
 * Attach to a container element; adds `.revealed` to each
 * child with `.reveal-section` when it enters the viewport.
 * Uses MutationObserver to pick up dynamically rendered sections.
 */
export function useReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    function observeAll() {
      const sections = el!.querySelectorAll(".reveal-section");
      sections.forEach((s) => {
        if (!s.classList.contains("revealed")) {
          io.observe(s);
        }
      });
    }

    observeAll();

    const mo = new MutationObserver(() => observeAll());
    mo.observe(el, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return containerRef;
}
