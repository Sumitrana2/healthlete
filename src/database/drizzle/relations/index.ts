import { relations } from "drizzle-orm";
import { brands, brandApprovalLogs } from "../schema/brands";
import { platformTaxonomy, brandTaxonomySelections } from "../schema/taxonomy";
import {
  otpVerifications,
  socialProviders,
  refreshTokens,
  authLogs,
} from "../schema/auth";
import { athletes } from "../schema/athletes";
import { athletePlatformLinks } from "../schema/athlete-platform-links";
import { athleteFinalScores } from "../schema/athlete-final-scores";
import { instagramRawData, instagramScores } from "../schema/instagram";
import { youtubeRawData, youtubeScores } from "../schema/youtube";
import { twitterRawData, twitterScores } from "../schema/twitter";

import { admins } from "../schema/admins";
import {
  adminOtpVerifications,
  adminRefreshTokens,
  adminAuthLogs,
} from "../schema/admin-auth";

// ── Brands ────────────────────────────────────────────────────────────────────
export const brandsRelations = relations(brands, ({ many }) => ({
  approvalLogs: many(brandApprovalLogs),
  taxonomySelections: many(brandTaxonomySelections),
  otpVerifications: many(otpVerifications),
  socialProviders: many(socialProviders),
  refreshTokens: many(refreshTokens),
  authLogs: many(authLogs),
}));

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

  finalScore: one(athleteFinalScores),
}));

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
