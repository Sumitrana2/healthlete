export type AthleteField =
  | "id"
  | "firstName"
  | "lastName"
  | "slug"
  | "country"
  | "description"
  | "avatarUrl"
  | "tags"
  | "isActive"
  | "createdAt"
  | "updatedAt";

export interface AthleteFilters {
  search?: string;
  isActive?: boolean;
  healthConditionIds?: string[];
  page?: number;
  limit?: number;
  fields?: AthleteField[];
  includeHealthConditions?: boolean;
}

export interface CreateAthleteDto {
  firstName?: string;
  lastName?: string;
  fullName: string;
  country?: string;
  description?: string;
  tags?: string[];
  healthConditionIds?: string[];
  avatarUrl?: string | null;
}

export interface UpdateAthleteDto {
    firstName?: string;
    lastName?: string;
    fullName?: string;
    country?: string;
    description?: string;
    tags?: string[];
    healthConditionIds?: string[];
    avatarUrl?: string | null;
    isActive?: boolean;
  }