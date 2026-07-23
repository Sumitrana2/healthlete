import { relations } from "drizzle-orm";
import {
  brands,
  brandApprovalLogs,
  companies,
  brandHealthConditions,
  brandCampaignObjectives,
  brandPreferredChannels,
  brandRequiredLanguages,
  industries,
  healthConditions,
  campaignObjectives,
  preferredChannels,
  athleteLanguages,
  companySizes,
} from "./brands";
import { platformTaxonomy, brandTaxonomySelections } from "./taxonomy";
import {
  otpVerifications,
  socialProviders,
  refreshTokens,
  authLogs,
} from "./auth";
import { athletes } from "./athletes";
import { athletePlatformLinks } from "./athlete-platform-links";
import { athleteFinalScores } from "./athlete-final-scores";
import { instagramRawData, instagramScores } from "./instagram";
import { youtubeRawData, youtubeScores } from "./youtube";
import { twitterRawData, twitterScores } from "./twitter";

import { admins } from "./admins";
import {
  adminOtpVerifications,
  adminRefreshTokens,
  adminAuthLogs,
} from "./admin-auth";
import { athleteProviders } from "./athlete-providers";
import { athleteHealthConditions } from "./athlete-health-conditions";

// ── Brands ────────────────────────────────────────────────────────────────────
// export const brandsRelations = relations(brands, ({ many }) => ({
//   approvalLogs: many(brandApprovalLogs),
//   taxonomySelections: many(brandTaxonomySelections),
//   otpVerifications: many(otpVerifications),
//   socialProviders: many(socialProviders),
//   refreshTokens: many(refreshTokens),
//   authLogs: many(authLogs),
// }));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  company: one(companies, {
    fields: [brands.companyId],
    references: [companies.id],
  }),

  healthConditions: many(brandHealthConditions),

  campaignObjectives: many(brandCampaignObjectives),

  preferredChannels: many(brandPreferredChannels),

  requiredLanguages: many(brandRequiredLanguages),

  approvalLogs: many(brandApprovalLogs),
  taxonomySelections: many(brandTaxonomySelections),
  otpVerifications: many(otpVerifications),
  socialProviders: many(socialProviders),
  refreshTokens: many(refreshTokens),
  authLogs: many(authLogs),
}));
export const companiesRelations = relations(companies, ({ one, many }) => ({
  industry: one(industries, {
    fields: [companies.industryId],
    references: [industries.id],
  }),
  brands: many(brands),
  companySize: one(companySizes, {
    fields: [companies.companySizeId],
    references: [companySizes.id],
  }),
}));

export const brandHealthConditionsRelations = relations(
  brandHealthConditions,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandHealthConditions.brandId],
      references: [brands.id],
    }),

    healthCondition: one(healthConditions, {
      fields: [brandHealthConditions.healthConditionId],
      references: [healthConditions.id],
    }),
  })
);
export const brandCampaignObjectivesRelations = relations(
  brandCampaignObjectives,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandCampaignObjectives.brandId],
      references: [brands.id],
    }),

    campaignObjective: one(campaignObjectives, {
      fields: [brandCampaignObjectives.campaignObjectiveId],
      references: [campaignObjectives.id],
    }),
  })
);
export const brandPreferredChannelsRelations = relations(
  brandPreferredChannels,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandPreferredChannels.brandId],
      references: [brands.id],
    }),

    channel: one(preferredChannels, {
      fields: [brandPreferredChannels.channelId],
      references: [preferredChannels.id],
    }),
  })
);
export const brandRequiredLanguagesRelations = relations(
  brandRequiredLanguages,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandRequiredLanguages.brandId],
      references: [brands.id],
    }),

    language: one(athleteLanguages, {
      fields: [brandRequiredLanguages.languageId],
      references: [athleteLanguages.id],
    }),
  })
);
// ── Brand Approval Logs ───────────────────────────────────────────────────────
export const brandApprovalLogsRelations = relations(
  brandApprovalLogs,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandApprovalLogs.brandId],
      references: [brands.id],
    }),
  })
);

// ── Platform Taxonomy ─────────────────────────────────────────────────────────
export const platformTaxonomyRelations = relations(
  platformTaxonomy,
  ({ many }) => ({
    brandSelections: many(brandTaxonomySelections),
  })
);

// ── Brand Taxonomy Selections ─────────────────────────────────────────────────
export const brandTaxonomySelectionsRelations = relations(
  brandTaxonomySelections,
  ({ one }) => ({
    brand: one(brands, {
      fields: [brandTaxonomySelections.brandId],
      references: [brands.id],
    }),
    taxonomy: one(platformTaxonomy, {
      fields: [brandTaxonomySelections.taxonomyId],
      references: [platformTaxonomy.id],
    }),
  })
);

// ── OTP Verifications ─────────────────────────────────────────────────────────
export const otpVerificationsRelations = relations(
  otpVerifications,
  ({ one }) => ({
    brand: one(brands, {
      fields: [otpVerifications.brandId],
      references: [brands.id],
    }),
  })
);

// ── Social Providers ──────────────────────────────────────────────────────────
export const socialProvidersRelations = relations(
  socialProviders,
  ({ one }) => ({
    brand: one(brands, {
      fields: [socialProviders.brandId],
      references: [brands.id],
    }),
  })
);

// ── Refresh Tokens ────────────────────────────────────────────────────────────
export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  brand: one(brands, {
    fields: [refreshTokens.brandId],
    references: [brands.id],
  }),
}));

// ── Auth Logs ─────────────────────────────────────────────────────────────────
export const authLogsRelations = relations(authLogs, ({ one }) => ({
  brand: one(brands, { fields: [authLogs.brandId], references: [brands.id] }),
}));

// scoring relations
export const athletesRelations = relations(athletes, ({ many, one }) => ({
  platformLinks: many(athletePlatformLinks),
  providers: many(athleteProviders),
  healthConditions: many(athleteHealthConditions), 
  finalScore: one(athleteFinalScores),
}));
export const athleteHealthConditionsRelations = relations(
  athleteHealthConditions,
  ({ one }) => ({
    athlete: one(athletes, {
      fields: [athleteHealthConditions.athleteId],
      references: [athletes.id],
    }),
    healthCondition: one(healthConditions, {
      fields: [athleteHealthConditions.healthConditionId],
      references: [healthConditions.id],
    }),
  })
);
export const athleteProvidersRelations = relations(
  athleteProviders,
  ({ one }) => ({
    athlete: one(athletes, {
      fields: [athleteProviders.athleteId],
      references: [athletes.id],
    }),
  })
);

export const athletePlatformLinksRelations = relations(
  athletePlatformLinks,
  ({ one, many }) => ({
    athlete: one(athletes, {
      fields: [athletePlatformLinks.athleteId],
      references: [athletes.id],
    }),

    instagramRawData: many(instagramRawData),
    instagramScores: many(instagramScores),

    youtubeRawData: many(youtubeRawData),
    youtubeScores: many(youtubeScores),

    twitterRawData: many(twitterRawData),
    twitterScores: many(twitterScores),
  })
);
export const athleteFinalScoresRelations = relations(
  athleteFinalScores,
  ({ one }) => ({
    athlete: one(athletes, {
      fields: [athleteFinalScores.athleteId],
      references: [athletes.id],
    }),
  })
);
export const instagramRawDataRelations = relations(
  instagramRawData,
  ({ one }) => ({
    platformLink: one(athletePlatformLinks, {
      fields: [instagramRawData.linkId],
      references: [athletePlatformLinks.id],
    }),
  })
);
export const youtubeRawDataRelations = relations(youtubeRawData, ({ one }) => ({
  platformLink: one(athletePlatformLinks, {
    fields: [youtubeRawData.linkId],
    references: [athletePlatformLinks.id],
  }),
}));
export const youtubeScoresRelations = relations(youtubeScores, ({ one }) => ({
  platformLink: one(athletePlatformLinks, {
    fields: [youtubeScores.linkId],
    references: [athletePlatformLinks.id],
  }),
}));
export const twitterRawDataRelations = relations(twitterRawData, ({ one }) => ({
  platformLink: one(athletePlatformLinks, {
    fields: [twitterRawData.linkId],
    references: [athletePlatformLinks.id],
  }),
}));
export const twitterScoresRelations = relations(twitterScores, ({ one }) => ({
  platformLink: one(athletePlatformLinks, {
    fields: [twitterScores.linkId],
    references: [athletePlatformLinks.id],
  }),
}));
// ############################# Admin ########################################

// ── Admins ────────────────────────────────────────────────────────────────────
export const adminsRelations = relations(admins, ({ many }) => ({
  otpVerifications: many(adminOtpVerifications),
  refreshTokens: many(adminRefreshTokens),
  authLogs: many(adminAuthLogs),
}));

// ── Admin OTP ─────────────────────────────────────────────────────────────────
export const adminOtpRelations = relations(
  adminOtpVerifications,
  ({ one }) => ({
    admin: one(admins, {
      fields: [adminOtpVerifications.adminId],
      references: [admins.id],
    }),
  })
);

// ── Admin Refresh Tokens ──────────────────────────────────────────────────────
export const adminRefreshTokensRelations = relations(
  adminRefreshTokens,
  ({ one }) => ({
    admin: one(admins, {
      fields: [adminRefreshTokens.adminId],
      references: [admins.id],
    }),
  })
);

// ── Admin Auth Logs ───────────────────────────────────────────────────────────
export const adminAuthLogsRelations = relations(adminAuthLogs, ({ one }) => ({
  admin: one(admins, {
    fields: [adminAuthLogs.adminId],
    references: [admins.id],
  }),
}));
