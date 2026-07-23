import { AppError } from "../../../middleware/errorHandler";

const BASE_URL = "https://hypeauditor.com/api/method";
export interface NormalizedReportData {
  country?: string | null;
  description?: string;
  languages?: string[];
  gender?: string | null;
  profile_url?: string;
  emails?: string[];
  category?: string[];
  world_ranking?: number | null;
  raw: unknown;
}



function normalizeInstagram(raw: any): NormalizedReportData {
  return {
    country: raw?.user?.blogger_geo?.country ?? null,        
    description: raw?.user?.about ?? null,        
    languages: raw?.user?.blogger_languages ?? [],
    gender: raw?.user?.blogger_gender ?? null,
    emails: raw?.user?.emails ?? [],
    category: raw?.user?.advertising_data?.brands_categories ?? [],
    world_ranking: raw?.user?.blogger_rankings.worldwide.rank ?? null,
    profile_url: "https://www.instagram.com/"+raw?.user?.username,
    raw,
  };
}


function normalizeYoutube(raw: any): NormalizedReportData {
  return {
    country: raw?.report?.features?.blogger_geo?.data?.country ?? null,  
    description: raw?.report?.basic?.description ?? null,               
    profile_url: "https://www.youtube.com/@"+raw?.report?.basic?.username,               
    languages: raw?.report?.features?.blogger_languages?.data ?? null,
    gender: raw?.report?.gender ?? null,
    emails: raw?.report?.features?.blogger_emails?.data ?? [],
    category: raw?.report?.category_name ?? [],
    world_ranking: raw?.report?.features?.blogger_rankings?.data?.worldwide?.rank?? null,
    raw,
  };
}

function normalizeTwitter(raw: any): NormalizedReportData {
  return {
    country: raw?.report?.features?.blogger_geo?.data?.country ?? null,  
    description: raw?.report?.basic?.description ?? null,
    profile_url: "https://x.com/"+raw?.report?.basic?.username,               
    languages: raw?.report?.features?.blogger_languages?.data ?? null,
    gender: raw?.report?.gender ?? null,
    emails: raw?.report?.features?.blogger_emails?.data ?? [],
    category: raw?.report?.features?.blogger_rankings?.data?.category?.category?.title ?? [],
    world_ranking: raw?.report?.features?.blogger_rankings?.data?.worldwide?.rank?? null,
    raw,
  };
}

function getAuthHeaders() {
  return {
    "X-Auth-Id": process.env.HYPEAUDITOR_AUTH_ID!,
    "X-Auth-Token": process.env.HYPEAUDITOR_AUTH_TOKEN!,
  };
}



async function callHyperAuditor(url: URL) {
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new AppError(502, `HypeAuditor API failed: ${response.status}`);
  }

  const data = (await response.json()) as { result: any };
  return data.result;
}


export async function searchAthletes(query: string) {
  const url = new URL(`${BASE_URL}/auditor.suggester`);
  url.searchParams.set("search", query);
  url.searchParams.set("st", "");
  url.searchParams.set("exclSt", "");

  const result = await callHyperAuditor(url);
  return result.list as any[];
}

// ---------- Instagram report (user_id se) ----------

export async function fetchInstagramReport(userId: string): Promise<NormalizedReportData> {
  const url = new URL(`${BASE_URL}/auditor.reportByUserId/`);
  url.searchParams.set("user_id", userId);
  url.searchParams.set("v", "2");

  const raw = await callHyperAuditor(url);
  return normalizeInstagram(raw);
}

// ---------- YouTube report (channel se) ----------

export async function fetchYoutubeReport(channel: string): Promise<NormalizedReportData> {
  const url = new URL(`${BASE_URL}/auditor.youtube`);
  url.searchParams.set("channel", channel);
  url.searchParams.set("features", ""); 
  url.searchParams.set("type", "advanced_report");

  const raw = await callHyperAuditor(url);
  return normalizeYoutube(raw);
}

// ---------- Twitter report (channel se) ----------

export async function fetchTwitterReport(channel: string): Promise<NormalizedReportData> {
  const url = new URL(`${BASE_URL}/auditor.twitter/`);
  url.searchParams.set("channel", channel);

  const raw = await callHyperAuditor(url);
  return normalizeTwitter(raw);
}
