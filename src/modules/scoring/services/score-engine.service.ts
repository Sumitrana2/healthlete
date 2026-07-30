import { Injectable } from "@nestjs/common";
import { AthleteSyncRepository } from "../../athlete/repositories/athlete-sync.repository";
import { clampDecimalScore } from "../utils/score-normalization.util";
import { isReportSynced } from "../../athlete/utils/report-state.util";

function parseScore(value: string | null | undefined) {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function weightedAverage(
  entries: Array<{ value: number | null; weight: number }>,
) {
  let sum = 0;
  let weight = 0;

  for (const entry of entries) {
    if (entry.value === null || entry.weight <= 0) continue;
    sum += entry.value * entry.weight;
    weight += entry.weight;
  }

  return weight > 0 ? Number((sum / weight).toFixed(2)) : null;
}

@Injectable()
export class ScoreEngineService {
  constructor(private readonly syncRepository: AthleteSyncRepository) {}

  async recalculateForAthlete(athleteId: string) {
    const links = await this.syncRepository.getPlatformLinksForAthlete(athleteId);
    const completedLinks = links.filter((link) =>
      isReportSynced(link.reportState),
    );
    const platformScores =
      await this.syncRepository.getPlatformScoresForLinks(completedLinks);

    const weightDistribution: Record<string, number> = {};
    const weightedEntries = platformScores.map((score) => {
      const link = completedLinks.find((item) => item.id === score.linkId);
      const weight =
        link?.subscribersCount && link.subscribersCount > 0
          ? link.subscribersCount
          : 1;
      if (link) {
        weightDistribution[link.platform] = weight;
      }

      return {
        weight,
        resonance: parseScore(score.resonanceScore),
        credibility: parseScore(score.credibilityScore),
        audienceTrust: parseScore(score.audienceTrustScore),
        conditionAlignment: parseScore(score.conditionAlignmentScore),
      };
    });

    const resonanceScore = weightedAverage(
      weightedEntries.map((entry) => ({
        value: entry.resonance,
        weight: entry.weight,
      })),
    );
    const credibilityScore = weightedAverage(
      weightedEntries.map((entry) => ({
        value: entry.credibility,
        weight: entry.weight,
      })),
    );
    const audienceTrustScore = weightedAverage(
      weightedEntries.map((entry) => ({
        value: entry.audienceTrust,
        weight: entry.weight,
      })),
    );
    const conditionAlignmentScore = weightedAverage(
      weightedEntries.map((entry) => ({
        value: entry.conditionAlignment,
        weight: entry.weight,
      })),
    );

    const scoreParts = [
      resonanceScore,
      credibilityScore,
      audienceTrustScore,
      conditionAlignmentScore,
    ].filter((value): value is number => value !== null);

    const healthleteMatchScore =
      scoreParts.length > 0
        ? clampDecimalScore(
            scoreParts.reduce((sum, value) => sum + value, 0) / scoreParts.length,
          )
        : null;

    if (
      resonanceScore === null &&
      credibilityScore === null &&
      audienceTrustScore === null &&
      conditionAlignmentScore === null
    ) {
      return null;
    }

    await this.syncRepository.upsertAthleteFinalScores(athleteId, {
      resonanceScore,
      credibilityScore,
      audienceTrustScore,
      conditionAlignmentScore,
      healthleteMatchScore,
      weightDistribution,
    });

    return {
      resonanceScore,
      credibilityScore,
      audienceTrustScore,
      conditionAlignmentScore,
      healthleteMatchScore,
      weightDistribution,
    };
  }
}

/** @deprecated Use ScoreEngineService */
export { ScoreEngineService as AthleteScoreService };
