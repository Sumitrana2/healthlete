import { z } from "zod";

export const jsonArray = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return value
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean);
      }
    }

    return value;
  }, z.array(schema));
