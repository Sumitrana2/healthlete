// ─── athletes.schema.ts ───────────────────────────────────────────────────────
// Zod schemas that validate incoming HTTP request data.
// These sit at the boundary — req.query / req.body / req.params come in dirty,
// and these schemas produce clean, typed values for the service layer.

import { z } from 'zod';

// ── Query params for GET /athletes ────────────────────────────────────────────
export const listAthletesSchema = z.object({
  sport:          z.string().trim().min(1).optional(),
  country:        z.string().trim().min(1).optional(),
  healthCategory: z.string().trim().min(1).optional(),
  isFeatured:     z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  limit:          z.coerce.number().int().min(1).max(100).default(20),
  offset:         z.coerce.number().int().min(0).default(0),
});

export type ListAthletesQuery = z.infer<typeof listAthletesSchema>;

// ── URL param for GET /athletes/:slug ─────────────────────────────────────────
export const athleteSlugSchema = z.object({
  slug: z.string().trim().min(1).max(200),
});

// ── Body for POST /athletes (admin) ───────────────────────────────────────────
export const createAthleteSchema = z.object({
  firstName:        z.string().trim().min(1).max(100),
  lastName:         z.string().trim().min(1).max(100),
  displayName:      z.string().trim().max(200).optional(),
  sport:            z.string().trim().max(100).optional(),
  league:           z.string().trim().max(100).optional(),
  country:          z.string().trim().max(100).optional(),
  bio:              z.string().trim().max(2000).optional(),
  healthCategories: z.array(z.string().trim()).max(20).default([]),
  instagramHandle:  z.string().trim().max(150).optional(),
  twitterHandle:    z.string().trim().max(150).optional(),
  tiktokHandle:     z.string().trim().max(150).optional(),
  youtubeHandle:    z.string().trim().max(150).optional(),
});

export type CreateAthleteBody = z.infer<typeof createAthleteSchema>;

// ── Body for PATCH /athletes/:slug (admin) ────────────────────────────────────
export const updateAthleteSchema = createAthleteSchema.partial();

export type UpdateAthleteBody = z.infer<typeof updateAthleteSchema>;