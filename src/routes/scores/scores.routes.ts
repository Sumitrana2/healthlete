import { Router, Request, Response } from 'express';
import { db } from '../../db';
import { athleteScores, athletes } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

// GET /scores/:athleteId — latest scores for an athlete
router.get('/:athleteId', async (req: Request, res: Response, next) => {
  try {
    const { athleteId } = req.params;

    const [athlete] = await db.select({ id: athletes.id }).from(athletes).where(eq(athletes.id, athleteId as string));
    if (!athlete) throw new AppError(404, 'Athlete not found', 'ATHLETE_NOT_FOUND');

    const [score] = await db
      .select()
      .from(athleteScores)
      .where(eq(athleteScores.athleteId, athleteId as string))
      .orderBy(athleteScores.computedAt)
      .limit(1);

    res.json({ success: true, data: score ?? null });
  } catch (err) {
    next(err);
  }
});

export default router;
