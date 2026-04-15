"use client";

import { useState } from "react";
import {
  TrainFront,
  Bus,
  MapPin,
  Clock,
  Store,
  Lightbulb,
} from "lucide-react";
import DayNightToggle, { type TimeBand } from "@/components/DayNightToggle";
import StatCard from "@/components/StatCard";
import ServiceGrid from "@/components/ServiceGrid";
import { useReveal } from "@/lib/useReveal";

/* ── City overview data (mirrors data/processed/city_overview.json) ── */

const DATA: Record<
  TimeBand,
  {
    tube: number;
    bus: number;
    stops: number;
    tubeHeadway: number;
    busHeadway: number;
    supportPct: number;
    note: string;
  }
> = {
  daytime: {
    tube: 11,
    bus: 675,
    stops: 19000,
    tubeHeadway: 3.5,
    busHeadway: 8,
    supportPct: 85,
    note: "Most services, POIs, and stations operating at full capacity.",
  },
  evening: {
    tube: 11,
    bus: 650,
    stops: 18500,
    tubeHeadway: 6,
    busHeadway: 12,
    supportPct: 55,
    note: "Service frequency drops; many shops and pharmacies begin closing.",
  },
  late_night: {
    tube: 5,
    bus: 120,
    stops: 6500,
    tubeHeadway: 10,
    busHeadway: 18,
    supportPct: 15,
    note: "Night Tube on 5 lines (Fri/Sat); night buses only otherwise. Most POIs closed.",
  },
};

const DAY = DATA.daytime;

export default function OverviewPage() {
  const [band, setBand] = useState<TimeBand>("daytime");
  const revealRef = useReveal();
  const d = DATA[band];
  const isNight = band !== "daytime";

  return (
    <div
      className="overview-page"
      style={{
        background:
          band === "daytime"
            ? "linear-gradient(180deg, var(--bg-primary) 0%, #131b32 100%)"
            : band === "evening"
              ? "linear-gradient(180deg, #0d1020 0%, #0f1428 100%)"
              : "linear-gradient(180deg, #080b14 0%, #0a0e1c 100%)",
      }}
    >
      <div ref={revealRef} className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        {/* ── Header ── */}
        <section className="reveal-section text-center mb-12">
          <p className="section-label">London after dark</p>
          <h1 className="text-3xl font-bold mb-3">
            The city doesn&rsquo;t just get dark —{" "}
            <span style={{ color: "var(--accent-amber)" }}>
              it gets thinner
            </span>
          </h1>
          <p
            className="text-base max-w-2xl mx-auto mb-8"
            style={{ color: "var(--text-secondary)" }}
          >
            Fewer lines running. Longer waits. Support places closing. The same
            network, but less of it is there for you.
          </p>
          <DayNightToggle value={band} onChange={setBand} />
        </section>

        {/* ── Network visual ── */}
        <section className="reveal-section mb-14">
          <ServiceGrid band={band} />
          <p
            className="text-center text-xs mt-3"
            style={{ color: "var(--text-muted)" }}
          >
            Each dot represents a cluster of service points. Watch how they thin
            out as the night progresses.
          </p>
        </section>

        {/* ── Stat cards ── */}
        <section className="reveal-section mb-14">
          <div className="stat-grid">
            <StatCard
              icon={<TrainFront size={20} style={{ color: "var(--accent-blue)" }} />}
              label="Tube lines active"
              dayValue={DAY.tube}
              nightValue={d.tube}
              isNight={isNight}
            />
            <StatCard
              icon={<Bus size={20} style={{ color: "var(--accent-emerald)" }} />}
              label="Bus routes running"
              dayValue={DAY.bus}
              nightValue={d.bus}
              isNight={isNight}
            />
            <StatCard
              icon={<MapPin size={20} style={{ color: "var(--accent-amber)" }} />}
              label="Active stops"
              dayValue={DAY.stops}
              nightValue={d.stops}
              isNight={isNight}
            />
            <StatCard
              icon={<Clock size={20} style={{ color: "var(--accent-rose)" }} />}
              label="Avg Tube headway"
              dayValue={DAY.tubeHeadway}
              nightValue={d.tubeHeadway}
              unit=" min"
              isNight={isNight}
              direction="increase"
            />
            <StatCard
              icon={<Clock size={20} style={{ color: "var(--accent-rose)" }} />}
              label="Avg bus headway"
              dayValue={DAY.busHeadway}
              nightValue={d.busHeadway}
              unit=" min"
              isNight={isNight}
              direction="increase"
            />
            <StatCard
              icon={<Store size={20} style={{ color: "var(--accent-emerald)" }} />}
              label="Support POIs open"
              dayValue={DAY.supportPct}
              nightValue={d.supportPct}
              unit="%"
              isNight={isNight}
            />
          </div>
        </section>

        {/* ── Narrative blocks ── */}
        <section className="reveal-section mb-14">
          <div className="overview-narrative">
            <NarrativeBlock
              accent="var(--accent-blue)"
              title="Services thin out"
              body="At night, most Tube lines stop running. Bus routes drop from 675 to around 120 night services. DLR, Elizabeth line, and most Overground lines shut entirely."
            />
            <NarrativeBlock
              accent="var(--accent-rose)"
              title="Waits get heavier"
              body="Average bus headway stretches from 8 to 18 minutes. Missing a connection means a much longer wait — and fewer alternatives."
            />
            <NarrativeBlock
              accent="var(--accent-emerald)"
              title="Support disappears"
              body="85% of shops, pharmacies, and cafés near stops are open by day. After 10pm, that drops to 15%. The walk from the bus stop feels very different."
            />
            <NarrativeBlock
              accent="var(--accent-amber)"
              title="Activity fades"
              body="Footfall at stations plummets. Streets around stops become quieter. The sense that 'someone is around' weakens — especially in outer boroughs."
            />
          </div>
        </section>

        {/* ── Context note ── */}
        <section className="reveal-section mb-14">
          <div className="overview-note-box">
            <Lightbulb size={18} style={{ color: "var(--accent-amber)" }} />
            <p>{d.note}</p>
          </div>
        </section>

        {/* ── Transition to Page 3 ── */}
        <section className="reveal-section text-center">
          <p
            className="text-sm max-w-md mx-auto mb-6"
            style={{ color: "var(--text-secondary)" }}
          >
            These are city-wide averages. On a specific route, the changes may be
            sharper — or more subtle. Compare your own journey to see.
          </p>
          <a href="/compare" className="btn-primary inline-block px-6 py-3">
            Compare a journey →
          </a>
        </section>
      </div>
    </div>
  );
}

/* ── Narrative block sub-component ── */

function NarrativeBlock({
  accent,
  title,
  body,
}: {
  accent: string;
  title: string;
  body: string;
}) {
  return (
    <div className="narrative-block">
      <div className="narrative-accent" style={{ background: accent }} />
      <div>
        <h3 className="narrative-title">{title}</h3>
        <p className="narrative-body">{body}</p>
      </div>
    </div>
  );
}
