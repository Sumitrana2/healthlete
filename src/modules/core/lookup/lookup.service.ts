import * as repo from "./lookup.repository";
import type { LookupFilters } from "./lookup.types";
import { paginate } from "../../../utils/pagination.util";


// ─── Campaign Objectives ──────────────────────────────────────────────────────
export async function getCampaignObjectives(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getCampaignObjectives,
    repo.getCampaignObjectivesCount
  );
}

// ─── Health Conditions ────────────────────────────────────────────────────────

export async function getHealthConditions(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getHealthConditions,
    repo.getHealthConditionsCount
  );
}

// ─── Preferred Channels ───────────────────────────────────────────────────────

export async function getPreferredChannels(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getPreferredChannels,
    repo.getPreferredChannelsCount
  );
}

// ─── Athlete Languages ────────────────────────────────────────────────────────

export async function getAthleteLanguages(filters: LookupFilters = {}) {
  return paginate(
    filters,
    repo.getAthleteLanguages,
    repo.getAthleteLanguagesCount
  );
}

// ─── Industries ───────────────────────────────────────────────────────────────

export async function getIndustries(filters: LookupFilters = {}) {
  return paginate(filters, repo.getIndustries, repo.getIndustriesCount);
}

// ─── Company ───────────────────────────────────────────────────────────
export async function getCompanies(filters: LookupFilters = {}) {
  return paginate(filters, repo.getCompanies, repo.getCompaniesCount);
}
