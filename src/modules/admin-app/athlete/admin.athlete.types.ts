export interface CreateAthleteDto {
  fullName: string;
  country?: string;
  description?: string;
  tags?: string[];
  healthConditionIds?: string[];
}

export interface AthleteResponse {
  id: string;
  fullName: string;
  slug: string;
  country: string | null;
  description: string | null;
  avatarUrl: string | null;
  tags: string[];
  healthConditions: {
    id: string;
    name: string;
  }[];
  createdAt: Date;
}