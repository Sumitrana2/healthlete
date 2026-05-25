import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { athletes, athleteScores } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

// GET /athletes — list all athletes with basic info
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const { sport, country, health_category, limit = '20', offset = '0' } = req.query;

    // Build dynamic query (extend with drizzle .where() chains as needed)
    const rows = await db.select({
      id: athletes.id,
      slug: athletes.slug,
      displayName: athletes.displayName,
      firstName: athletes.firstName,
      lastName: athletes.lastName,
      sport: athletes.sport,
      country: athletes.country,
      healthCategories: athletes.healthCategories,
      profileImageUrl: athletes.profileImageUrl,
      isVerified: athletes.isVerified,
      isFeatured: athletes.isFeatured,
    })
    .from(athletes)
    .where(eq(athletes.status, 'active' as const))
    .limit(Number(limit))
    .offset(Number(offset));

    res.json({ success: true, data: rows, meta: { limit: Number(limit), offset: Number(offset) } });
  } catch (err) {
    next(err);
  }
});

// GET /athletes/:slug — full athlete profile
router.get('/:slug', async (req: Request, res: Response, next) => {
  try {
    const { slug } = req.params;

    const [athlete] = await db.select().from(athletes).where(eq(athletes.slug, slug as string));
    if (!athlete) throw new AppError(404, 'Athlete not found', 'ATHLETE_NOT_FOUND');

    const scores = await db
      .select()
      .from(athleteScores)
      .where(eq(athleteScores.athleteId, athlete.id))
      .orderBy(athleteScores.computedAt)
      .limit(1);

    res.json({ success: true, data: { ...athlete, scores: scores[0] ?? null } });
  } catch (err) {
    next(err);
  }
});

export default router;
