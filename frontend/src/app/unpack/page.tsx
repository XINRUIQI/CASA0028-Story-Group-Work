"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import SegmentCard from "@/components/SegmentCard";
import { api, type Journey, type SupportCard } from "@/lib/api";

function UnpackContent() {
  const searchParams = useSearchParams();
  const origin = searchParams.get("origin") || "";
  const destination = searchParams.get("destination") || "";
  const time = searchParams.get("time") || "21:00";
  const priority = searchParams.get("priority") || "";
  const context = searchParams.get("context") || "";

  const [journey, setJourney] = useState<Journey | null>(null);
  const [supportCards, setSupportCards] = useState<SupportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!origin || !destination) return;
    setLoading(true);
    api
      .planJourney(origin, destination, time)
      .then(async (res) => {
        const j = res.journeys[0] || null;
        setJourney(j);
        if (j) {
          try {
            const support = await api.getRouteSupport(j.legs);
            setSupportCards(support.support_cards);
          } catch {
            setSupportCards([]);
          }
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [origin, destination, time]);

  const supportLookup = new Map<string, SupportCard>();
  supportCards.forEach((sc) => {
    if (sc.naptan_id) supportLookup.set(sc.naptan_id, sc);
  });

  const totalShops = supportCards.reduce((s, c) => s + c.nearby_shops_open, 0);
  const totalPharmacy = supportCards.reduce((s, c) => s + c.nearby_pharmacy, 0);
  const totalToilets = supportCards.reduce((s, c) => s + c.nearby_toilets, 0);
  const totalAed = supportCards.reduce((s, c) => s + c.nearby_aed, 0);
  const shelterCount = supportCards.filter((c) => c.shelter).length;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      {/* Header */}
      <section className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Unpack the Journey</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Where does the burden actually come from?
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          Total time alone does not show how a journey feels. This page breaks
          the route into segments and support conditions.
        </p>
      </section>

      {/* Current lens */}
      {(priority || context) && (
        <section className="card mb-6">
          <h2 className="text-sm font-semibold mb-2">
            Viewing this option through tonight&rsquo;s priorities
          </h2>
          <div className="flex flex-wrap gap-2">
            {priority && <span className="tag active">{priority}</span>}
            {context && <span className="tag active">{context}</span>}
          </div>
        </section>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
          Loading journey details...
        </div>
      )}
      {error && (
        <div className="text-center py-12" style={{ color: "var(--accent-rose)" }}>
          {error}
        </div>
      )}

      {/* Journey timeline */}
      {journey && !loading && (
        <>
          <section className="mb-8">
            <h2 className="font-semibold mb-4">Step by step</h2>
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
          <section className="card mb-8">
            <h2 className="font-semibold mb-4">Support along the way</h2>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
              This is not about declaring danger. It is about showing whether
              the journey remains recoverable and supported after dark.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { label: "Shelters", value: `${shelterCount} / ${supportCards.length}` },
                { label: "Toilets", value: String(totalToilets) },
                { label: "Late-open shops", value: String(totalShops) },
                { label: "Pharmacy / healthcare", value: String(totalPharmacy) },
                { label: "AED access", value: String(totalAed) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="p-3 rounded-lg text-center"
                  style={{ background: "var(--bg-secondary)" }}
                >
                  <div className="text-lg font-bold">{item.value}</div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Activity / Exposure */}
          <section className="card mb-8">
            <h2 className="font-semibold mb-3">
              Activity and exposure context
            </h2>
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              Some waiting environments become quieter, thinner, and harder to
              recover from later at night.
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Recorded incidents are shown only as contextual information, not
              as exact danger labels.
            </p>
          </section>

          {/* Interpretive summary */}
          <section className="card mb-8">
            <h2 className="font-semibold mb-3">
              What this option asks of you
            </h2>
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

      {/* Navigation */}
      <div className="flex flex-wrap gap-3 justify-center mt-8">
        <Link
          href={`/compare?origin=${origin}&destination=${destination}&times=18:00,21:00,22:30`}
          className="btn-secondary"
        >
          Compare another time
        </Link>
        <Link href="/" className="btn-secondary">
          Change tonight&rsquo;s priorities
        </Link>
        <Link href="/reflection" className="btn-secondary">
          Go to reflection
        </Link>
      </div>

      {/* Page core sentence */}
      <p
        className="text-center text-sm mt-8"
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
        <div className="max-w-4xl mx-auto px-6 py-12 text-center" style={{ color: "var(--text-muted)" }}>
          Loading...
        </div>
      }
    >
      <UnpackContent />
    </Suspense>
  );
}
