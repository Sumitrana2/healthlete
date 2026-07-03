import * as languagesRepo from "./admin.languages.repository";

export async function getAthleteLanguages() {
  return await languagesRepo.getAllAthleteLanguages();
}