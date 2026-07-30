// core/credibility/credibility-utils.ts

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function markScore(mark: string | null | undefined): number {
  switch (mark) {
    case "great":
      return 1.0;
    case "average":
      return 0.6;
    case "poor":
      return 0.3;
    default:
      return 0.0;
  }
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
