/**
 * Thin HTTP client wrapper for HypeAuditor API.
 * Business orchestration lives in HypeAuditorService.
 */
export class HypeAuditorClient {
  constructor(
    private readonly baseUrl: string,
    private readonly headers: Record<string, string>,
  ) {}

  async get(path: string, params: Record<string, string> = {}) {
    const url = new URL(`${this.baseUrl}/${path}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    return fetch(url, {
      method: "GET",
      headers: this.headers,
    });
  }

  async post(path: string, body: unknown) {
    return fetch(`${this.baseUrl}/${path}`, {
      method: "POST",
      headers: {
        ...this.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  }
}
