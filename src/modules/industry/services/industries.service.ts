import { Injectable } from "@nestjs/common";
import { IndustriesRepository } from "../repositories/industries.repository";

@Injectable()
export class IndustriesService {
  constructor(private readonly repository: IndustriesRepository) {}

  async getIndustries() {
    return this.repository.getAllIndustries();
  }
}
