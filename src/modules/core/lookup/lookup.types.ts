// export type CampaignObjectiveField =
//   | "id"
//   | "name"
//   | "isActive"
//   | "createdAt"
//   | "updatedAt";
// export type ChannelField =
//   | "id"
//   | "name"
//   | "isActive"
//   | "createdAt"
//   | "updatedAt";
export type CompanyField =
  | "id"
  | "name"
  | "website"
  | "logoUrl"
  | "isActive"
  | "country"
  | "description";

// export type HealthConditionField =
//   | "id"
//   | "name"
//   | "isActive"
//   | "createdAt"
//   | "updatedAt";

// export type IndustriesField =
//   | "id"
//   | "name"
//   | "isActive"
//   | "createdAt"
//   | "updatedAt";

// export type LanguagesField =
//   | "id"
//   | "name"
//   | "isActive"
//   | "code"
//   | "createdAt"
//   | "updatedAt";

// export interface LookupFilters {
//   search?: string;
//   isActive?: boolean;
//   page?: number;
//   limit?: number;
//   fields?: string[];
//   includeIndustry?: boolean;
//   includeCompanySize?: boolean;
// }

export interface LookupFilters<T extends string = string> {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  fields?: T[];
  includeIndustry?: boolean;
  includeCompanySize?: boolean;
}

export interface LookupUpdateDto {
  name?: string;
  isActive?: boolean;
}