import { z } from "zod";

export const successResponse = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.literal(true),
    message: z.string(),
    data: dataSchema,
  });

export const errorResponse = z.object({
  success: z.literal(false),
  message: z.string(),
  code: z.string(),
  errors: z.record(z.array(z.string())).optional(),
});

export const paginationQuery = z.object({
  page: z.string().optional().describe("Page number"),
  limit: z.string().optional().describe("Items per page"),
});

export const paginationResponse = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});