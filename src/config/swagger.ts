import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { env } from "./env";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();
// registry.registerComponent("securitySchemes", "bearerAuth", {
//   type: "http",
//   scheme: "bearer",
//   bearerFormat: "JWT",
// });

export function generateSwaggerDocs() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  const document = generator.generateDocument({
    openapi: "3.0.0",
    info: {
      title: "HealthLete API",
      version: "1.0.0",
      description: "Athlete health media & decision intelligence platform",
    },
    servers: [
      {
        url: "/api/v1",
        description:
          env.NODE_ENV === "production" ? "Production" : "Development",
      },
    ],
  });
  // document.security = [{ bearerAuth: [] }];
  // if (!document.components) document.components = {};
  // document.components.securitySchemes = {
  //   bearerAuth: {
  //     type: "http",
  //     scheme: "bearer",
  //     bearerFormat: "JWT",
  //   },
  // };
  return document;
}
