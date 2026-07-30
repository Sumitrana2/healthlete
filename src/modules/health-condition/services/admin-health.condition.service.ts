import { Injectable } from "@nestjs/common";
import { HealthConditionRepository } from "../repositories/health.condition.repository";
import { ListQuery } from "../../../common/dto/pagination.dto";

@Injectable()
export class AdminHealthConditionService {
  constructor(private readonly repository: HealthConditionRepository) {}

  list(query: ListQuery) {
    return this.repository.findMany(query);
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  create(data: { name: string; isActive?: boolean }) {
    return this.repository.create(data);
  }

  update(id: string, data: { name?: string; isActive?: boolean }) {
    return this.repository.update(id, data);
  }

  remove(id: string) {
    return this.repository.deleteById(id);
  }
}
