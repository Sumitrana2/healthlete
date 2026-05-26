// ─── athletes.service.ts ──────────────────────────────────────────────────────
// All database queries and business logic for the athletes domain.
// The route file calls these functions — it never touches the DB directly.
// This makes the logic easy to test without spinning up an HTTP server.

import { db } from '../../db';
import { athletes, athleteScores } from '../../db/schema';
import { eq, and, ilike, sql } from 'drizzle-orm';
import { AppError } from '../../middleware/errorHandler';
import type {
  AthleteListItem,
  AthleteProfile,
  AthleteFilters,
  CreateAthleteInput,
  UpdateAthleteInput,
  PaginatedResult,
} from './athletes.types';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Turns "Lebron James" into "lebron-james" for use as a URL slug
function toSlug(firstName: string, lastName: string): string {
  return `${firstName}-${lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── List athletes ─────────────────────────────────────────────────────────────

export async function listAthletes(
  filters: AthleteFilters
): Promise<PaginatedResult<AthleteListItem>> {
  const { sport, country, healthCategory, isFeatured, limit, offset } = filters;

  // Build WHERE conditions dynamically
  const conditions = [eq(athletes.status, 'active' as const)];

  if (sport)     conditions.push(ilike(athletes.sport, `%${sport}%`));
  if (country)   conditions.push(eq(athletes.country, country));
  if (isFeatured !== undefined) conditions.push(eq(athletes.isFeatured, isFeatured));

  // healthCategory lives inside a jsonb array — use Postgres @> operator
  if (healthCategory) {
    conditions.push(
      sql`${athletes.healthCategories} @> ${JSON.stringify([healthCategory])}::jsonb`
    );
  }

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  // Run data query and count query in parallel
  const [rows, [{ count }]] = await Promise.all([
    db
      .select({
        id:               athletes.id,
        slug:             athletes.slug,
        displayName:      athletes.displayName,
        firstName:        athletes.firstName,
        lastName:         athletes.lastName,
        sport:            athletes.sport,
        country:          athletes.country,
        healthCategories: athletes.healthCategories,
        profileImageUrl:  athletes.profileImageUrl,
        isVerified:       athletes.isVerified,
        isFeatured:       athletes.isFeatured,
      })
      .from(athletes)
      .where(where)
      .limit(limit)
      .offset(offset),

    db
      .select({ count: sql<number>`count(*)::int` })
      .from(athletes)
      .where(where),
  ]);

  return {
    data: rows as AthleteListItem[],
    meta: {
      total: count,
      limit,
      offset,
      hasMore: offset + rows.length < count,
    },
  };
}

// ── Get single athlete profile ────────────────────────────────────────────────

export async function getAthleteBySlug(slug: string): Promise<AthleteProfile> {
  // Fetch athlete + latest scores in parallel
  const [athleteRows, scoreRows] = await Promise.all([
    db.select().from(athletes).where(eq(athletes.slug, slug)).limit(1),
    db
      .select()
      .from(athleteScores)
      // Sub-select: join on slug → id without a second round-trip
      .where(
        eq(
          athleteScores.athleteId,
          sql`(SELECT id FROM athletes WHERE slug = ${slug} LIMIT 1)`
        )
      )
      .orderBy(sql`${athleteScores.computedAt} DESC`)
      .limit(1),
  ]);

  const athlete = athleteRows[0];
  if (!athlete) throw new AppError(404, 'Athlete not found', 'ATHLETE_NOT_FOUND');

  const latestScore = scoreRows[0] ?? null;

  return {
    ...athlete,
    healthCategories: (athlete.healthCategories as string[]) ?? [],
    scores: latestScore
      ? {
          matchScore:           latestScore.matchScore,
          reputationRiskScore:  latestScore.reputationRiskScore,
          pharmaComplianceScore: latestScore.pharmaComplianceScore,
          audienceTrustScore:   latestScore.audienceTrustScore,
          resonanceScore:       latestScore.resonanceScore,
          credibilityScore:     latestScore.credibilityScore,
          computedAt:           latestScore.computedAt,
        }
      : null,
  } as AthleteProfile;
}

// ── Create athlete (admin) ────────────────────────────────────────────────────

export async function createAthlete(input: CreateAthleteInput): Promise<AthleteProfile> {
  const slug = toSlug(input.firstName, input.lastName);

  // Check slug uniqueness
  const [existing] = await db
    .select({ id: athletes.id })
    .from(athletes)
    .where(eq(athletes.slug, slug));

  if (existing) {
    throw new AppError(409, `Athlete with slug "${slug}" already exists`, 'SLUG_CONFLICT');
  }

  const [created] = await db
    .insert(athletes)
    .values({
      ...input,
      slug,
      healthCategories: input.healthCategories ?? [],
    })
    .returning();

  return { ...created, healthCategories: created.healthCategories as string[], scores: null } as AthleteProfile;
}

// ── Update athlete (admin) ────────────────────────────────────────────────────

export async function updateAthlete(
  slug: string,
  input: UpdateAthleteInput
): Promise<AthleteProfile> {
  const [existing] = await db
    .select({ id: athletes.id })
    .from(athletes)
    .where(eq(athletes.slug, slug));

  if (!existing) throw new AppError(404, 'Athlete not found', 'ATHLETE_NOT_FOUND');

  await db
    .update(athletes)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(athletes.slug, slug));

  return getAthleteBySlug(slug);
}