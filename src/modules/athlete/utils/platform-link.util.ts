import { HypeAuditorCreator, HypeAuditorCreatorAccount, HypeAuditorPlatform } from "../../../integrations/hypeauditor/types/hypeauditor.types";
import { SelectedAthleteAccountInput } from "../dto/admin-athlete.dto";
import type { CanonicalReportState } from "./report-state.util";

const SUPPORTED_PLATFORMS = new Set<HypeAuditorPlatform>([
  "instagram",
  "youtube",
  "twitter",
  "tiktok",
]);

export function normalizePlatform(type: string): HypeAuditorPlatform | null {
  const value = type.trim().toLowerCase();

  if (value === "x" || value === "twitter/x" || value === "twitter_x") {
    return "twitter";
  }

  return SUPPORTED_PLATFORMS.has(value as HypeAuditorPlatform)
    ? (value as HypeAuditorPlatform)
    : null;
}

export function buildProfileUrl(platform: HypeAuditorPlatform, username: string) {
  switch (platform) {
    case "instagram":
      return `https://instagram.com/${username}`;
    case "twitter":
      return `https://x.com/${username}`;
    case "tiktok":
      return `https://tiktok.com/@${username}`;
    case "youtube":
      return `https://youtube.com/@${username}`;
    default:
      return null;
  }
}

export type PlatformLinkDraft = {
  platform: HypeAuditorPlatform;
  socialId: string;
  username: string;
  title: string;
  avatarUrl?: string;
  subscribersCount: number;
  isVerified: boolean;
  isPrimary: boolean;
  reportState: CanonicalReportState;
};

export function buildPlatformLinkDrafts(
  selectedAccounts: SelectedAthleteAccountInput[],
  creatorProfile?: HypeAuditorCreator | null,
  options?: { primaryPlatform?: HypeAuditorPlatform; primarySocialId?: string },
) {
  const primarySelected = selectedAccounts.reduce((best, current) =>
    current.subscribers_count > best.subscribers_count ? current : best,
  );
  const primaryPlatform =
    options?.primaryPlatform ?? normalizePlatform(primarySelected.type)!;
  const primarySocialId = options?.primarySocialId ?? primarySelected.user_id;

  const linksToCreate = new Map<string, PlatformLinkDraft>();

  const addLink = (
    platform: HypeAuditorPlatform,
    socialId: string,
    username: string,
    title: string,
    subscribersCount: number,
    isVerified: boolean,
    isPrimary: boolean,
    avatarUrl?: string,
    reportState: PlatformLinkDraft["reportState"] = "not_synced",
  ) => {
    const key = `${platform}:${socialId}`;
    if (linksToCreate.has(key)) return;

    linksToCreate.set(key, {
      platform,
      socialId,
      username,
      title,
      avatarUrl,
      subscribersCount,
      isVerified,
      isPrimary,
      reportState,
    });
  };

  const creatorAccountByKey = new Map<string, HypeAuditorCreatorAccount>();
  if (creatorProfile?.accounts?.length) {
    for (const account of creatorProfile.accounts) {
      const platform = normalizePlatform(account.social_network);
      if (!platform) continue;
      creatorAccountByKey.set(`${platform}:${account.id}`, account);
    }
  }

  for (const account of selectedAccounts) {
    const platform = normalizePlatform(account.type);
    if (!platform) continue;

    const key = `${platform}:${account.user_id}`;
    const creatorAccount = creatorAccountByKey.get(key);

    if (creatorAccount) {
      addLink(
        platform,
        creatorAccount.id,
        creatorAccount.username,
        creatorAccount.title,
        creatorAccount.subscribers_count,
        account.is_verified ?? false,
        platform === primaryPlatform && creatorAccount.id === primarySocialId,
        creatorAccount.avatar_url,
        "not_synced",
      );
      continue;
    }

    addLink(
      platform,
      account.user_id,
      account.username,
      account.title,
      account.subscribers_count,
      account.is_verified ?? false,
      platform === primaryPlatform && account.user_id === primarySocialId,
      account.avatar_url,
    );
  }

  return [...linksToCreate.values()];
}
