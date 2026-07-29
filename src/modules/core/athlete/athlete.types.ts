export type Platform = "instagram" | "youtube" | "twitter";
export type Provider = "hyperauditor";

export interface SelectedPlatform {
  platform: Platform;
  username: string;
  social_id: string;
  display_title: string;
  avatar_url: string | null;
  subscribers_count?: number;
  is_verified: boolean;
}

export interface CreateAthleteWithPlatformDto {
  provider: Provider;
  platform: SelectedPlatform;
  forceCreate?: boolean;
}

export interface AddPlatformDto {
  athleteId: string;
  provider: Provider;
  platform: SelectedPlatform;
}

export type AthleteField =
  | "id"
  | "fullName"
  | "slug"
  | "country"
  | "description"
  | "avatarUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt";

export interface AthleteFilters {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  fields?: AthleteField[];
  includePlatformLinks?: boolean;
  includeProviders?: boolean;
  syncStatus?: string[];
}

// ── Manual admin update — sirf isActive ─────────────────────────────────────────
export interface UpdateAthleteDto {
  isActive?: boolean;
}

export interface AthletePlatformLink {
  id: string;
  athleteId: string;
  provider: string;
  platform: string;
  providerSocialId: string | null;
  username: string | null;
  profileUrl: string | null;
  avatarUrl: string | null;
  displayTitle: string | null;
  subscribersCount: number | null;
  isVerified: boolean;
  reportState: string;
  rawData: unknown;
  lastSyncedAt: Date | null;
}

// ── AI + sync se aggregate hone wale fields ─────────────────────────────────────
export interface AthleteAggregatedFields {
  description?: string | null;
  isDescriptionAdded?: boolean;
  country?: string | null;
  countryName?: string | null; 
  gender?: string | null;
  languages?: string[];
  emails?: string[];
  categories?: string[];
  healthConditions?: string[];  
  personalHealthConnections?: PersonalHealthConnection[];
}

export interface PlatformSyncUpdate {
  rawData: unknown;
  profileUrl?: string | null;
  reportState: "ready" | "failed" | "syncing";
  lastSyncedAt: Date;
}

export type SyncStatus = "pending" | "syncing" | "failed" | "completed";

// ── AI enrichment types ──────────────────────────────────────────────────────────
export interface AIEnrichmentInput {
  fullName: string;
  // bios: string[];
  usernames: string[];
}

export interface PersonalHealthConnection {
  condition: string;
  relationship: string;
  reason: string;
}

export interface AIEnrichmentResult {
  country?: string | null;
  countryName?: string | null; 
  description?: string | null;
  languages?: string[];
  categories?: string[];
  gender?: string | null;
  healthConditions?: string[];
  personalHealthConnections: PersonalHealthConnection[];
}

export interface PersonalHealthScoreResult {
  score: number;
  matched: {
    condition: string;
    matchedBy: "condition" | "reason";
    relationship: string;
  }[];
  unmatched: string[];
}