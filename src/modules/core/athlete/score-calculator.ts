// core/athlete/score-calculator.ts

interface ScoreInputs {
    credibilityScore?: number | null;
    resonanceAvgScore?: number | null;
    resonanceMaxScore?: number | null;
    audienceTrustScore?: number | null;
  }
  
  const SCORE_WEIGHTS = {
    credibility: 0.35,
    resonance: 0.35,     // resonanceAvg use karenge weighted score mein
    audienceTrust: 0.30,
  };
  
  export function calculateOverallScore(inputs: ScoreInputs): number {
    const scores = [
      { value: inputs.credibilityScore, weight: SCORE_WEIGHTS.credibility },
      { value: inputs.resonanceAvgScore, weight: SCORE_WEIGHTS.resonance },
      { value: inputs.audienceTrustScore, weight: SCORE_WEIGHTS.audienceTrust },
    ].filter((s) => s.value !== null && s.value !== undefined);
  
    if (!scores.length) return 0;
  
    // Weights ko re-normalize karo agar koi score missing hai
    const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  
    const weightedSum = scores.reduce(
      (sum, s) => sum + (s.value as number) * s.weight,
      0
    );
  
    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }