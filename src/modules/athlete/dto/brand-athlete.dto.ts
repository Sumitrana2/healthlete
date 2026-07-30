import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { listQuerySchema } from "../../../common/dto/pagination.dto";

extendZodWithOpenApi(z);

function parseCommaSeparatedIds(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value.map(String).map((id) => id.trim()).filter(Boolean);
  }

  return String(value)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export const brandAthletesListQuerySchema = listQuerySchema
  .omit({ isActive: true })
  .extend({
    healthConditionIds: z
      .preprocess(parseCommaSeparatedIds, z.array(z.string().uuid()).optional())
      .openapi({ example: "uuid1,uuid2" }),
    includeHealthConditions: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? true : value === "true")),
    includePlatformLinks: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? false : value === "true")),
  })
  .openapi("BrandAthletesListQuery");

export const brandAthleteDetailQuerySchema = z
  .object({
    includeHealthConditions: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? true : value === "true")),
    includePlatformLinks: z
      .enum(["true", "false"])
      .optional()
      .transform((value) => (value === undefined ? true : value === "true")),
  })
  .openapi("BrandAthleteDetailQuery");

export type BrandAthletesListQuery = z.infer<typeof brandAthletesListQuerySchema>;
export type BrandAthleteDetailQuery = z.infer<typeof brandAthleteDetailQuerySchema>;
