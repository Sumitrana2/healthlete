import { z } from "zod";

/** Accepts frontend `search` and legacy `query` query params. */
export const searchCompanySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    query: z.string().trim().min(1).max(100).optional(),
  })
  .refine((data) => Boolean(data.search ?? data.query), {
    message: "Search query is required",
    path: ["search"],
  })
  .transform((data) => ({
    search: (data.search ?? data.query) as string,
  }));