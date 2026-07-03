import * as industriesRepo from "./brand.industries.repository";

export async function getIndustries() {
  return await industriesRepo.getAllIndustries();
}