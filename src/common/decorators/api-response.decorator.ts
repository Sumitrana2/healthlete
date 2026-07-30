import { applyDecorators, Type } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from "@nestjs/swagger";

export class ApiSuccessEnvelopeDto {
  success!: boolean;
  message!: string;
  data!: unknown;
}

export class ApiErrorEnvelopeDto {
  success!: boolean;
  message!: string;
  code!: string;
  errors!: unknown;
}

export function ApiSuccessResponse(
  description: string,
  dataSchema?: Type<unknown>
) {
  const decorators = [
    ApiOkResponse({
      description,
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: dataSchema
            ? { $ref: getSchemaPath(dataSchema) }
            : { type: "object" },
        },
      },
    }),
    ApiBadRequestResponse({ description: "Validation error" }),
    ApiUnauthorizedResponse({ description: "Unauthorized" }),
    ApiForbiddenResponse({ description: "Forbidden" }),
    ApiConflictResponse({ description: "Conflict" }),
    ApiInternalServerErrorResponse({ description: "Internal server error" }),
  ];

  return applyDecorators(...decorators);
}
