import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { listQuerySchema } from "../../../common/dto/pagination.dto";

extendZodWithOpenApi(z);

export const adminBrandsListQuerySchema = listQuerySchema
  .extend({
    approvalStatus: z
      .enum(["pending", "approved", "rejected"])
      .optional()
      .openapi({ example: "pending" }),
    companyId: z.string().uuid().optional(),
    industryId: z.string().uuid().optional(),
  })
  .openapi("AdminBrandsListQuery");

export type AdminBrandsListQuery = z.infer<typeof adminBrandsListQuerySchema>;

export const updateBrandStatusSchema = z
  .object({
    isActive: z.boolean().openapi({ example: true }),
  })
  .openapi("UpdateBrandStatusBody");

export type UpdateBrandStatusInput = z.infer<typeof updateBrandStatusSchema>;
