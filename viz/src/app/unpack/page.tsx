"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SegmentCard from "@/components/SegmentCard";
import ModuleExplainer from "@/components/ModuleExplainer";
import { useReveal } from "@/lib/useReveal";
import { api, type Journey, type SupportCard } from "@/lib/api";

function UnpackContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const time = searchParams.get("time") || "";

  const hasRouteQuery = Boolean(origin && destination);

  const [journey, setJourney] = useState<Journey | null>(null);
  const [supportCards, setSupportCards] = useState<SupportCard[]>([]);
  const [loading, setLoading] = useState(hasRouteQuery);
  const [error, setError] = useState("");

  const revealRef = useReveal();

  useEffect(() => {
    if (!origin || !destination) return;
    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const res = await api.planJourney(origin, destination, time || "21:00");
        if (cancelled) return;
        const j = res.journeys[0] || null;
        setJourney(j);
        if (j) {
          try {
            const support = await api.getRouteSupport(j.legs, time || "21:00");
            if (!cancelled) setSupportCards(support.support_cards);
          } catch {
            if (!cancelled) setSupportCards([]);
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [origin, destination, time]);

  const supportLookup = new Map<string, SupportCard>();
  supportCards.forEach((sc) => {
    if (sc.naptan_id) supportLookup.set(sc.naptan_id, sc);
  });

  const totalShops = supportCards.reduce((s, c) => s + c.nearby_shops_open, 0);
  const totalPharmacy = supportCards.reduce((s, c) => s + c.nearby_pharmacy_open, 0);
  const totalToilets = supportCards.reduce((s, c) => s + c.nearby_toilets, 0);
  const totalAed = supportCards.reduce((s, c) => s + c.nearby_aed, 0);
  const shelterCount = supportCards.filter((c) => c.shelter).length;

  return (
    <div ref={revealRef} className="max-w-4xl mx-auto px-6 pt-20 pb-16">
      {/* ── Page header ── */}
      <section className="reveal-section text-center mb-14">
        <p className="section-label">What changes after dark</p>
        <h1 className="text-3xl font-bold mb-3">
          Not just slower —{" "}
          <span style={{ color: "var(--accent-amber)" }}>
            structurally different
          </span>
        </h1>
        <p
          className="text-base max-w-2xl mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          The same journey after dark is not simply delayed. The support around
          it thins, the service becomes less recoverable, and the walking
          segments feel different. Here is how we measure each dimension — and
          what we cannot measure.
        </p>
      </section>

      {/* ── Five-module scroll-driven explanation ── */}
      <section className="mb-16">
        <ModuleExplainer />
      </section>

      {/* ── Summary principle ── */}
      <section className="reveal-section text-center mb-16">
        <div className="card" style={{ maxWidth: 560, margin: "0 auto" }}>
          <h3 className="text-lg font-semibold mb-2">
            Why these are not combined into a single score
          </h3>
          <ul className="unpack-reason-list">
            <li>Different users weigh the same conditions differently</li>
            <li>Police data locations are approximate</li>
            <li>Lighting is infrastructure presence, not brightness</li>
            <li>Service uncertainty is inferred, not measured</li>
            <li>OSM coverage varies across London</li>
          </ul>
          <p
            className="text-sm mt-3"
            style={{ color: "var(--text-muted)" }}
          >
            The appropriate output is not a danger score, but a set of
            comparable trade-offs.
          </p>
        </div>
      </section>

      {/* ── Route breakdown (if query params provided) ── */}
      {loading && (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          Loading journey details...
        </div>
      )}
      {error && (
        <div className="text-center py-12">
          <p style={{ color: "var(--accent-rose)" }} className="mb-3">{error}</p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            Custom routes require a live backend. On the static site, only preset routes are available.
          </p>
          <Link href="/" className="btn-secondary px-5 py-2 text-sm">
            ← Back to preset journeys
          </Link>
        </div>
      )}

      {journey && !loading && (
        <>
          <section className="reveal-section mb-4">
            <p className="section-label">Journey breakdown · {time || "21:00"}</p>
            <h2 className="text-xl font-bold mb-1">Step by step</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Each segment shows its support conditions at the selected time.
            </p>
          </section>

          <section className="reveal-section mb-8">
            <div className="space-y-3">
              {journey.legs.map((leg, i) => (
                <SegmentCard
                  key={i}
                  index={i}
                  leg={leg}
                  support={supportLookup.get(leg.departure_point.naptan_id)}
                />
              ))}
            </div>
          </section>

          {/* Support summary */}
          <section className="reveal-section card mb-8">
            <h2 className="font-semibold mb-4">Support along the way</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              Showing whether the journey remains recoverable and supported at
              this hour — not declaring danger.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Shelters", value: `${shelterCount} / ${supportCards.length}` },
                { label: "Toilets", value: String(totalToilets) },
                { label: "Late-open shops", value: String(totalShops) },
                { label: "Pharmacy", value: String(totalPharmacy) },
                { label: "AED access", value: String(totalAed) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg text-center"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <div className="text-lg font-bold">{item.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interpretive summary */}
          <section className="reveal-section card mb-8">
            <h2 className="font-semibold mb-3">What this option asks of you</h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {journey.transfers === 0
                ? "This option avoids interchange, but may shift more burden into waiting or walking."
                : journey.transfers === 1
                  ? "This option includes one interchange. Missing the connection may increase overall journey time significantly."
                  : `This option involves ${journey.transfers} interchanges. Each adds waiting and uncertainty.`}
            </p>
          </section>
        </>
      )}

      {/* ── Navigation ── */}
      <div className="reveal-section flex flex-wrap gap-3 justify-center mt-8">
        <Link href="/compare" className="btn-secondary">
          Compare journeys
        </Link>
        <Link href="/reflection" className="btn-secondary">
          Reflection & limits
        </Link>
      </div>

      <p
        className="reveal-section text-center text-sm mt-8"
        style={{ color: "var(--text-muted)" }}
      >
        Not all costs are visible in total journey time.
      </p>
    </div>
  );
}

export default function UnpackPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-6 py-20 text-center" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      }
    >
      <UnpackContent />
    </Suspense>
  );
}
