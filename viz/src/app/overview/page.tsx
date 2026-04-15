"use client";

import { useRef, useEffect, useState, useMemo, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  Sun,
  Moon,
  Sunset,
  TrendingDown,
  Clock,
  Store,
  Lightbulb,
} from "lucide-react";
import type { TimeBand } from "@/components/DayNightToggle";
import StatCard from "@/components/StatCard";
import { useReveal } from "@/lib/useReveal";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
const CENTER: [number, number] = [-0.118, 51.509];
const N_PTS = 400;

function sr(i: number, s = 0) {
  const x = Math.sin((i + s) * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function buildSupportGeoJSON(): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < N_PTS; i++) {
    const angle = sr(i) * Math.PI * 2;
    const dist = Math.sqrt(-2 * Math.log(Math.max(sr(i, 50), 0.001))) * 0.07;
    const eveningKeep = sr(i, 300) < 0.7 ? 1 : 0;
    features.push({
      type: "Feature",
      properties: {
        n: sr(i, 200) < 0.28 ? 1 : 0,
        ev: eveningKeep,
      },
      geometry: {
        type: "Point",
        coordinates: [
          CENTER[0] + Math.cos(angle) * dist * 1.6,
          CENTER[1] + Math.sin(angle) * dist,
        ],
      },
    });
  }
  return { type: "FeatureCollection", features };
}

/* ── city-wide data ── */

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

/* ── map theme per band ── */

const MAP_THEME: Record<TimeBand, {
  roadOpacity: number;
  bgColor: string;
  allPtsOpacity: number;
  nightPtsOpacity: number;
  glowOpacity: number;
}> = {
  daytime: {
    roadOpacity: 0.4,
    bgColor: "#121626",
    allPtsOpacity: 0.45,
    nightPtsOpacity: 0,
    glowOpacity: 0,
  },
  evening: {
    roadOpacity: 0.25,
    bgColor: "#0d1120",
    allPtsOpacity: 0.25,
    nightPtsOpacity: 0.4,
    glowOpacity: 0.06,
  },
  late_night: {
    roadOpacity: 0.12,
    bgColor: "#060810",
    allPtsOpacity: 0,
    nightPtsOpacity: 0.85,
    glowOpacity: 0.15,
  },
};

/* ── bottom stats per band ── */

function bandStats(band: TimeBand) {
  const d = DATA[band];
  const pct = (cur: number, base: number) =>
    band === "daytime" ? null : `${Math.round(((cur - base) / base) * 100)}%`;
  return {
    tube: { val: String(d.tube), change: pct(d.tube, DAY.tube) },
    bus: { val: String(d.bus), change: pct(d.bus, DAY.bus) },
    stops: { val: d.stops.toLocaleString(), change: pct(d.stops, DAY.stops) },
  };
}

/* ── main page ── */

export default function OverviewPage() {
  const [band, setBand] = useState<TimeBand>("daytime");
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const readyRef = useRef(false);
  const geoJSON = useMemo(buildSupportGeoJSON, []);
  const revealRef = useReveal();

  const d = DATA[band];
  const isNight = band !== "daytime";
  const stats = bandStats(band);

  const applyTheme = useCallback((m: mapboxgl.Map, b: TimeBand) => {
    const t = MAP_THEME[b];
    for (const l of m.getStyle()?.layers ?? []) {
      if (l.type === "line" && l.id.startsWith("road"))
        m.setPaintProperty(l.id, "line-opacity", t.roadOpacity);
      if (l.type === "background")
        m.setPaintProperty(l.id, "background-color", t.bgColor);
    }
    if (m.getLayer("pts-all"))
      m.setPaintProperty("pts-all", "circle-opacity", t.allPtsOpacity);
    if (m.getLayer("pts-night"))
      m.setPaintProperty("pts-night", "circle-opacity", t.nightPtsOpacity);
    if (m.getLayer("pts-glow"))
      m.setPaintProperty("pts-glow", "circle-opacity", t.glowOpacity);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !TOKEN) return;

    /* prevent double-init from React StrictMode */
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      readyRef.current = false;
    }

    mapboxgl.accessToken = TOKEN;
    const m = new mapboxgl.Map({
      container: el,
      style: "mapbox://styles/mapbox/dark-v11",
      center: CENTER,
      zoom: 10.5,
      interactive: false,
      attributionControl: false,
    });
    mapRef.current = m;

    m.on("style.load", () => {
      if (mapRef.current !== m) return;

      for (const l of m.getStyle()?.layers ?? []) {
        if (l.type === "line" && l.id.startsWith("road")) {
          m.setPaintProperty(l.id, "line-color", "#7a7f94");
          m.setPaintProperty(l.id, "line-opacity", 0.4);
          try { m.setPaintProperty(l.id, "line-opacity-transition", { duration: 800 }); } catch { /* ok */ }
        }
      }
      for (const l of m.getStyle()?.layers ?? []) {
        if (l.type === "background") {
          try { m.setPaintProperty(l.id, "background-color-transition", { duration: 800 }); } catch { /* ok */ }
          break;
        }
      }

      if (!m.getSource("sp")) m.addSource("sp", { type: "geojson", data: geoJSON });

      if (!m.getLayer("pts-all"))
        m.addLayer({
          id: "pts-all", type: "circle", source: "sp",
          paint: {
            "circle-radius": 2, "circle-color": "#8a8fa0",
            "circle-opacity": 0.45, "circle-opacity-transition": { duration: 800 },
          },
        });

      if (!m.getLayer("pts-glow"))
        m.addLayer({
          id: "pts-glow", type: "circle", source: "sp",
          filter: ["==", ["get", "n"], 1],
          paint: {
            "circle-radius": 10, "circle-color": "#c9a96e",
            "circle-opacity": 0, "circle-opacity-transition": { duration: 800 },
            "circle-blur": 1,
          },
        });

      if (!m.getLayer("pts-night"))
        m.addLayer({
          id: "pts-night", type: "circle", source: "sp",
          filter: ["==", ["get", "n"], 1],
          paint: {
            "circle-radius": 3, "circle-color": "#c9a96e",
            "circle-opacity": 0, "circle-opacity-transition": { duration: 800 },
          },
        });

      readyRef.current = true;
    });

    return () => {
      m.remove();
      if (mapRef.current === m) {
        mapRef.current = null;
        readyRef.current = false;
      }
    };
  }, [geoJSON]);

  useEffect(() => {
    if (mapRef.current && readyRef.current) applyTheme(mapRef.current, band);
  }, [band, applyTheme]);

  return (
    <div className="overview-page" style={{ background: "var(--bg-primary)" }}>

      {/* ═══════════ Full-screen map ═══════════ */}
      <div className="ov2-page">
        <div ref={containerRef} className="ov2-map" />

        {/* 3-state toggle */}
        <div className="ov2-toggle-wrap">
          <div className="ov2-toggle">
            <button className={`ov2-tbtn ${band === "daytime" ? "active" : ""}`} onClick={() => setBand("daytime")}>
              {"[ "}<Sun size={14} />{" Daytime ]"}
            </button>
            <button className={`ov2-tbtn ${band === "evening" ? "active" : ""}`} onClick={() => setBand("evening")}>
              {"[ "}<Sunset size={14} />{" Evening ]"}
            </button>
            <button className={`ov2-tbtn ${band === "late_night" ? "active" : ""}`} onClick={() => setBand("late_night")}>
              {"[ "}<Moon size={14} />{" Late Night ]"}
            </button>
          </div>
        </div>

        {/* Bottom floating stats */}
        <div className="ov2-foot">
          <div className={`ov2-bar ${isNight ? "glow" : ""}`}>
            <BarStat label="Tube Lines Active" val={stats.tube.val} change={stats.tube.change} />
            <div className="ov2-sep" />
            <BarStat label="Bus Routes Running" val={stats.bus.val} change={stats.bus.change} />
            <div className="ov2-sep" />
            <BarStat label="Active Stops" val={stats.stops.val} change={stats.stops.change} />
          </div>
          <p className="ov2-quote">
            Night doesn&rsquo;t just get darker &mdash; services thin out,
            support fades, and waits grow heavier.
          </p>
        </div>

        {!TOKEN && (
          <div className="ov2-nomap"><p>Map requires NEXT_PUBLIC_MAPBOX_TOKEN</p></div>
        )}
      </div>

      {/* ═══════════ Below the map ═══════════ */}
      <div ref={revealRef} className="max-w-5xl mx-auto px-6 pt-20 pb-20">

        {/* ── Stat cards ── */}
        <section className="reveal-section mb-14">
          <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <StatCard
              icon={<Clock size={20} style={{ color: "#c9a96e" }} />}
              label="Avg Tube headway"
              dayValue={DAY.tubeHeadway}
              nightValue={d.tubeHeadway}
              unit=" min"
              isNight={isNight}
              direction="increase"
            />
            <StatCard
              icon={<Clock size={20} style={{ color: "#c9a96e" }} />}
              label="Avg bus headway"
              dayValue={DAY.busHeadway}
              nightValue={d.busHeadway}
              unit=" min"
              isNight={isNight}
              direction="increase"
            />
            <StatCard
              icon={<Store size={20} style={{ color: "#c9a96e" }} />}
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
              accent="#c9a96e"
              title="Services thin out"
              body="At night, most Tube lines stop running. Bus routes drop from 675 to around 120 night services. DLR, Elizabeth line, and most Overground lines shut entirely."
            />
            <NarrativeBlock
              accent="#b89a5e"
              title="Waits get heavier"
              body="Average bus headway stretches from 8 to 18 minutes. Missing a connection means a much longer wait — and fewer alternatives."
            />
            <NarrativeBlock
              accent="#d4b77d"
              title="Support disappears"
              body="85% of shops, pharmacies, and cafés near stops are open by day. After 10pm, that drops to 15%. The walk from the bus stop feels very different."
            />
            <NarrativeBlock
              accent="#a8894f"
              title="Activity fades"
              body="Footfall at stations plummets. Streets around stops become quieter. The sense that 'someone is around' weakens — especially in outer boroughs."
            />
          </div>
        </section>

        {/* ── Context note ── */}
        <section className="reveal-section mb-14">
          <div className="overview-note-box">
            <Lightbulb size={18} style={{ color: "#c9a96e" }} />
            <p>{d.note}</p>
          </div>
        </section>

        {/* ── Transition to Compare ── */}
        <section className="reveal-section text-center">
          <p className="text-sm max-w-md mx-auto mb-6" style={{ color: "var(--text-secondary)" }}>
            These are city-wide averages. On a specific route, the changes may be
            sharper — or more subtle. Compare your own journey to see.
          </p>
          <a href="/compare" className="ov2-cta inline-block px-6 py-3">
            Compare a journey &rarr;
          </a>
        </section>
      </div>
    </div>
  );
}

/* ── sub-components ── */

function NarrativeBlock({ accent, title, body }: { accent: string; title: string; body: string }) {
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

function BarStat({ label, val, change }: { label: string; val: string; change: string | null }) {
  return (
    <div className="ov2-cell">
      <span className="ov2-cell-lbl">{label}</span>
      <span className="ov2-cell-val">{val}</span>
      {change && (
        <span className="ov2-cell-change down">
          <TrendingDown size={12} />
          {change}
        </span>
      )}
    </div>
  );
}
