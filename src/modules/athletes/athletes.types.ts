// ─── athletes.types.ts ────────────────────────────────────────────────────────
// Pure TypeScript interfaces for the athletes domain.
// No Zod, no Drizzle — just shapes used across routes, service, and tests.

export type AthleteStatus = 'active' | 'inactive' | 'pending' | 'flagged';

// What we return in a list (lightweight)
export interface AthleteListItem {
  id: string;
  slug: string;
  displayName: string | null;
  firstName: string;
  lastName: string;
  sport: string | null;
  country: string | null;
  healthCategories: string[];
  profileImageUrl: string | null;
  isVerified: boolean | null;
  isFeatured: boolean | null;
}

// Full profile returned by GET /athletes/:slug
export interface AthleteProfile extends AthleteListItem {
  league: string | null;
  position: string | null;
  state: string | null;
  gender: string | null;
  birthYear: number | null;
  bio: string | null;
  instagramHandle: string | null;
  twitterHandle: string | null;
  tiktokHandle: string | null;
  youtubeHandle: string | null;
  status: AthleteStatus | null;
  createdAt: Date;
  updatedAt: Date;
  scores: AthleteScoreSummary | null;
}

// Score snapshot attached to a profile
export interface AthleteScoreSummary {
  matchScore: string | null;
  reputationRiskScore: string | null;
  pharmaComplianceScore: string | null;
  audienceTrustScore: string | null;
  resonanceScore: string | null;
  credibilityScore: string | null;
  computedAt: Date;
}

// Filters accepted by GET /athletes
export interface AthleteFilters {
  sport?: string;
  country?: string;
  healthCategory?: string;
  isFeatured?: boolean;
  limit: number;
  offset: number;
}

// Shape for creating an athlete (admin only)
export interface CreateAthleteInput {
  firstName: string;
  lastName: string;
  displayName?: string;
  sport?: string;
  country?: string;
  healthCategories?: string[];
  bio?: string;
}

// Shape for partial update
export type UpdateAthleteInput = Partial<CreateAthleteInput>;

// Paginated response wrapper
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}