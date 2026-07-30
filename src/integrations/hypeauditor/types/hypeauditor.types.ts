export type HypeAuditorPlatform = "instagram" | "youtube" | "twitter" | "tiktok";

export interface HypeAuditorSocialNetwork {
  type: string;
  title: string;
  social_id: string;
  username: string;
  avatar_url: string;
  subscribers_count: number;
  er?: number;
  state?: string;
}

export interface HypeAuditorSuggesterItem {
  title: string;
  avatar_url: string;
  subscribers_count: number;
  is_private: boolean;
  is_verified: boolean;
  social_networks: HypeAuditorSocialNetwork[];
  username: string;
  user_id: string;
  type: string;
}

export interface HypeAuditorSuggesterResponse {
  result: {
    list: HypeAuditorSuggesterItem[];
  };
}

export interface HypeAuditorCreatorAccount {
  id: string;
  title: string;
  social_network: string;
  subscribers_count: number;
  username: string;
  avatar_url: string;
  is_report_unlocked?: boolean;
  report_unlock_date?: string;
}

export interface HypeAuditorCreatorLocation {
  title?: string;
  code?: string;
}

export interface HypeAuditorCreator {
  id: number;
  avatar_url: string;
  first_name: string;
  last_name: string;
  bio?: string;
  gender?: string;
  language?: string;
  emails?: string[];
  phones?: string[];
  country?: HypeAuditorCreatorLocation | null;
  city?: HypeAuditorCreatorLocation | null;
  accounts: HypeAuditorCreatorAccount[];
  [key: string]: unknown;
}

export interface HypeAuditorCreatorsResponse {
  result: {
    creators: HypeAuditorCreator[];
    next_cursor?: string;
  };
}

export type HypeAuditorReportPayload = Record<string, unknown>;

export interface HypeAuditorReportResponse {
  result?: HypeAuditorReportPayload;
  message?: string;
  exc?: string;
}
