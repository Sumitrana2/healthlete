import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function ApiListQuery(options?: { includeIsActive?: boolean; searchDescription?: string }) {
  const includeIsActive = options?.includeIsActive ?? true;

  const decorators = [
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      example: 1,
      description: "Page number",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      example: 20,
      description: "Items per page (max 100)",
    }),
    ApiQuery({
      name: "search",
      required: false,
      type: String,
      example: "health",
      description: options?.searchDescription ?? "Search by name",
    }),
  ];

  if (includeIsActive) {
    decorators.push(
      ApiQuery({
        name: "isActive",
        required: false,
        enum: ["true", "false"],
        description: "Filter by active status",
      })
    );
  }

  return applyDecorators(...decorators);
}
