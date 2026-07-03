import * as healthConditionsRepo from "./admin.health-condition.repository";

export async function getHealthConditions() {
  return await healthConditionsRepo.getAllHealthConditions();
}