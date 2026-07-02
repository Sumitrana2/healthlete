export const CACHE_KEYS = {
  TAXONOMY_ALL: "taxonomy:all",
  TAXONOMY_PLATFORM: (platform: string, kind: string) =>
    `taxonomy:${platform}:${kind}`,
} as const;

export const CACHE_TTL = {
  TAXONOMY: 60 * 60 * 24,
} as const;
