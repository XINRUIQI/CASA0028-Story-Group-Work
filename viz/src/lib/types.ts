export type ContextTag =
  | "travelling-alone"
  | "returning-late"
  | "carrying-bags"
  | "unfamiliar-area"
  | "commuting"
  | "student-budget";

export type Priority =
  | "less-waiting"
  | "less-walking"
  | "fewer-interchanges"
  | "more-support"
  | "busier-surroundings"
  | "lower-uncertainty";

export interface JourneyInput {
  origin: string;
  originName: string;
  destination: string;
  destinationName: string;
  times: string[];
  contexts: ContextTag[];
  priorities: Priority[];
}

export const CONTEXT_LABELS: Record<ContextTag, string> = {
  "travelling-alone": "Travelling alone",
  "returning-late": "Returning late",
  "carrying-bags": "Carrying bags",
  "unfamiliar-area": "Unfamiliar with the area",
  commuting: "Commuting after work",
  "student-budget": "On a student budget",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  "less-waiting": "Less waiting",
  "less-walking": "Less walking",
  "fewer-interchanges": "Fewer interchanges",
  "more-support": "More nearby support",
  "busier-surroundings": "Busier surroundings",
  "lower-uncertainty": "Lower uncertainty",
};
