import { z } from "zod";

export const taxonomyQuerySchema = z.object({
  platform: z.enum(["ig", "yt"]),
  kind: z.enum(["category", "interest"]),
});


export type TaxonomyQuery = z.infer<typeof taxonomyQuerySchema>;
export type Platform = TaxonomyQuery["platform"];
export type Kind = TaxonomyQuery["kind"];