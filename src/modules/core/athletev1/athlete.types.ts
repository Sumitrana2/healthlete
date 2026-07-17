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
  includePlatformLinks?: boolean;   
  includeProviders?: boolean;
}

export interface UpdateAthleteDto {
  description?: string;
  healthConditionIds?: string[];
  isActive?: boolean;
}

