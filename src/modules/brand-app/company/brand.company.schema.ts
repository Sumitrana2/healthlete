import { z } from "zod";

export const searchCompanySchema = z.object({
  query: z.string().min(1, "Search query is required").max(100),
});

// export const getCompanyByIdSchema = z.object({
//   id: z.string().uuid("Invalid company ID"),
// });