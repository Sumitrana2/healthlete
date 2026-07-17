export type Platform = "instagram" | "youtube" | "twitter";
export type Provider = "hyperauditor";

export interface SelectedPlatform {
  platform: Platform;
  username: string;
  social_id: string;          
  display_title: string;     
  avatar_url: string ;
  subscribers_count: number;
  is_verified: boolean;     
}

export interface SyncAthleteDto {
  provider: Provider;
  platform: SelectedPlatform;
  athleteId?: string;
}

export type AthleteField =
  | "id" | "fullName" | "slug" | "country" | "description"
  | "avatarUrl" | "isActive" | "createdAt" | "updatedAt";

export interface AthleteFilters {
  search?: string;
  isActive?: boolean;
  healthConditionIds?: string[];
  page?: number;
  limit?: number;
  fields?: AthleteField[];
  includeHealthConditions?: boolean;
}

export interface UpdateAthleteDto {
  fullName?: string;
  country?: string;
  description?: string;
  healthConditionIds?: string[];
  avatarUrl?: string | null;
  isActive?: boolean;
}