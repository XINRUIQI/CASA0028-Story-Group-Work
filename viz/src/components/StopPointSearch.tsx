"use client";

import { useState, useEffect, useRef } from "react";
import { Search, MapPin, WifiOff } from "lucide-react";
import { api, StopPointMatch } from "@/lib/api";

const UK_POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/* Common London stations for offline/static fallback search */
const OFFLINE_STOPS: StopPointMatch[] = [
  { name: "King's Cross St. Pancras", naptan_id: "940GZZLUKSX", lat: 51.5308, lon: -0.1238, modes: ["tube", "rail"] },
  { name: "Euston Square", naptan_id: "940GZZLUESQ", lat: 51.5258, lon: -0.1354, modes: ["tube"] },
  { name: "Euston", naptan_id: "940GZZLUEUS", lat: 51.5282, lon: -0.1337, modes: ["tube", "rail"] },
  { name: "Paddington", naptan_id: "940GZZLUPAC", lat: 51.5154, lon: -0.1755, modes: ["tube", "rail"] },
  { name: "Liverpool Street", naptan_id: "940GZZLULVT", lat: 51.5178, lon: -0.0823, modes: ["tube", "rail"] },
  { name: "Victoria", naptan_id: "940GZZLUVIC", lat: 51.4965, lon: -0.1447, modes: ["tube", "rail"] },
  { name: "Waterloo", naptan_id: "940GZZLUWLO", lat: 51.5036, lon: -0.1143, modes: ["tube", "rail"] },
  { name: "London Bridge", naptan_id: "940GZZLULNB", lat: 51.5052, lon: -0.0864, modes: ["tube", "rail"] },
  { name: "Bank", naptan_id: "940GZZLUBNK", lat: 51.5133, lon: -0.0886, modes: ["tube"] },
  { name: "Oxford Circus", naptan_id: "940GZZLUOXC", lat: 51.5152, lon: -0.1415, modes: ["tube"] },
  { name: "Piccadilly Circus", naptan_id: "940GZZLUPCC", lat: 51.5100, lon: -0.1347, modes: ["tube"] },
  { name: "Leicester Square", naptan_id: "940GZZLULSQ", lat: 51.5113, lon: -0.1281, modes: ["tube"] },
  { name: "Tottenham Court Road", naptan_id: "940GZZLUTCR", lat: 51.5165, lon: -0.1310, modes: ["tube"] },
  { name: "Green Park", naptan_id: "940GZZLUGPK", lat: 51.5067, lon: -0.1428, modes: ["tube"] },
  { name: "Westminster", naptan_id: "940GZZLUWSM", lat: 51.5010, lon: -0.1254, modes: ["tube"] },
  { name: "Canary Wharf", naptan_id: "940GZZLUCYF", lat: 51.5035, lon: -0.0187, modes: ["tube"] },
  { name: "Stratford", naptan_id: "940GZZLUSTD", lat: 51.5416, lon: -0.0042, modes: ["tube", "rail"] },
  { name: "Brixton", naptan_id: "940GZZLUBXN", lat: 51.4627, lon: -0.1145, modes: ["tube"] },
  { name: "Camden Town", naptan_id: "940GZZLUCTN", lat: 51.5392, lon: -0.1427, modes: ["tube"] },
  { name: "Angel", naptan_id: "940GZZLUAGL", lat: 51.5322, lon: -0.1058, modes: ["tube"] },
  { name: "Seven Sisters", naptan_id: "HUBSVS", lat: 51.5822, lon: -0.0749, modes: ["tube", "rail"] },
  { name: "Barking", naptan_id: "940GZZLUBKG", lat: 51.5396, lon: 0.0809, modes: ["tube", "rail"] },
  { name: "Greenwich", naptan_id: "HUBGNW", lat: 51.4781, lon: -0.0149, modes: ["rail"] },
  { name: "Finsbury Park", naptan_id: "940GZZLUFPK", lat: 51.5642, lon: -0.1065, modes: ["tube", "rail"] },
  { name: "Bethnal Green", naptan_id: "940GZZLUBLG", lat: 51.5270, lon: -0.0549, modes: ["tube"] },
  { name: "Mile End", naptan_id: "940GZZLUMED", lat: 51.5249, lon: -0.0332, modes: ["tube"] },
  { name: "Whitechapel", naptan_id: "940GZZLUWPL", lat: 51.5194, lon: -0.0599, modes: ["tube"] },
  { name: "Shoreditch High Street", naptan_id: "910GSHRDHST", lat: 51.5234, lon: -0.0756, modes: ["rail"] },
  { name: "Clapham Junction", naptan_id: "910GCLPHMJC", lat: 51.4641, lon: -0.1704, modes: ["rail"] },
  { name: "Elephant & Castle", naptan_id: "940GZZLUEAC", lat: 51.4943, lon: -0.1005, modes: ["tube", "rail"] },
  { name: "Vauxhall", naptan_id: "940GZZLUVXL", lat: 51.4861, lon: -0.1233, modes: ["tube", "rail"] },
  { name: "Moorgate", naptan_id: "940GZZLUMGT", lat: 51.5186, lon: -0.0886, modes: ["tube", "rail"] },
  { name: "Farringdon", naptan_id: "940GZZLUFAR", lat: 51.5203, lon: -0.1053, modes: ["tube", "rail"] },
  { name: "Holborn", naptan_id: "940GZZLUHBN", lat: 51.5174, lon: -0.1201, modes: ["tube"] },
  { name: "Covent Garden", naptan_id: "940GZZLUCGN", lat: 51.5129, lon: -0.1243, modes: ["tube"] },
  { name: "Notting Hill Gate", naptan_id: "940GZZLUNHG", lat: 51.5094, lon: -0.1967, modes: ["tube"] },
  { name: "Earl's Court", naptan_id: "940GZZLUECT", lat: 51.4914, lon: -0.1935, modes: ["tube"] },
  { name: "Hammersmith", naptan_id: "940GZZLUHSD", lat: 51.4936, lon: -0.2251, modes: ["tube"] },
  { name: "Shepherd's Bush", naptan_id: "940GZZLUSBC", lat: 51.5046, lon: -0.2187, modes: ["tube"] },
  { name: "Wembley Park", naptan_id: "940GZZLUWEM", lat: 51.5635, lon: -0.2795, modes: ["tube"] },
];

async function geocodePostcode(
  postcode: string
): Promise<StopPointMatch | null> {
  try {
    const clean = postcode.replace(/\s+/g, "").toUpperCase();
    const res = await fetch(`https://api.postcodes.io/postcodes/${clean}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status !== 200 || !data.result) return null;
    const r = data.result;
    return {
      name: `${r.postcode} — ${r.admin_ward}, ${r.admin_district}`,
      naptan_id: "",
      lat: r.latitude,
      lon: r.longitude,
      modes: ["postcode"],
    };
  } catch {
    return null;
  }
}

function offlineSearch(q: string): StopPointMatch[] {
  const lower = q.toLowerCase();
  return OFFLINE_STOPS.filter((s) => s.name.toLowerCase().includes(lower)).slice(0, 8);
}

interface StopPointSearchProps {
  label: string;
  placeholder: string;
  onSelect: (match: StopPointMatch) => void;
  value?: string;
}

export default function StopPointSearch({
  label,
  placeholder,
  onSelect,
  value = "",
}: StopPointSearchProps) {
  const [query, setQuery] = useState(value);
  const [matches, setMatches] = useState<StopPointMatch[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 2) {
      setMatches([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const results: StopPointMatch[] = [];

      if (UK_POSTCODE_RE.test(val.trim())) {
        const pc = await geocodePostcode(val.trim());
        if (pc) results.push(pc);
      }

      try {
        const res = await api.searchStopPoint(val);
        results.push(...res.matches);
        setOffline(false);
      } catch {
        results.push(...offlineSearch(val));
        setOffline(true);
      }

      setMatches(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 300);
  };

  return (
    <div className="relative" ref={ref}>
      <label
        className="block text-sm font-medium mb-1.5"
        style={{ color: "var(--text-secondary)" }}
      >
        {label}
      </label>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        />
        <input
          className="input-field pl-9"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => matches.length > 0 && setOpen(true)}
        />
        {loading && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            ...
          </span>
        )}
      </div>

      {offline && matches.length === 0 && query.length >= 2 && !loading && (
        <div
          className="flex items-center gap-1.5 mt-1.5 text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          <WifiOff size={12} />
          <span>Offline mode — showing common stations only</span>
        </div>
      )}

      {open && matches.length > 0 && (
        <ul
          className="absolute z-40 w-full mt-1 rounded-lg border overflow-hidden max-h-60 overflow-y-auto"
          style={{
            background: "var(--bg-card)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {offline && (
            <li
              className="px-3 py-1.5 text-xs flex items-center gap-1.5"
              style={{ color: "var(--text-muted)", background: "var(--bg-secondary)" }}
            >
              <WifiOff size={11} />
              Offline — showing common stations
            </li>
          )}
          {matches.map((m, i) => (
            <li
              key={m.naptan_id || `pc-${i}`}
              className="px-3 py-2.5 cursor-pointer transition-colors text-sm"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
              onClick={() => {
                onSelect(m);
                setQuery(m.name);
                setOpen(false);
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--bg-card-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <div className="flex items-center gap-1.5">
                {m.modes.includes("postcode") && (
                  <MapPin size={14} style={{ color: "var(--accent-amber)" }} />
                )}
                <span style={{ color: "var(--text-primary)" }}>{m.name}</span>
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {m.modes.join(", ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
