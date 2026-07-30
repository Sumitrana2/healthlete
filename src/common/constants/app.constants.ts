export const AUTH = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_DURATION_MS: 24 * 60 * 60 * 1000,
  MAX_SESSIONS: 3,
  REFRESH_EXPIRES_DAYS: 30,
  ACCESS_TOKEN_MAX_AGE_MS: 15 * 60 * 1000,
  REFRESH_TOKEN_MAX_AGE_MS: 30 * 24 * 60 * 60 * 1000,
} as const;

export const CACHE_TTL = {
  DEFAULT: 60 * 60,
  TAXONOMY: 60 * 60 * 24,
} as const;

export const CACHE_KEYS = {
  TAXONOMY_ALL: "taxonomy:all",
  TAXONOMY_PLATFORM: (platform: string, kind: string) =>
    `taxonomy:${platform}:${kind}`,
} as const;

export const RATE_LIMIT = {
    GLOBAL_WINDOW_MS: 60 * 1000,
    GLOBAL_MAX: 1000,
  
    AUTH_WINDOW_MS: 60 * 1000,
    AUTH_MAX: 50,
  
    OTP_WINDOW_MS: 60 * 1000,
    OTP_MAX: 20,
  } as const;