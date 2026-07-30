import { z } from "zod";
import { createManualAthleteFieldSchema } from "../dto/admin-athlete.dto";

function parseStringArrayField(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

export function parseCreateAthleteFields(body: Record<string, unknown>) {
  return createManualAthleteFieldSchema.parse({
    first_name: body.first_name ?? body.firstName,
    last_name: body.last_name ?? body.lastName,
    country: body.country,
    description: body.description ?? "",
    tags: parseStringArrayField(body.tags),
    health_conditions: parseStringArrayField(
      body.health_conditions ?? body.healthConditionIds,
    ),
    image: typeof body.image === "string" ? body.image : undefined,
    avatar_url: typeof body.avatar_url === "string" ? body.avatar_url : undefined,
  });
}
