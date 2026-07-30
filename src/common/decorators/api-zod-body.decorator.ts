import { applyDecorators } from "@nestjs/common";
import { ApiBody } from "@nestjs/swagger";
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
  extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

function zodToOpenApiBody(schema: z.ZodTypeAny, name: string) {
  const registry = new OpenAPIRegistry();
  registry.register(name, schema);
  const generator = new OpenApiGeneratorV3(registry.definitions);
  const components = generator.generateComponents();
  return components.components?.schemas?.[name] ?? { type: "object" };
}

export function ApiZodBody(schema: z.ZodTypeAny, name: string, description?: string) {
  return applyDecorators(
    ApiBody({
      description,
      schema: zodToOpenApiBody(schema, name) as object,
    })
  );
}
