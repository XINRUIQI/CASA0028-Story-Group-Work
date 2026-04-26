/**
 * Composite City Vitality Index — interpolation utilities.
 *
 * 6 known time-points from /public/static-data/city-vitality.json.
 * Hours use a 9–25 scale (01:00 next day = 25) so the slider is monotonic.
 */

export interface VitalityComponents {
  service_freq: number;
  support_access: number;
  certainty: number;
  safety: number;
}

export interface VitalitySnapshot {
  hour: number;
  density: number;
  components: VitalityComponents;
  color: string;
}

const POINTS: {
  hour: number;
  density: number;
  components: VitalityComponents;
  color: string;
}[] = [
  { hour: 9,  density: 0.91, components: { service_freq: 0.95, support_access: 0.97, certainty: 0.81, safety: 0.89 }, color: "#f0b87a" },
  { hour: 12, density: 0.88, components: { service_freq: 0.87, support_access: 0.97, certainty: 0.76, safety: 0.89 }, color: "#e8b270" },
  { hour: 15, density: 0.87, components: { service_freq: 0.86, support_access: 0.97, certainty: 0.76, safety: 0.89 }, color: "#dca858" },
  { hour: 18, density: 0.90, components: { service_freq: 0.92, support_access: 0.97, certainty: 0.80, safety: 0.89 }, color: "#c9a05c" },
  { hour: 21, density: 0.64, components: { service_freq: 0.53, support_access: 0.66, certainty: 0.60, safety: 0.82 }, color: "#8a7a5a" },
  { hour: 25, density: 0.35, components: { service_freq: 0.18, support_access: 0.22, certainty: 0.38, safety: 0.78 }, color: "#5a554a" },
];

export const TICK_HOURS = POINTS.map((p) => p.hour);

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function lerpColor(c1: string, c2: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const [r1, g1, b1] = parse(c1);
  const [r2, g2, b2] = parse(c2);
  const r = Math.round(lerp(r1, r2, t));
  const g = Math.round(lerp(g1, g2, t));
  const b = Math.round(lerp(b1, b2, t));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function interpolateVitality(hour: number): VitalitySnapshot {
  if (hour <= POINTS[0].hour) return { ...POINTS[0] };
  if (hour >= POINTS[POINTS.length - 1].hour) return { ...POINTS[POINTS.length - 1] };

  let lo = 0;
  for (let i = 1; i < POINTS.length; i++) {
    if (POINTS[i].hour >= hour) { lo = i - 1; break; }
  }
  const hi = lo + 1;
  const t = (hour - POINTS[lo].hour) / (POINTS[hi].hour - POINTS[lo].hour);

  return {
    hour,
    density: lerp(POINTS[lo].density, POINTS[hi].density, t),
    components: {
      service_freq: lerp(POINTS[lo].components.service_freq, POINTS[hi].components.service_freq, t),
      support_access: lerp(POINTS[lo].components.support_access, POINTS[hi].components.support_access, t),
      certainty: lerp(POINTS[lo].components.certainty, POINTS[hi].components.certainty, t),
      safety: lerp(POINTS[lo].components.safety, POINTS[hi].components.safety, t),
    },
    color: lerpColor(POINTS[lo].color, POINTS[hi].color, t),
  };
}

export function formatHour(hour: number): string {
  const h = hour >= 24 ? hour - 24 : hour;
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export const DAYTIME_SNAPSHOT = interpolateVitality(9);
