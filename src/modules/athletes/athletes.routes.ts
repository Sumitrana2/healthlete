// ─── athletes.routes.ts ───────────────────────────────────────────────────────
// Thin HTTP layer. Its only job:
//   1. Validate the request (using Zod schemas)
//   2. Call the service
//   3. Send the response
// Zero business logic, zero DB calls here.

import { Router, Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { listAthletesSchema, athleteSlugSchema, createAthleteSchema, updateAthleteSchema } from './athletes.schema';
import * as athleteService from './athletes.service';

const router = Router();

// ── Validation middleware factory ─────────────────────────────────────────────
// Parses the given Zod schema against req.query / req.body / req.params
// and attaches the clean result back onto the request object.

function validate(schema: ZodTypeAny, source: 'query' | 'body' | 'params') {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: result.error.flatten().fieldErrors,
        },
      });
    }
    // Attach parsed (cleaned, coerced) data back so the route handler uses it
    (req as any)[`parsed_${source}`] = result.data;
    next();
  };
}

// ── GET /athletes ─────────────────────────────────────────────────────────────

router.get(
  '/',
  validate(listAthletesSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = (req as any).parsed_query;
      const result = await athleteService.listAthletes(filters);
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

// ── GET /athletes/:slug ───────────────────────────────────────────────────────

router.get(
  '/:slug',
  validate(athleteSlugSchema, 'params'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = (req as any).parsed_params;
      const athlete = await athleteService.getAthleteBySlug(slug);
      res.json({ success: true, data: athlete });
    } catch (err) {
      next(err);
    }
  }
);

// ── POST /athletes (admin) ────────────────────────────────────────────────────

router.post(
  '/',
  validate(createAthleteSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = (req as any).parsed_body;
      const athlete = await athleteService.createAthlete(input);
      res.status(201).json({ success: true, data: athlete });
    } catch (err) {
      next(err);
    }
  }
);

// ── PATCH /athletes/:slug (admin) ─────────────────────────────────────────────

router.patch(
  '/:slug',
  validate(athleteSlugSchema, 'params'),
  validate(updateAthleteSchema, 'body'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = (req as any).parsed_params;
      const input = (req as any).parsed_body;
      const athlete = await athleteService.updateAthlete(slug, input);
      res.json({ success: true, data: athlete });
    } catch (err) {
      next(err);
    }
  }
);

export default router;