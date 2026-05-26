import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';
import { env } from './env';

// Must be called before any .openapi() usage
extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

export function generateSwaggerDocs() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'HealthLete API',
      version: '1.0.0',
      description: 'Athlete health media & decision intelligence platform',
    },
    servers: [
      {
        url: '/api/v1',
        description: env.NODE_ENV === 'production' ? 'Production' : 'Development',
      },
    ],
  });
}