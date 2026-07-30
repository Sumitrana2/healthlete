export const ROLES = [
  "Brand Manager",
  "Marketing Director",
  "Agency Partner",
  "Media / Media Planning",
  "Medical / Regulatory",
  "Other",
] as const;

export const REQUEST_TYPES = [
  "First Look — curated athlete preview",
  "Full platform access",
  "Campaign strategy consultation",
] as const;

export const TIMELINES = [
  "Exploring (3+ months out)",
  "Next quarter",
  "Active planning (30–90 days)",
  "Immediate need",
] as const;

export const BUDGET_RANGES = [
  "Under $500K",
  "$500K - $1M",
  "$1M - $5M",
  "$5M+",
  "Not sure yet",
] as const;

export type Role = (typeof ROLES)[number];
export type RequestType = (typeof REQUEST_TYPES)[number];
export type Timeline = (typeof TIMELINES)[number];
export type BudgetRange = (typeof BUDGET_RANGES)[number];
