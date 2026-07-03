import * as healthConditionsRepo from "./brand.health-condition.repository";

export async function getHealthConditions() {
  return await healthConditionsRepo.getAllHealthConditions();
}