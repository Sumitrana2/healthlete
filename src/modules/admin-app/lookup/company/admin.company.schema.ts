import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(150),
  website: z.string().url().optional(),
  industryId: z.string().uuid(),
});

const industrySchema = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    slug: z.string(),
  })
  .nullable();



// const companySizeSchema = z.object({
//   id: z.string().uuid(),
//   label: z.string(),
// }).nullable();

export const companySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  website: z.string().nullable(),
  // logoUrl: z.string().nullable(),
  // country: z.string().nullable(),
  // description: z.string().nullable(),
  industry: industrySchema,
  // companySize: companySizeSchema,
});

export const updateCompanySchema = createCompanySchema