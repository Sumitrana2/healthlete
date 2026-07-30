import { Injectable } from "@nestjs/common";
import { CompanyLookupRepository } from "../repositories/company-lookup.repository";
import { ListQuery } from "../../../../common/dto/pagination.dto";

@Injectable()
export class AdminCompanyService {
  constructor(private readonly repository: CompanyLookupRepository) {}

  list(query: ListQuery) {
    return this.repository.findMany(query);
  }

  getById(id: string) {
    return this.repository.findById(id);
  }

  create(data: {
    name: string;
    website?: string;
    logoUrl?: string;
    description?: string;
    country?: string;
    industryId?: string;
    companySizeId?: string;
  }) {
    return this.repository.create(data);
  }

  update(
    id: string,
    data: {
      name?: string;
      website?: string | null;
      logoUrl?: string | null;
      description?: string | null;
      country?: string | null;
      industryId?: string | null;
      companySizeId?: string | null;
    }
  ) {
    return this.repository.update(id, data);
  }

  remove(id: string) {
    return this.repository.remove(id);
  }
}
