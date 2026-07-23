import { AppError } from "../../../middleware/errorHandler";
import * as repository from "./brand.repository";
import type { BrandFilters } from "./brand.types";

export async function getBrands(filters: BrandFilters) {
  return repository.findBrands(filters);
}

export async function getBrandById(id: string) {
  const brand = await repository.findBrandById(id);
  if (!brand) throw new AppError(404, "Brand not found");
  return brand;
}

export async function updateBrandStatus(id: string, isActive: boolean) {
  const existing = await repository.findBrandById(id);
  if (!existing) throw new AppError(404, "Brand not found");

  return repository.updateBrandStatus(id, isActive);
}

export async function deleteBrand(id: string) {
  const existing = await repository.findBrandById(id);
  if (!existing) throw new AppError(404, "Brand not found");

  await repository.deleteBrandById(id);
}