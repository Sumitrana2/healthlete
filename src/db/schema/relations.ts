import { relations } from "drizzle-orm";
import { brands, brandApprovalLogs } from "./brands";
import { platformTaxonomy, brandTaxonomySelections } from "./taxonomy";
import {
  otpVerifications,
  socialProviders,
  refreshTokens,
  authLogs,
} from "./auth";

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
