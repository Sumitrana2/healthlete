export interface BrandFilters {
  search?: string;
  isActive?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected"; 
  companyId?: string;
  industryId?: string;
  page?: number;
  limit?: number;
}

export interface UpdateBrandStatusDto {
  isActive: boolean;
}