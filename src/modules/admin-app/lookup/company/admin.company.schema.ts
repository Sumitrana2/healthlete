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
  isActive: z.boolean(),
  // logoUrl: z.string().nullable(),
  // country: z.string().nullable(),
  // description: z.string().nullable(),
  industry: industrySchema,
  // companySize: companySizeSchema,
});

export const updateCompanySchema = z
  .object({
    name: z.string().trim().min(2).max(150).optional(),
    website: z.string().url().optional(),
    industryId: z.string().uuid().optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasName = data.name !== undefined;
    const hasWebsite = data.website !== undefined;
    const hasIndustry = data.industryId !== undefined;

    const hasCompanyFields = hasName || hasWebsite || hasIndustry;

    if (!hasCompanyFields && data.isActive === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
      });
      return;
    }

    if (hasCompanyFields && (!hasName || !hasWebsite || !hasIndustry)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "name, website and industryId must be provided together",
      });
    }
  });
