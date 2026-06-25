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