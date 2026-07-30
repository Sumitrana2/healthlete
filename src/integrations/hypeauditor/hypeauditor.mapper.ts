/** Map raw HypeAuditor payloads into internal shapes. */
export function mapHypeAuditorSearchItem(item: Record<string, unknown>) {
  return {
    platform: String(item.platform ?? item.type ?? ""),
    username: String(item.username ?? ""),
    socialId: String(item.social_id ?? item.user_id ?? ""),
    displayTitle: String(item.display_title ?? item.title ?? ""),
    avatarUrl: String(item.avatar_url ?? ""),
    subscribersCount: Number(item.subscribers_count ?? 0),
    isVerified: Boolean(item.is_verified),
  };
}
