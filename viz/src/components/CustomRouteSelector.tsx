"use client";

import { useState, useEffect } from "react";
import { MapPin } from "lucide-react";

const STATIC_PREFIX = process.env.NEXT_PUBLIC_BASE_PATH || "";

interface Station {
  id: string;
  name: string;
  zone: string;
}

interface StationManifest {
  stations: Station[];
  compareTimes: string[];
  pairCount: number;
}

let _manifestCache: StationManifest | null = null;
let _manifestPromise: Promise<StationManifest | null> | null = null;

function loadManifest(): Promise<StationManifest | null> {
  if (_manifestCache) return Promise.resolve(_manifestCache);
  if (_manifestPromise) return _manifestPromise;
  _manifestPromise = fetch(
    `${STATIC_PREFIX}/static-data/custom-od-stations.json`,
  )
    .then((r) => (r.ok ? r.json() : null))
    .catch(() => null)
    .then((data: StationManifest | null) => {
      _manifestCache = data;
      return data;
    });
  return _manifestPromise;
}

interface Props {
  currentOrigin?: string;
  currentDestination?: string;
  onSelect: (origin: string, originName: string, dest: string, destName: string) => void;
}

export default function CustomRouteSelector({
  currentOrigin,
  currentDestination,
  onSelect,
}: Props) {
  const [manifest, setManifest] = useState<StationManifest | null>(
    _manifestCache,
  );
  const [origin, setOrigin] = useState(currentOrigin || "");
  const [destination, setDestination] = useState(currentDestination || "");

  useEffect(() => {
    if (_manifestCache) return;
    let stale = false;
    loadManifest().then((m) => {
      if (!stale) setManifest(m);
    });
    return () => {
      stale = true;
    };
  }, []);

  useEffect(() => {
    if (currentOrigin) setOrigin(currentOrigin);
  }, [currentOrigin]);

  useEffect(() => {
    if (currentDestination) setDestination(currentDestination);
  }, [currentDestination]);

  if (!manifest) return null;

  const stations = manifest.stations;
  const originStation = stations.find((s) => s.id === origin);
  const destStation = stations.find((s) => s.id === destination);
  const canSubmit =
    origin && destination && origin !== destination && originStation && destStation;

  const handleGo = () => {
    if (!canSubmit) return;
    onSelect(origin, originStation.name, destination, destStation.name);
  };

  return (
    <div className="custom-route-selector">
      <div className="custom-route-label">
        <MapPin size={14} />
        <span>Custom route</span>
      </div>

      <div className="custom-route-controls">
        <select
          className="custom-route-select"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
        >
          <option value="">Origin…</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id} disabled={s.id === destination}>
              {s.name} ({s.zone})
            </option>
          ))}
        </select>

        <span className="custom-route-arrow">→</span>

        <select
          className="custom-route-select"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        >
          <option value="">Destination…</option>
          {stations.map((s) => (
            <option key={s.id} value={s.id} disabled={s.id === origin}>
              {s.name} ({s.zone})
            </option>
          ))}
        </select>

        <button
          className="custom-route-btn"
          disabled={!canSubmit}
          onClick={handleGo}
          type="button"
        >
          Compare
        </button>
      </div>
    </div>
  );
}
