import { updateManualAthleteFieldSchema } from "../dto/admin-athlete.dto";

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

export function parseUpdateAthleteFields(body: Record<string, unknown>) {
  const parsed: Record<string, unknown> = {};

  if (body.first_name !== undefined || body.firstName !== undefined) {
    parsed.first_name = body.first_name ?? body.firstName;
  }
  if (body.last_name !== undefined || body.lastName !== undefined) {
    parsed.last_name = body.last_name ?? body.lastName;
  }
  if (body.country !== undefined) {
    parsed.country = body.country;
  }
  if (body.description !== undefined) {
    parsed.description = body.description ?? "";
  }
  if (body.tags !== undefined) {
    parsed.tags = parseStringArrayField(body.tags);
  }
  if (body.health_conditions !== undefined || body.healthConditionIds !== undefined) {
    parsed.health_conditions = parseStringArrayField(
      body.health_conditions ?? body.healthConditionIds,
    );
  }
  if (typeof body.image === "string") {
    parsed.image = body.image;
  }
  if (typeof body.avatar_url === "string") {
    parsed.avatar_url = body.avatar_url;
  }

  return updateManualAthleteFieldSchema.parse(parsed);
}
