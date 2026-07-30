import { Injectable } from "@nestjs/common";
import { HealthConditionRepository } from "../repositories/health.condition.repository";

@Injectable()
export class HealthConditionService {
  constructor(private readonly repository: HealthConditionRepository) {}

  async getHealthConditions() {
    return this.repository.getAllHealthConditions();
  }
}
