import { Module } from "@nestjs/common";
import { DiseaseResonanceService } from "./services/disease-resonance.service";
import { CredibilityService } from "./services/credibility.service";
import { AudienceTrustService } from "./services/audience-trust.service";
import { ConditionAlignmentService } from "./services/condition-alignment.service";
import { PharmaComplianceService } from "./services/pharma-compliance.service";
import { ReputationRiskService } from "./services/reputation-risk.service";
import { MatchScoreService } from "./services/match-score.service";
import { AudienceAlignmentService } from "./services/audience-alignment.service";
import { ConditionAlignmentRepository } from "./repositories/condition-alignment.repository";
import { ResonanceConditionService } from "./services/resonance-condition.service";
import { AiModule } from "../ai/ai.module";

/**
 * Formula / scoring helpers.
 * ScoreEngineService (DB-backed aggregation) is provided by AthleteModule
 * because it depends on athlete sync repositories.
 */
@Module({
  imports: [AiModule],
  providers: [
    DiseaseResonanceService,
    CredibilityService,
    AudienceTrustService,
    ConditionAlignmentRepository,
    ConditionAlignmentService,
    AudienceAlignmentService,
    ResonanceConditionService,
    PharmaComplianceService,
    ReputationRiskService,
    MatchScoreService,
  ],
  exports: [
    DiseaseResonanceService,
    CredibilityService,
    AudienceTrustService,
    ConditionAlignmentService,
    AudienceAlignmentService,
    ResonanceConditionService,
    PharmaComplianceService,
    ReputationRiskService,
    MatchScoreService,
  ],
})
export class ScoringModule {}
