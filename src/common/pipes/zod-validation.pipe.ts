import { PipeTransform } from "@nestjs/common";
import { ZodTypeAny } from "zod";
import { AppError } from "../exceptions/app.error";

export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodTypeAny) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstField = Object.keys(fieldErrors)[0];
      const firstMessage = firstField
        ? `${firstField}: ${
            fieldErrors[firstField]?.[0] ?? "Validation failed"
          }`
        : "Validation failed";

      throw new AppError(400, firstMessage, "VALIDATION_ERROR", fieldErrors);
    }

    return result.data;
  }
}
