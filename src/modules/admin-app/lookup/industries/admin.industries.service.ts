import * as industriesRepo from "./admin.industries.repository";

export async function getIndustries() {
  return await industriesRepo.getAllIndustries();
}