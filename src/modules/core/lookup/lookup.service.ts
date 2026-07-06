import * as repo from "./lookup.repository";
import type { LookupFilters } from "./lookup.types";
import { paginate } from "../../../utils/pagination.util";
import { createLookupItem, updateLookupItem } from "./lookup.repository.utils";
import { AppError } from "../../../middleware/errorHandler";

// ─── Campaign Objectives ──────────────────────────────────────────────────────
export async function getCampaignObjectives(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getCampaignObjectives,
    repo.getCampaignObjectivesCount
  );
}

export const createCampaignObjective = (data: { name: string }) =>
  createLookupItem(
    data.name,
    repo.findCampaignObjectiveByName,
    repo.createCampaignObjective,
    "Campaign Objective"
  );

// ─── Health Conditions ────────────────────────────────────────────────────────

export async function getHealthConditions(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getHealthConditions,
    repo.getHealthConditionsCount
  );
}

export const createHealthCondition = (data: { name: string }) =>
  createLookupItem(
    data.name,
    repo.findHealthConditionByName,
    repo.createHealthCondition,
    "Health Condition"
  );

export const updateHealthCondition = (id: string, data: { name: string }) =>
  updateLookupItem(
    id,
    data.name,
    repo.findHealthConditionById,
    repo.findHealthConditionByName,
    repo.updateHealthCondition,
    "Health Condition"
  );
// ─── Preferred Channels ───────────────────────────────────────────────────────

export async function getPreferredChannels(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getPreferredChannels,
    repo.getPreferredChannelsCount
  );
}

export const createPreferredChannel = (data: { name: string }) =>
  createLookupItem(
    data.name,
    repo.findPreferredChannelByName,
    repo.createPreferredChannel,
    "Preferred Channel"
  );
  export const updatePreferredChannel = (
    id: string,
    data: { name: string }
  ) =>
    updateLookupItem(
      id,
      data.name,
      repo.findPreferredChannelById,
      repo.findPreferredChannelByName,
      repo.updatePreferredChannel,
      "Preferred Channel"
    );
// ─── Athlete Languages ────────────────────────────────────────────────────────

export async function getAthleteLanguages(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getAthleteLanguages,
    repo.getAthleteLanguagesCount
  );
}
export async function createLanguage(data: { name: string; code: string }) {
  const payload = {
    name: data.name.trim(),
    code: data.code.trim().toUpperCase(),
  };
  const nameExists = await repo.findLanguageByName(payload.name);
  if (nameExists) {
    throw new AppError(409, "Language name already exists", "ALREADY_EXIST");
  }
  const codeExists = await repo.findLanguageByCode(payload.code);
  if (codeExists) {
    throw new AppError(409, "Language code already exists", "ALREADY_EXIST");
  }
  return repo.createLanguage(payload);
}
export async function updateAthleteLanguage(
  id: string,
  data: {
    name: string;
    code: string;
  }
) {
  const language = await repo.findAthleteLanguageById(id);

  if (!language) {
    throw new AppError(404, "Language not found", "NOT_FOUND");
  }

  const name = data.name.trim();
  const code = data.code.trim().toUpperCase();

  const duplicateName = await repo.findLanguageByName(name);

  if (duplicateName && duplicateName.id !== id) {
    throw new AppError(409, "Language already exists", "ALREADY_EXIST");
  }

  const duplicateCode = await repo.findLanguageByCode(code);

  if (duplicateCode && duplicateCode.id !== id) {
    throw new AppError(409, "Language code already exists", "ALREADY_EXIST");
  }

  return repo.updateAthleteLanguage(id, {
    name,
    code,
  });
}
// ─── Industries ───────────────────────────────────────────────────────────────

export async function getIndustries(filters: LookupFilters = {}) {
  return paginate(filters, repo.getIndustries, repo.getIndustriesCount);
}

export const createIndustry = (data: { name: string }) =>
  createLookupItem(
    data.name,
    repo.findIndustryByName,
    repo.createIndustry,
    "Industry"
  );

export const updateIndustry = (id: string, data: { name: string }) =>
  updateLookupItem(
    id,
    data.name,
    repo.findIndustryById,
    repo.findIndustryByName,
    repo.updateIndustry,
    "Industry"
  );

// ─── Company ───────────────────────────────────────────────────────────
export async function getCompanies(filters: LookupFilters = {}) {
  return paginate(filters, repo.getCompanies, repo.getCompaniesCount);
}
export async function createCompany(data: {
  name: string;
  website?: string;
  industryId: string;
}) {
  const name = data.name.trim();

  const existingCompany = await repo.findCompanyByName(name);

  if (existingCompany) {
    throw new AppError(409, "Company already exists", "ALREADY_EXIST");
  }

  const industry = await repo.findIndustryById(data.industryId);

  if (!industry) {
    throw new AppError(404, "Industry not found", "NOT_FOUND");
  }

  return repo.createCompany({
    name,
    website: data.website?.trim() ?? null,
    industryId: data.industryId,
  });
}
