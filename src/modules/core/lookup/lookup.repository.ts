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
import { ilike, eq, and, sql, desc, asc } from "drizzle-orm";
import type { CompanyField, LookupFilters } from "./lookup.types";
import {
  deleteLookup,
  findLookupById,
  findLookupByName,
  getLookupCount,
  getLookupData,
  updateLookup,
} from "./lookup.repository.utils";
import { makeUniqueSlug } from "../../../utils/slug";
const DEFAULT_COMPANY_SIZE_ID = "0b30cff8-0b53-4676-8fe1-6dbd82c629ad";


export async function getFirstCompanySize() {
  const result = await db
    .select()
    .from(companySizes)
    .orderBy(asc(companySizes.createdAt))
    .limit(1);
  return result[0] ?? null;
}

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
  isActive: companies.isActive,
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

// campaign
export const getCampaignObjectives = (filters: LookupFilters = {}) =>
  getLookupData(campaignObjectives, campaignObjectiveFieldMap, filters);

export const getCampaignObjectivesCount = (filters: LookupFilters = {}) =>
  getLookupCount(campaignObjectives, filters);

export const findCampaignObjectiveByName = (name: string) =>
  findLookupByName(campaignObjectives, campaignObjectives.name, name);

export const createCampaignObjective = (data: { name: string }) =>
  db.insert(campaignObjectives).values(data).returning();

export const findCampaignObjectiveById = (id: string) =>
  findLookupById(campaignObjectives, campaignObjectives.id, id);

export const updateCampaignObjective = (
  id: string,
  data: Partial<{
    name: string;
    isActive: boolean;
  }>
) => updateLookup(campaignObjectives, campaignObjectives.id, id, data);

export const deleteCampaignObjective = (id: string) =>
  deleteLookup(campaignObjectives, campaignObjectives.id, id);

// ─── Health Conditions ────────────────────────────────────────────────────────

export const getHealthConditions = (filters: LookupFilters = {}) =>
  getLookupData(healthConditions, healthConditionFieldMap, filters);

export const getHealthConditionsCount = (filters: LookupFilters = {}) =>
  getLookupCount(healthConditions, filters);

export const findHealthConditionByName = (name: string) =>
  findLookupByName(healthConditions, healthConditions.name, name);

export async function createHealthCondition(data: { name: string }) {
  const [result] = await db.insert(healthConditions).values(data).returning();
  return result;
}

export const findHealthConditionById = (id: string) =>
  findLookupById(healthConditions, healthConditions.id, id);

export const updateHealthCondition = (
  id: string,
  data: Partial<{
    name: string;
    isActive: boolean;
  }>
) => updateLookup(healthConditions, healthConditions.id, id, data);

export async function deleteHealthCondition(id: string) {
  return deleteLookup(healthConditions, healthConditions.id, id);
}

// ─── Preferred Channels ───────────────────────────────────────────────────────

export const getPreferredChannels = (filters: LookupFilters = {}) =>
  getLookupData(preferredChannels, channelFieldMap, filters);

export const getPreferredChannelsCount = (filters: LookupFilters = {}) =>
  getLookupCount(preferredChannels, filters);

export const findPreferredChannelByName = (name: string) =>
  findLookupByName(preferredChannels, preferredChannels.name, name);

export const createPreferredChannel = (data: { name: string }) =>
  db.insert(preferredChannels).values(data).returning();
export const findPreferredChannelById = (id: string) =>
  findLookupById(preferredChannels, preferredChannels.id, id);

export const updatePreferredChannel = (
  id: string,
  data: Partial<{
    name: string;
    isActive: boolean;
  }>
) => updateLookup(preferredChannels, preferredChannels.id, id, data);

export const deletePreferredChannel = (id: string) =>
  deleteLookup(preferredChannels, preferredChannels.id, id);

// ─── Athlete Languages ────────────────────────────────────────────────────────
export const getAthleteLanguages = (filters: LookupFilters = {}) =>
  getLookupData(athleteLanguages, languageFieldMap, filters);

export const getAthleteLanguagesCount = (filters: LookupFilters = {}) =>
  getLookupCount(athleteLanguages, filters);

export async function findLanguageByName(name: string) {
  const [language] = await db
    .select()
    .from(athleteLanguages)
    .where(sql`LOWER(${athleteLanguages.name}) = LOWER(${name})`);
  return language;
}
export async function findLanguageByCode(code: string) {
  const [language] = await db
    .select()
    .from(athleteLanguages)
    .where(sql`LOWER(${athleteLanguages.code}) = LOWER(${code})`);
  return language;
}

export async function createLanguage(data: { name: string; code: string }) {
  const [result] = await db.insert(athleteLanguages).values(data).returning();

  return result;
}

export const findAthleteLanguageById = (id: string) =>
  findLookupById(athleteLanguages, athleteLanguages.id, id);
export async function updateAthleteLanguage(
  id: string,
  data: Partial<{
    name: string;
    code: string;
    isActive: boolean;
  }>
) {
  const [language] = await db
    .update(athleteLanguages)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(athleteLanguages.id, id))
    .returning();

  return language;
}
export const deleteAthleteLanguage = (id: string) =>
  deleteLookup(athleteLanguages, athleteLanguages.id, id);

// ─── Industries ───────────────────────────────────────────────────────────────

export async function findIndustryById(id: string) {
  const [industry] = await db
    .select()
    .from(industries)
    .where(eq(industries.id, id));

  return industry;
}

export const getIndustries = (filters: LookupFilters = {}) =>
  getLookupData(industries, industriesFieldMap, filters);

export const getIndustriesCount = (filters: LookupFilters = {}) =>
  getLookupCount(industries, filters);

export const findIndustryByName = (name: string) =>
  findLookupByName(industries, industries.name, name);

export async function createIndustry(data: { name: string }) {
  const slug = await makeUniqueSlug(data.name, industries, industries.slug);
  const [result] = await db
    .insert(industries)
    .values({
      ...data,
      slug,
    })
    .returning();

  return result;
}
export async function updateIndustry(
  id: string,
  data: Partial<{
    name: string;
    isActive: boolean;
  }>
) {
  let slug: string | undefined;

  if (data.name) {
    slug = await makeUniqueSlug(data.name, industries, industries.slug);
  }

  const [result] = await db
    .update(industries)
    .set({
      ...data,
      ...(slug && { slug }),
      updatedAt: new Date(),
    })
    .where(eq(industries.id, id))
    .returning();

  return result;
}
export const deleteIndustry = (id: string) =>
  deleteLookup(industries, industries.id, id);

// company

export async function getCompanies(filters: LookupFilters = {}) {
  const selectedFields = filters.fields
    ? Object.fromEntries(
        (filters.fields as CompanyField[]).map((f) => [f, companyFieldMap[f]])
      )
    : {
        id: companyFieldMap.id,
        name: companyFieldMap.name,
      };

  const withIndustry = filters.includeIndustry !== false;
  const withCompanySize = filters.includeCompanySize !== false;

  const conditions = [];

  if (filters.search?.trim()) {
    conditions.push(ilike(companies.name, `%${filters.search.trim()}%`));
  }

  if (filters.isActive !== undefined) {
    conditions.push(eq(companies.isActive, filters.isActive));
  }
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
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(companies.createdAt));
  if (filters.page && filters.limit) {
    baseQuery.limit(filters.limit).offset((filters.page - 1) * filters.limit);
  }

  return await baseQuery;
}

export const getCompaniesCount = (filters: LookupFilters = {}) =>
  getLookupCount(companies, filters);

export const findCompanyByName = (name: string) =>
  findLookupByName(companies, companies.name, name);

export const findCompanyById = (id: string) =>
  findLookupById(companies, companies.id, id);

export async function createCompany(data: {
  name: string;
  website: string | null;
  industryId: string;
}) {
  const companySizeId=await getFirstCompanySize()
  const [company] = await db
    .insert(companies)
    .values({
      name: data.name,
      website: data.website,
      industryId: data.industryId,
      companySizeId: companySizeId.id,

      logoUrl: null,
      country: null,
      description: null,
    })
    .returning();

  return company;
}

export async function updateCompany(
  id: string,
  data: Partial<{
    name: string;
    website: string;
    industryId: string;
    isActive: boolean;
  }>
) {
  const [result] = await db
    .update(companies)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(companies.id, id))
    .returning();

  return result;
}

export const deleteCompany = (id: string) =>
  deleteLookup(companies, companies.id, id);
