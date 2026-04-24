import type { CardData } from "@/lib/api";

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toFiniteNumber(value: unknown): number | null {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export interface NormalizedUncertainty {
  scorePct: number | null;
  label: string | null;
  headwayComponent: number;
  alternativesComponent: number;
  transferComponent: number;
  statusComponent: number;
  meanHeadwayGapRatio: number | null;
  meanAlternativeRoutes: number | null;
}

export function normalizeServiceUncertainty(
  card?: CardData | Record<string, unknown> | null,
  fallbackTransferCount = 0,
): NormalizedUncertainty {
  if (!card) {
    return {
      scorePct: null,
      label: null,
      headwayComponent: 0,
      alternativesComponent: 0,
      transferComponent: 0,
      statusComponent: 0,
      meanHeadwayGapRatio: null,
      meanAlternativeRoutes: null,
    };
  }

  const meanHeadwayGapRatio = toFiniteNumber(card.mean_headway_gap_ratio);
  const linesChecked = toFiniteNumber(card.lines_checked);
  const fallbackLinesTotal = toFiniteNumber(card.fallback_lines_total);
  const inferredAlternativeRoutes =
    linesChecked && linesChecked > 0 && fallbackLinesTotal != null
      ? Math.max(fallbackLinesTotal / linesChecked - 1, 0)
      : null;
  const meanAlternativeRoutes =
    toFiniteNumber(card.mean_alternative_routes) ?? inferredAlternativeRoutes;
  const disruptionCount = toFiniteNumber(card.disruption_count) ?? 0;
  const transferCount =
    toFiniteNumber(card.transfer_count) ?? fallbackTransferCount;

  const headwayComponent =
    toFiniteNumber(card.headway_component) ??
    (meanHeadwayGapRatio != null
      ? Math.round(clamp((meanHeadwayGapRatio - 1) / 2, 0, 1) * 35)
      : 0);

  const alternativesComponent =
    toFiniteNumber(card.alternatives_component) ??
    (meanAlternativeRoutes != null
      ? Math.round(clamp((4 - meanAlternativeRoutes) / 4, 0, 1) * 25)
      : 25);

  const transferComponent =
    toFiniteNumber(card.transfer_component) ??
    Math.round((clamp(transferCount, 0, 3) / 3) * 20);

  const statusComponent =
    toFiniteNumber(card.status_component) ??
    (linesChecked && linesChecked > 0
      ? Math.round(clamp(disruptionCount / linesChecked, 0, 1) * 20)
      : 0);

  const scorePct =
    toFiniteNumber(card.uncertainty_score_pct) ??
    Math.min(
      100,
      headwayComponent +
        alternativesComponent +
        transferComponent +
        statusComponent,
    );

  const label =
    typeof card.uncertainty_label === "string"
      ? card.uncertainty_label
      : scorePct >= 75
        ? "very high"
        : scorePct >= 50
          ? "high"
          : scorePct >= 25
            ? "moderate"
            : scorePct >= 0
              ? "low"
              : null;

  return {
    scorePct,
    label,
    headwayComponent,
    alternativesComponent,
    transferComponent,
    statusComponent,
    meanHeadwayGapRatio,
    meanAlternativeRoutes,
  };
}