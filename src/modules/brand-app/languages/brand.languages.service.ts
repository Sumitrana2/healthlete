import * as languagesRepo from "./brand.languages.repository";

export async function getAthleteLanguages() {
  return await languagesRepo.getAllAthleteLanguages();
}