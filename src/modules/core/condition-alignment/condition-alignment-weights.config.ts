// core/condition-alignment/condition-alignment-weights.config.ts

import type { ConditionAlignmentWeights } from "./condition-alignment.types";

export const CONDITION_ALIGNMENT_WEIGHTS: ConditionAlignmentWeights = {
  instagram: {
    categoryMatch: 40,
    bioMatch: 35,
    interestMatch: 25,
  },
  youtube: {
    categoryMatch: 40,
    bioMatch: 35,
    interestMatch: 25,
  },
  twitter: {
    bioMatch: 100,   // Twitter pe sirf bio match hoga
  },
};