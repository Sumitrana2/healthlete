import { z } from "zod";

export const createLanguageSchema = z.object({
  name: z.string().trim().min(2).max(100),
  isActive: z.boolean(),
  code: z
    .string()
    .trim()
    .min(2)
    .max(10)
    .transform((v) => v.toUpperCase()),
});

export const updateLanguageSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    code: z.string().min(1).max(10).optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    const hasName = data.name !== undefined;
    const hasCode = data.code !== undefined;

    if (!hasName && !hasCode && data.isActive === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one field is required",
      });
    }
    if (hasName !== hasCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: hasName ? ["code"] : ["name"],
        message: "Name and code must be provided together",
      });
    }
  });
// export const updateLanguageSchema = z
//   .object({
//     name: z.string().min(1).max(100).optional(),
//     code: z.string().min(1).max(10).optional(),
//     isActive: z.boolean().optional(),
//   })
//   .refine((data) => Object.keys(data).length > 0, {
//     message: "At least one field is required",
//   });

export const languageSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
