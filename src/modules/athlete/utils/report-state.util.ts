/** Live/Node report_state values. Nest legacy values are accepted on read. */
export type ReportState =
  | "not_synced"
  | "syncing"
  | "ready"
  | "failed"
  | "pending"
  | "processing"
  | "completed";

export type CanonicalReportState = "not_synced" | "syncing" | "ready" | "failed";

const READY_STATES = new Set(["ready", "completed", "success", "synced", "done"]);
const SYNCING_STATES = new Set(["syncing", "processing"]);
const FAILED_STATES = new Set(["failed"]);

/** Normalize any Nest/Node report_state to the live/Node canonical value. */
export function toCanonicalReportState(
  state: string | null | undefined,
): CanonicalReportState {
  const value = (state ?? "").trim().toLowerCase();
  if (READY_STATES.has(value)) return "ready";
  if (SYNCING_STATES.has(value)) return "syncing";
  if (FAILED_STATES.has(value)) return "failed";
  return "not_synced";
}

export function isReportSynced(state: string | null | undefined): boolean {
  return READY_STATES.has((state ?? "").trim().toLowerCase());
}

/** Values to use in SQL filters for "synced" platforms (supports Nest + Node DBs). */
export const SYNCED_REPORT_STATES = ["ready", "completed"] as const;
