import { db } from "../../../db";
import {
  campaignObjectives,
  healthConditions,
  preferredChannels,
  athleteLanguages,
  industries,
  companies,
  companySizes,
} from "../../../db/schema";
import { ilike, eq, and } from "drizzle-orm";
import type {
  CompanyField,
  LookupFilters,
} from "./lookup.types";
import { getLookupCount, getLookupData } from "./lookup.repository.utils";

const campaignObjectiveFieldMap = {
  id: campaignObjectives.id,
  name: campaignObjectives.name,
  isActive: campaignObjectives.isActive,
  createdAt: campaignObjectives.createdAt,
  updatedAt: campaignObjectives.updatedAt,
};

const channelFieldMap = {
  id: preferredChannels.id,
  name: preferredChannels.name,
  isActive: preferredChannels.isActive,
  createdAt: preferredChannels.createdAt,
  updatedAt: preferredChannels.updatedAt,
};

const companyFieldMap = {
  id: companies.id,
  name: companies.name,
  website: companies.website,
  logoUrl: companies.logoUrl,
  country: companies.country,
  description: companies.description,
};

const healthConditionFieldMap = {
  id: healthConditions.id,
  name: healthConditions.name,
  isActive: healthConditions.isActive,
  createdAt: healthConditions.createdAt,
  updatedAt: healthConditions.updatedAt,
};

const industriesFieldMap = {
  id: industries.id,
  name: industries.name,
  isActive: industries.isActive,
  createdAt: industries.createdAt,
  updatedAt: industries.updatedAt,
};

const languageFieldMap = {
  id: athleteLanguages.id,
  name: athleteLanguages.name,
  code: athleteLanguages.code,
  isActive: athleteLanguages.isActive,
  createdAt: athleteLanguages.createdAt,
  updatedAt: athleteLanguages.updatedAt,
};

export const getCampaignObjectives = (filters: LookupFilters = {}) =>
  getLookupData(campaignObjectives, campaignObjectiveFieldMap, filters);

export const getCampaignObjectivesCount = (filters: LookupFilters = {}) =>
  getLookupCount(campaignObjectives, filters);

// ─── Health Conditions ────────────────────────────────────────────────────────

export const getHealthConditions = (filters: LookupFilters = {}) =>
  getLookupData(healthConditions, healthConditionFieldMap, filters);

export const getHealthConditionsCount = (filters: LookupFilters = {}) =>
  getLookupCount(healthConditions, filters);

// ─── Preferred Channels ───────────────────────────────────────────────────────

export const getPreferredChannels = (filters: LookupFilters = {}) =>
  getLookupData(preferredChannels, channelFieldMap, filters);

export const getPreferredChannelsCount = (filters: LookupFilters = {}) =>
  getLookupCount(preferredChannels, filters);

// ─── Athlete Languages ────────────────────────────────────────────────────────
export const getAthleteLanguages = (filters: LookupFilters = {}) =>
  getLookupData(athleteLanguages, languageFieldMap, filters);

export const getAthleteLanguagesCount = (filters: LookupFilters = {}) =>
  getLookupCount(athleteLanguages, filters);

// ─── Industries ───────────────────────────────────────────────────────────────
export const getIndustries = (filters: LookupFilters = {}) =>
  getLookupData(industries, industriesFieldMap, filters);

export const getIndustriesCount = (filters: LookupFilters = {}) =>
  getLookupCount(industries, filters);

export async function getCompanies(filters: LookupFilters = {}) {
  const selectedFields = filters.fields
    ? Object.fromEntries(
        (filters.fields as CompanyField[]).map((f) => [
          f,
          companyFieldMap[f],
        ])
      )
    : {
        id: companyFieldMap.id,
        name: companyFieldMap.name,
      };

  const withIndustry = filters.includeIndustry !== false;
  const withCompanySize = filters.includeCompanySize !== false;

  const conditions = filters.search
    ? [ilike(companies.name, `%${filters.search}%`)]
    : [];

  const baseQuery = db
    .select({
      ...selectedFields,
      ...(withIndustry && {
        industry: {
          id: industries.id,
          name: industries.name,
          slug: industries.slug,
        },
      }),
      ...(withCompanySize && {
        companySize: {
          id: companySizes.id,
          label: companySizes.label,
        },
      }),
    })
    .from(companies)
    .leftJoin(industries, eq(companies.industryId, industries.id))
    .leftJoin(companySizes, eq(companies.companySizeId, companySizes.id))
    .where(conditions.length ? and(...conditions) : undefined);

  if (filters.page && filters.limit) {
    baseQuery.limit(filters.limit).offset((filters.page - 1) * filters.limit);
  }

  return await baseQuery;
}

export const getCompaniesCount = (filters: LookupFilters = {}) =>
  getLookupCount(companies, filters);
