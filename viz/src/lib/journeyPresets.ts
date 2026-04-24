export const COMPARE_TIMES = ["14:00", "19:00", "00:00"] as const;

export const DISPLAY_TIME_LABELS: Record<string, string> = {
  "14:00": "14:00",
  "19:00": "19:00",
  "00:00": "24:00",
};

export const TIME_OF_DAY_LABELS: Record<string, string> = {
  "14:00": "☀️ Daytime",
  "19:00": "🌆 Evening",
  "00:00": "🌙 Late Night",
};

export const FIXED_ROUTE_PRESETS = {
  student: {
    origin: "940GZZLUESQ",
    destination: "HUBSVS",
    originName: "Euston Square",
    destinationName: "Seven Sisters",
  },
  budget: {
    origin: "940GZZLUSTD",
    destination: "940GZZLUBXN",
    originName: "Stratford",
    destinationName: "Brixton",
  },
  nightworker: {
    origin: "940GZZLUKSX",
    destination: "940GZZLUBKG",
    originName: "King's Cross St Pancras",
    destinationName: "Barking",
  },
  unfamiliar: {
    origin: "940GZZLULVT",
    destination: "940GZZDLGRE",
    originName: "Liverpool Street",
    destinationName: "Greenwich",
  },
} as const;

export function encodeCompareTimes(times: readonly string[] = COMPARE_TIMES): string {
  return times.join(",");
}

export function formatDisplayTime(time: string): string {
  return DISPLAY_TIME_LABELS[time] ?? time;
}