// core/audience-trust/instagram-audience-trust.ts

interface InstagramTrustWeights {
    audienceAuthenticity: number;
    audienceReachability: number;
    brandSafety: number;
  }
  
  export function calculateInstagramAudienceTrust(
    raw: any,
    weights: InstagramTrustWeights
  ): { score: number; breakdown: Record<string, number> } {
    // 1. Audience Authenticity
    const authenticityValue = raw?.user?.audience_authenticity?.value ?? 0;
    const authenticityScore = (authenticityValue / 100) * weights.audienceAuthenticity;
  
    // 2. Audience Reachability
    const reachabilityValue = raw?.user?.audience_reachability?.value ?? 0;
    const reachabilityScore = (reachabilityValue / 100) * weights.audienceReachability;
  
    // 3. Brand Safety
    const brandSafetyItems = raw?.user?.brand_safety?.items ?? {};
    const categories = Object.values(brandSafetyItems) as boolean[];
    const totalChecks = categories.length;
    const riskFlags = categories.filter((v) => v === true).length;
  
    let brandSafetyScore = 0;
    if (totalChecks > 0) {
      const safetyRatio = (totalChecks - riskFlags) / totalChecks;
      brandSafetyScore = safetyRatio * weights.brandSafety;
    } else {
      brandSafetyScore = weights.brandSafety / 2;
    }
  
    const totalScore = authenticityScore + reachabilityScore + brandSafetyScore;
  
    return {
      score: Math.round(totalScore * 100) / 100,
      breakdown: {
        audienceAuthenticity: Math.round(authenticityScore * 100) / 100,
        audienceReachability: Math.round(reachabilityScore * 100) / 100,
        brandSafety: Math.round(brandSafetyScore * 100) / 100,
      },
    };
  }