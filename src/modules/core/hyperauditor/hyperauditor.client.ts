import { AppError } from "../../../middleware/errorHandler";

const BASE_URL = "https://hypeauditor.com/api/method";
export interface NormalizedReportData {
  profile_url?: string;
  world_ranking?: number | null;
  raw: unknown;
}

function normalizeInstagram(raw: any): NormalizedReportData {
  return {
    profile_url: "https://www.instagram.com/" + raw?.user?.username,
    world_ranking: raw?.user?.blogger_rankings?.worldwide?.rank ?? null,
    raw,
  };
}

function normalizeYoutube(raw: any): NormalizedReportData {
  return {
    profile_url: "https://www.youtube.com/@" + raw?.report?.basic?.username,
    world_ranking: raw?.report?.features?.blogger_rankings?.data?.worldwide?.rank ?? null,
    raw,
  };
}

function normalizeTwitter(raw: any): NormalizedReportData {
  return {
    profile_url: "https://x.com/" + raw?.report?.basic?.username,
    world_ranking: raw?.report?.features?.blogger_rankings?.data?.worldwide?.rank ?? null,
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


export async function fetchInstagramMediaReport(username: string): Promise<any> {
  const url = new URL(`${BASE_URL}/auditor.reportMedia/`);
  url.searchParams.set("username", username);
  return callHyperAuditor(url);
}