"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { getPublicBasePath } from "@/lib/publicBasePath";

export default function EndingPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const pageStyle = {
    "--final-cover-image": `url("${getPublicBasePath()}/background4.png")`,
  } as CSSProperties;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 400);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="final-page" style={pageStyle}>
      {/* Subtle silver-gray London road network */}
      <div className="final-map-bg" />

      {/* Central glow orb */}
      <div className="final-glow-orb" />

      <div className={`final-content ${visible ? "final-visible" : ""}`}>
        {/* Main quote */}
        <blockquote className="final-quote">
          <p className="final-quote-para">
            A better city is not only one that moves quickly,
            <br />
            but one that remains usable at different times of day.
          </p>
          <p className="final-quote-para">
            Future journey planning should make visible the support,
            <br />
            uncertainty, and choices that shape how people travel
            <br />
            from day to night.
          </p>
          <p className="final-quote-para">
            In doing so, it can help imagine a city where studying late,
            <br />
            working late, meeting friends, or enjoying the evening
            <br />
            does not mean facing the journey home alone or unseen.
          </p>
        </blockquote>

        {/* Closing line */}
        <p className="final-thanks">Thank you for exploring.</p>

        {/* Credits */}
        <div className="final-credits">
          <div className="final-credit-group">
            <span className="final-credit-label">Project</span>
            <span className="final-credit-value">The Same Way Home</span>
          </div>
          <div className="final-credit-divider" />
          <div className="final-credit-group">
            <span className="final-credit-label">Team</span>
            <span className="final-credit-value">Xinrui Qi &middot; Hongxi Liu &middot; Zhuohang Duan &middot; Dailing Wu</span>
          </div>
          <div className="final-credit-divider" />
          <div className="final-credit-group">
            <span className="final-credit-label">Course</span>
            <span className="final-credit-value">CASA0028 &mdash; Story Group Work &middot; UCL CASA &middot; 2026</span>
          </div>
        </div>

        {/* Links */}
        <div className="final-links">
          <a
            href="https://github.com/XINRUIQI/CASA0028-Story-Group-Work"
            target="_blank"
            rel="noopener noreferrer"
            className="final-link"
          >
            Source Code
          </a>
          <span className="final-link-dot">&middot;</span>
          <a href="mailto:ucfnxqi@ucl.ac.uk" className="final-link">
            Contact
          </a>
        </div>

        {/* Back to Top pill button */}
        <button onClick={() => router.push("/")} className="final-back-btn" type="button">
          &uarr;&ensp;Back to Start
        </button>
      </div>

      {/* Sparkle decoration */}
      <div className="final-sparkle" aria-hidden="true">
        <svg
          width="24"
          height="24"
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
