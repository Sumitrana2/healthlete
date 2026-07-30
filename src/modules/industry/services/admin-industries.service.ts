import { Injectable } from "@nestjs/common";
import { IndustriesRepository } from "../repositories/industries.repository";
import { ListQuery } from "../../../common/dto/pagination.dto";

@Injectable()
export class AdminIndustriesService {
  constructor(private readonly repository: IndustriesRepository) {}

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
