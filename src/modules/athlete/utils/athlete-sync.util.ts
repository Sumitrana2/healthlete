import { isReportSynced } from "./report-state.util";

type PlatformLinkLike = {
  reportState?: string | null;
};

export function calculateAthleteSyncStats(platformLinks: PlatformLinkLike[]) {
  const totalPlatforms = platformLinks.length;
  const connectedPlatforms = platformLinks.filter((link) =>
    isReportSynced(link.reportState),
  ).length;
  const syncProgress =
    totalPlatforms > 0
      ? Math.round((connectedPlatforms / totalPlatforms) * 100)
      : 0;

  return {
    connectedPlatforms,
    totalPlatforms,
    syncProgress,
  };
}

export function enrichAthleteWithSync<
  T extends { platformLinks?: PlatformLinkLike[] },
>(athlete: T) {
  const platformLinks = athlete.platformLinks ?? [];

  return {
    ...athlete,
    platformLinks,
    ...calculateAthleteSyncStats(platformLinks),
  };
}
