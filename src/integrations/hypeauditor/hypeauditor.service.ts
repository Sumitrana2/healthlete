import { Injectable } from "@nestjs/common";
import { env } from "../../config/env";
import { AppError } from "../../common/exceptions/app.error";
import { HypeAuditorPlatform } from "./types/hypeauditor.types";
import {
  HypeAuditorCreatorsResponse,
  HypeAuditorReportPayload,
  HypeAuditorReportResponse,
  HypeAuditorSuggesterResponse,
} from "./types/hypeauditor.types";

@Injectable()
export class HypeAuditorService {
  private readonly baseUrl = "https://hypeauditor.com/api/method";

  private ensureConfigured() {
    if (!env.HYPEAUDITOR_AUTH_TOKEN || !env.HYPEAUDITOR_AUTH_ID) {
      throw new AppError(
        503,
        "HypeAuditor integration is not configured",
        "HYPEAUDITOR_NOT_CONFIGURED",
      );
    }
  }

  private authHeaders(): Record<string, string> {
    return {
      "X-Auth-Token": env.HYPEAUDITOR_AUTH_TOKEN!,
      "X-Auth-Id": env.HYPEAUDITOR_AUTH_ID!,
      Accept: "application/json",
    };
  }

  private async parseResponse(response: Response, context: string) {
    const body = await response.text();

    if (!response.ok) {
      throw new AppError(
        502,
        `HypeAuditor ${context} failed: ${response.status}`,
        "HYPEAUDITOR_API_ERROR",
        body,
      );
    }

    let data: HypeAuditorReportResponse;
    try {
      data = JSON.parse(body) as HypeAuditorReportResponse;
    } catch {
      throw new AppError(
        502,
        `HypeAuditor ${context} returned invalid JSON`,
        "HYPEAUDITOR_API_ERROR",
        body,
      );
    }

    if (data.exc) {
      throw new AppError(
        502,
        data.message ?? `HypeAuditor ${context} error`,
        "HYPEAUDITOR_API_ERROR",
        data.exc,
      );
    }

    return data;
  }

  private async getReport(
    path: string,
    params: Record<string, string>,
    context: string,
  ): Promise<HypeAuditorReportPayload> {
    this.ensureConfigured();

    const url = new URL(`${this.baseUrl}/${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.authHeaders(),
    });

    const data = await this.parseResponse(response, context);
    return (data.result ?? data) as HypeAuditorReportPayload;
  }

  private async postReport(
    path: string,
    body: Record<string, string>,
    context: string,
  ): Promise<HypeAuditorReportPayload> {
    this.ensureConfigured();

    const response = await fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        ...this.authHeaders(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(body).toString(),
    });

    const data = await this.parseResponse(response, context);
    return (data.result ?? data) as HypeAuditorReportPayload;
  }

  async searchAthletes(search: string, st = "", exclSt = "") {
    this.ensureConfigured();

    const url = new URL(`${this.baseUrl}/auditor.suggester`);
    url.searchParams.set("search", search);
    url.searchParams.set("st", st);
    url.searchParams.set("exclSt", exclSt);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.authHeaders(),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new AppError(
        502,
        `HypeAuditor request failed: ${response.status}`,
        "HYPEAUDITOR_API_ERROR",
        body,
      );
    }

    const data = (await response.json()) as HypeAuditorSuggesterResponse;
    return data.result?.list ?? [];
  }

  async getCreatorsByAccounts(
    accounts: Array<{ social_type: string; social_id: string }>,
  ) {
    this.ensureConfigured();

    if (accounts.length === 0) {
      return [];
    }

    const url = new URL(`${this.baseUrl}/auditor.creators`);
    url.searchParams.set("limit", "20");
    // Live HypeAuditor API expects a bare JSON array:
    // [{"social_type":"twitter","social_id":"..."}]
    // The docs example {"creators":[...]} returns 400.
    url.searchParams.set("creator_accounts", JSON.stringify(accounts));

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: this.authHeaders(),
    });

    const body = await response.text();
    let data: HypeAuditorCreatorsResponse & {
      error?: { code?: number; description?: string };
    };

    try {
      data = JSON.parse(body) as typeof data;
    } catch {
      throw new AppError(
        502,
        "HypeAuditor creators returned invalid JSON",
        "HYPEAUDITOR_API_ERROR",
        body,
      );
    }

    if (!response.ok || data.error) {
      throw new AppError(
        502,
        data.error?.description ??
          `HypeAuditor creators request failed: ${response.status}`,
        "HYPEAUDITOR_API_ERROR",
        data.error ?? body,
      );
    }

    return data.result?.creators ?? [];
  }

  fetchInstagramReport(userId: string) {
    return this.getReport(
      "auditor.reportByUserId",
      { user_id: userId },
      "Instagram report",
    );
  }

  fetchYoutubeReport(channel: string) {
    return this.postReport(
      "auditor.youtube",
      { channel, type: "advanced_report" },
      "YouTube report",
    );
  }

  fetchTiktokReport(userId: string) {
    return this.postReport(
      "auditor.tiktokByUserId",
      { user_id: userId },
      "TikTok report",
    );
  }

  fetchTwitterReport(channel: string) {
    return this.postReport(
      "auditor.twitter",
      { channel },
      "Twitter report",
    );
  }

  /** Instagram media report (captions) used for resonance — Node parity. */
  fetchInstagramMediaReport(username: string) {
    return this.getReport(
      "auditor.reportMedia",
      { username },
      "Instagram media report",
    );
  }

  fetchPlatformReport(
    platform: HypeAuditorPlatform,
    socialId: string,
    username: string,
  ) {
    const channel = username || socialId;

    switch (platform) {
      case "instagram":
        return this.fetchInstagramReport(socialId);
      case "youtube":
        return this.fetchYoutubeReport(channel);
      case "tiktok":
        return this.fetchTiktokReport(socialId);
      case "twitter":
        return this.fetchTwitterReport(channel);
      default:
        throw new AppError(
          400,
          `Unsupported platform for sync: ${platform}`,
          "UNSUPPORTED_PLATFORM",
        );
    }
  }
}
