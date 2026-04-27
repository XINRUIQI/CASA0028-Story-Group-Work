"use client";

import { useEffect } from "react";
import { getPublicBasePath } from "@/lib/publicBasePath";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const goHome = () => {
    window.location.assign(`${getPublicBasePath() || ""}/`);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    goHome();
  };

  return (
    <section className="max-w-3xl mx-auto px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.2em] mb-4" style={{ color: "var(--text-muted)" }}>
        Page fallback
      </p>
      <h1 className="text-3xl font-bold mb-4">This view could not be loaded.</h1>
      <p className="mb-8" style={{ color: "var(--text-secondary)" }}>
        The rest of the story is still available. If this happened on a map view,
        your browser may not be able to initialise WebGL.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="refl-nav-btn" onClick={reset}>
          Try again
        </button>
        <button type="button" className="refl-nav-btn refl-nav-secondary" onClick={goBack}>
          Back
        </button>
        <button type="button" className="refl-nav-btn refl-nav-secondary" onClick={goHome}>
          Back to start
        </button>
      </div>
    </section>
  );
}
