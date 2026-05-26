import { registry } from '../../config/swagger';
import { z } from 'zod';

registry.registerPath({
  method: 'get',
  path: '/athletes',
  summary: 'List all athletes',
  tags: ['Athletes'],
  request: {
    query: z.object({
      sport:    z.string().optional(),
      country:  z.string().optional(),
      limit:    z.coerce.number().optional(),
      offset:   z.coerce.number().optional(),
    }),
  },
  responses: {
    200: {
      description: 'Paginated list of athletes',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.array(z.object({
              id:          z.string(),
              slug:        z.string(),
              displayName: z.string().nullable(),
              sport:       z.string().nullable(),
              country:     z.string().nullable(),
            })),
            meta: z.object({
              total:   z.number(),
              limit:   z.number(),
              offset:  z.number(),
              hasMore: z.boolean(),
            }),
          }),
        },
      },
    },
  },
});

registry.registerPath({
  method: 'get',
  path: '/athletes/{slug}',
  summary: 'Get athlete profile by slug',
  tags: ['Athletes'],
  request: {
    params: z.object({ slug: z.string() }),
  },
  responses: {
    200: {
      description: 'Full athlete profile with scores',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id:                   z.string(),
              slug:                 z.string(),
              firstName:            z.string(),
              lastName:             z.string(),
              sport:                z.string().nullable(),
              scores: z.object({
                matchScore:            z.string().nullable(),
                pharmaComplianceScore: z.string().nullable(),
                reputationRiskScore:   z.string().nullable(),
                audienceTrustScore:    z.string().nullable(),
              }).nullable(),
            }),
          }),
        },
      },
    },
    404: { description: 'Athlete not found' },
  },
});