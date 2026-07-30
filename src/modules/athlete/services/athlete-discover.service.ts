import { Injectable } from "@nestjs/common";
import { AthleteDiscoverRepository } from "../repositories/athlete-discover.repository";
import { ConditionAlignmentService } from "../../scoring/services/condition-alignment.service";
import type { ConditionAlignmentResult } from "../../scoring/types/condition-alignment.types";
import type { BrandAthletesListQuery } from "../dto/brand-athlete.dto";

const MATCH_WEIGHTS = {
  conditionAlignment: 0.25,
  credibility: 0.25,
  audienceTrust: 0.25,
  resonance: 0.25,
};

function calculateMatchScore(
  scores: {
    credibilityScore: number;
    audienceTrustScore: number;
    resonanceScore: number;
  },
  conditionAlignmentScore: number,
): number {
  const score =
    conditionAlignmentScore * MATCH_WEIGHTS.conditionAlignment +
    scores.credibilityScore * MATCH_WEIGHTS.credibility +
    scores.audienceTrustScore * MATCH_WEIGHTS.audienceTrust +
    scores.resonanceScore * MATCH_WEIGHTS.resonance;

  return Math.round(score * 100) / 100;
}

@Injectable()
export class AthleteDiscoverService {
  constructor(
    private readonly discoverRepository: AthleteDiscoverRepository,
    private readonly conditionAlignmentService: ConditionAlignmentService,
  ) {}

  async listSynced(query: BrandAthletesListQuery, brandId?: string) {
    const result = await this.discoverRepository.findSyncedAthletes(query);

    if (!brandId || !Array.isArray(result.items) || !result.items.length) {
      return result;
    }

    // Batch condition alignment for this page (brand once + batch queries)
    let alignmentByAthleteId = new Map<string, ConditionAlignmentResult>();
    try {
      alignmentByAthleteId =
        await this.conditionAlignmentService.calculateConditionAlignmentScoresForAthletes(
          brandId,
          result.items.map((athlete) => athlete.id),
        );
    } catch {
      // Keep list resilient if batch alignment fails
      return result;
    }

    const items = result.items.map((athlete) => {
      const conditionAlignmentResult = alignmentByAthleteId.get(athlete.id);
      if (!conditionAlignmentResult) return athlete;
      return this.enrichAthleteWithConditionAlignment(
        athlete,
        conditionAlignmentResult,
      );
    });

    return {
      ...result,
      items,
    };
  }

  private enrichAthleteWithConditionAlignment(
    athlete: any,
    conditionAlignmentResult: ConditionAlignmentResult,
  ) {
    const resonanceScore = Number(athlete.finalScore?.resonanceScore ?? 0) || 0;
    const credibilityScore =
      Number(athlete.finalScore?.credibilityScore ?? 0) || 0;
    const audienceTrustScore =
      Number(athlete.finalScore?.audienceTrustScore ?? 0) || 0;
    const brandOverSafetyScore =
      Number(athlete.finalScore?.brandOverSafetyScore ?? 0) || 0;
    const conditionAlignmentScore = Math.round(
      conditionAlignmentResult.overallScore,
    );
    const matchScore =
      conditionAlignmentResult.overallScore > 0
        ? calculateMatchScore(
            { credibilityScore, audienceTrustScore, resonanceScore },
            conditionAlignmentResult.overallScore,
          )
        : calculateMatchScore(
            { credibilityScore, audienceTrustScore, resonanceScore },
            conditionAlignmentScore,
          );

    const existingBreakdown =
      typeof athlete.finalScore?.scoreBreakdown === "object" &&
      athlete.finalScore?.scoreBreakdown !== null
        ? athlete.finalScore.scoreBreakdown
        : {};

    return {
      ...athlete,
      finalScore: {
        ...(athlete.finalScore ?? {}),
        healthleteMatchScore: matchScore,
        resonanceScore,
        credibilityScore,
        audienceTrustScore,
        brandOverSafetyScore,
        conditionAlignmentScore,
        match: matchScore,
        resonance: resonanceScore,
        credibility: credibilityScore,
        trust: audienceTrustScore,
        scoreBreakdown: {
          ...existingBreakdown,
          conditionAlignment: {
            overallScore: conditionAlignmentResult.overallScore,
            breakdown: conditionAlignmentResult.breakdown,
            details: conditionAlignmentResult.details,
          },
        },
      },
      score: matchScore,
      healthleteScore: matchScore,
      matchScore,
      match: matchScore,
      resonance: resonanceScore,
      credibility: credibilityScore,
      trust: audienceTrustScore,
    };
  }
}
