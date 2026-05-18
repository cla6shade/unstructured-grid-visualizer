export function pickZoomThreshold(
  zoom: number,
  thresholds: readonly number[],
): number | null {
  let best: number | null = null;
  for (const t of thresholds) {
    if (t <= zoom && (best === null || t > best)) best = t;
  }
  return best;
}
