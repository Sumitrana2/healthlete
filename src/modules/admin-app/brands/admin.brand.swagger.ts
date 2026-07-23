import { registry } from "../../../config/swagger";
import { z } from "zod";
import { BrandSchema, BrandDetailSchema, updateBrandStatusBodySchema } from "./admin.brand.schema";
import {
  errorResponse,
  paginationResponse,
  successResponse,
  paginationQuery,
} from "../../../utils/swaggerSchemas";

const BrandListSchema = paginationResponse.extend({
  items: z.array(BrandSchema),
});

registry.registerPath({
  method: "get",
  path: "/admin/brands",
  tags: ["Admin Brands"],
  summary: "List brands",
  request: {
    query: z.object({
      search: z.string().optional().describe("Search by name or email"),
      isActive: z.enum(["true", "false"]).optional(),
      approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      companyId: z.string().uuid().optional(),
      industryId: z.string().uuid().optional(),
      ...paginationQuery.shape,
    }),
  },
  responses: {
    200: {
      description: "Brands fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(BrandListSchema),
        },
      },
    },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

registry.registerPath({
  method: "get",
  path: "/admin/brands/{id}",
  tags: ["Admin Brands"],
  summary: "Get brand detail",
  request: {
    params: z.object({ id: z.string().uuid().describe("Brand ID") }),
  },
  responses: {
    200: {
      description: "Brand fetched successfully",
      content: {
        "application/json": {
          schema: successResponse(BrandDetailSchema),
        },
      },
    },
    404: { description: "Brand not found" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

registry.registerPath({
  method: "patch",
  path: "/admin/brands/{id}/status",
  tags: ["Admin Brands"],
  summary: "Enable or disable a brand",
  request: {
    params: z.object({ id: z.string().uuid().describe("Brand ID") }),
    body: {
      required: true,
      content: {
        "application/json": { schema: updateBrandStatusBodySchema },
      },
    },
  },
  responses: {
    200: {
      description: "Brand status updated successfully",
      content: {
        "application/json": {
          schema: successResponse(BrandSchema),
        },
      },
    },
    404: { description: "Brand not found" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});

registry.registerPath({
  method: "delete",
  path: "/admin/brands/{id}",
  tags: ["Admin Brands"],
  summary: "Delete brand",
  request: {
    params: z.object({ id: z.string().uuid().describe("Brand ID") }),
  },
  responses: {
    200: {
      description: "Brand deleted successfully",
      content: {
        "application/json": {
          schema: successResponse(z.null()),
        },
      },
    },
    404: { description: "Brand not found" },
    500: {
      description: "Internal server error",
      content: { "application/json": { schema: errorResponse } },
    },
  },
});