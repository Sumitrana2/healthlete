import { Injectable } from "@nestjs/common";
import { AppError } from "../../../common/exceptions/app.error";
import { AdminBrandRepository } from "../repositories/admin-brand.repository";
import type {
  AdminBrandsListQuery,
  UpdateBrandStatusInput,
} from "../dto/admin-brand.dto";

@Injectable()
export class AdminBrandService {
  constructor(private readonly adminBrandRepository: AdminBrandRepository) {}

  list(query: AdminBrandsListQuery) {
    return this.adminBrandRepository.findMany(query);
  }

  async getById(id: string) {
    const brand = await this.adminBrandRepository.findById(id);
    if (!brand) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }
    return brand;
  }

  async updateStatus(id: string, input: UpdateBrandStatusInput) {
    const existing = await this.adminBrandRepository.findById(id);
    if (!existing) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    const result = await this.adminBrandRepository.updateStatus(
      id,
      input.isActive,
    );
    if (!result) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }
    return result;
  }

  async remove(id: string) {
    const existing = await this.adminBrandRepository.findById(id);
    if (!existing) {
      throw new AppError(404, "Brand not found", "NOT_FOUND");
    }

    await this.adminBrandRepository.deleteById(id);
  }
}
