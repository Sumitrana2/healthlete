import { Injectable } from "@nestjs/common";
import { CompanyRepository } from "../repositories/company.repository";

@Injectable()
export class CompanyService {
  constructor(private readonly repository: CompanyRepository) {}

  async searchCompanies(query: string) {
    return this.repository.searchCompaniesByName(query.trim());
  }
}
