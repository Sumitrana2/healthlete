import { Injectable } from "@nestjs/common";
import { ScoreEngineService } from "../../scoring/services/score-engine.service";

/**
 * Athlete-facing facade over the scoring engine.
 * Recalculates and returns aggregated athlete scores after sync.
 */
@Injectable()
export class AthleteScoreService {
  constructor(private readonly scoreEngineService: ScoreEngineService) {}

  recalculateForAthlete(athleteId: string) {
    return this.scoreEngineService.recalculateForAthlete(athleteId);
  }
}
